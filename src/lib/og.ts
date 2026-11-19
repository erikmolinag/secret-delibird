import "server-only";

import { lookup } from "node:dns/promises";
import net from "node:net";

import ogs from "open-graph-scraper";

export type Preview = {
  title: string | null;
  /** La primera candidata: la que se usa si no eliges otra. */
  imageUrl: string | null;
  /** Todas las que se encontraron, para poder escoger. */
  imagenes: string[];
  siteName: string | null;
  price: string | null;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

/** Cuantas imagenes se le ofrecen a la gente; mas que eso es ruido. */
const LIMITE = 12;
/** Hasta donde leemos el HTML, para no tragarnos una pagina enorme. */
const MAX_HTML = 4_000_000;
/** Redirecciones que seguimos (las ligas cortas tipo a.co encadenan varias). */
const SALTOS = 4;

function esIpPrivada(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true; // link-local / metadata de la nube
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  const bajo = ip.toLowerCase();
  return (
    bajo === "::1" ||
    bajo === "::" ||
    bajo.startsWith("fc") ||
    bajo.startsWith("fd") ||
    bajo.startsWith("fe80") ||
    bajo.startsWith("::ffff:127.") ||
    bajo.startsWith("::ffff:10.") ||
    bajo.startsWith("::ffff:192.168.")
  );
}

/**
 * Cualquier invitado puede pegar un link y el servidor lo va a abrir, asi que
 * filtramos todo lo que apunte a la red interna (SSRF).
 */
export async function urlSegura(crudo: string) {
  let url: URL;
  try {
    url = new URL(crudo.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return null;
  }

  try {
    const direcciones = await lookup(host, { all: true });
    if (!direcciones.length) return null;
    if (direcciones.some((d) => esIpPrivada(d.address))) return null;
  } catch {
    return null;
  }

  return url;
}

/**
 * Baja el HTML siguiendo las redirecciones a mano: cada salto se vuelve a
 * revisar, porque si no, una liga corta puede acabar apuntando a la red interna
 * y el filtro de arriba no habria servido de nada.
 */
async function traerHtml(inicial: URL) {
  let url = inicial;

  for (let salto = 0; salto <= SALTOS; salto++) {
    let respuesta: Response;
    try {
      respuesta = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: {
          "user-agent": UA,
          "accept-language": "es-MX,es;q=0.9,en;q=0.8",
          accept: "text/html,application/xhtml+xml",
        },
      });
    } catch {
      return null;
    }

    if (respuesta.status >= 300 && respuesta.status < 400) {
      const destino = respuesta.headers.get("location");
      if (!destino) return null;

      let siguiente: URL | null;
      try {
        siguiente = await urlSegura(new URL(destino, url).toString());
      } catch {
        return null;
      }
      if (!siguiente) return null;

      url = siguiente;
      continue;
    }

    if (!respuesta.ok) return null;
    if (!(respuesta.headers.get("content-type") ?? "").includes("html")) return null;

    const html = (await respuesta.text()).slice(0, MAX_HTML);
    return { html, url };
  }

  return null;
}

/** Nombres que casi siempre son adorno de la tienda y no el producto. */
const BASURA =
  /(sprite|logo|icon|favicon|avatar|badge|pixel|spacer|blank|transparent|placeholder|loading|play-button|grey-pixel|1x1)/i;

/**
 * Amazon sirve la galeria en miniaturas (`._AC_US40_.jpg`). Quitandole ese
 * pedazo al nombre sale la foto grande, que es la que sirve para la lista.
 */
function aGrande(url: string) {
  if (!/(^|\.)media-amazon\.com$|(^|\.)ssl-images-amazon\.com$/.test(new URL(url).hostname)) {
    return url;
  }
  return url.replace(/\._[A-Z0-9_,]+_\.(jpe?g|png)$/i, ".$1");
}

function juntarImagenes(html: string, base: URL) {
  const vistas = new Set<string>();
  const salida: string[] = [];

  const meter = (crudo: string | null | undefined) => {
    if (!crudo || salida.length >= LIMITE) return;

    const limpio = crudo.trim().replace(/\\\//g, "/").replace(/&amp;/g, "&");
    if (!limpio || limpio.startsWith("data:")) return;

    let absoluta: string;
    try {
      const u = new URL(limpio, base);
      if (u.protocol !== "http:" && u.protocol !== "https:") return;
      absoluta = aGrande(u.toString());
    } catch {
      return;
    }

    if (/\.svg($|\?)/i.test(absoluta)) return;
    if (BASURA.test(absoluta)) return;
    // Amazon guarda el producto en /images/I/; /images/G/ son adornos del sitio.
    if (/media-amazon\.com/.test(absoluta) && !/\/images\/I\//.test(absoluta)) return;

    if (vistas.has(absoluta)) return;
    vistas.add(absoluta);
    salida.push(absoluta);
  };

  const contenido = (etiqueta: string) =>
    etiqueta.match(/content\s*=\s*["']([^"']+)["']/i)?.[1];

  // 1. Las que la pagina declara para compartir: suelen ser las buenas.
  for (const m of html.matchAll(
    /<meta[^>]+(?:property|name)\s*=\s*["'](?:og:image(?::url|:secure_url)?|twitter:image(?::src)?)["'][^>]*>/gi,
  )) {
    meter(contenido(m[0]));
  }
  for (const m of html.matchAll(/<link[^>]+rel\s*=\s*["']image_src["'][^>]*>/gi)) {
    meter(m[0].match(/href\s*=\s*["']([^"']+)["']/i)?.[1]);
  }

  // 2. Lo que venga en los datos estructurados (JSON-LD).
  for (const m of html.matchAll(/"image"\s*:\s*"((?:[^"\\]|\\.)+)"/g)) meter(m[1]);
  for (const m of html.matchAll(/"(?:contentUrl|thumbnailUrl)"\s*:\s*"((?:[^"\\]|\\.)+)"/g)) {
    meter(m[1]);
  }

  // 3. La galeria de Amazon, que no sale en ninguna meta tag.
  for (const m of html.matchAll(/"(?:hiRes|large|mainUrl)"\s*:\s*"(https?:[^"]+)"/g)) {
    meter(m[1]);
  }

  // 4. Y si nada de eso alcanzo, las <img> de la pagina.
  for (const m of html.matchAll(/<img[^>]+>/gi)) {
    if (salida.length >= LIMITE) break;
    const etiqueta = m[0];
    const src =
      etiqueta.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] ??
      etiqueta.match(/\bdata-(?:src|old-hires|a-hires)\s*=\s*["']([^"']+)["']/i)?.[1];
    meter(src);
  }

  return salida.slice(0, LIMITE);
}

/**
 * El <title> de la pagina, por si no hay og:title. En Amazon, por ejemplo, no
 * hay ninguna meta y el titulo es justo la descripcion larga del producto.
 */
function tituloDelHtml(html: string) {
  const crudo = html.match(/<title[^>]*>([^<]{1,400})</i)?.[1];
  if (!crudo) return null;

  const limpio = crudo
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

  return limpio || null;
}

/** Lee las meta tags (og:*, twitter:*) y junta las imagenes. null si no se pudo. */
export async function obtenerPreview(crudo: string): Promise<Preview | null> {
  const url = await urlSegura(crudo);
  if (!url) return null;

  const bajado = await traerHtml(url);
  if (!bajado) return null;

  const imagenes = juntarImagenes(bajado.html, bajado.url);

  try {
    const { error, result } = await ogs({ html: bajado.html, url: bajado.url.toString() });
    if (error || !result?.success) {
      return {
        title: tituloDelHtml(bajado.html),
        imageUrl: imagenes[0] ?? null,
        imagenes,
        siteName: bajado.url.hostname.replace(/^www\./, ""),
        price: null,
      };
    }

    const datos = result as Record<string, unknown>;
    const texto = (clave: string) => {
      const valor = datos[clave];
      return typeof valor === "string" && valor.trim() ? valor.trim() : null;
    };

    const precioMonto = texto("ogPriceAmount");
    const precioMoneda = texto("ogPriceCurrency");

    return {
      title:
        texto("ogTitle") ??
        texto("twitterTitle") ??
        texto("dcTitle") ??
        tituloDelHtml(bajado.html),
      imageUrl: imagenes[0] ?? null,
      imagenes,
      siteName: texto("ogSiteName") ?? bajado.url.hostname.replace(/^www\./, ""),
      price: precioMonto
        ? `${precioMonto}${precioMoneda ? ` ${precioMoneda}` : ""}`
        : null,
    };
  } catch {
    return {
      title: tituloDelHtml(bajado.html),
      imageUrl: imagenes[0] ?? null,
      imagenes,
      siteName: bajado.url.hostname.replace(/^www\./, ""),
      price: null,
    };
  }
}
