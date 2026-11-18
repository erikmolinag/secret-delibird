import "server-only";

import { lookup } from "node:dns/promises";
import net from "node:net";

import ogs from "open-graph-scraper";

export type Preview = {
  title: string | null;
  imageUrl: string | null;
  siteName: string | null;
  price: string | null;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

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

function primeraImagen(
  valor: unknown,
  base: URL,
): string | null {
  const lista = Array.isArray(valor) ? valor : valor ? [valor] : [];
  for (const entrada of lista) {
    const crudo =
      typeof entrada === "string"
        ? entrada
        : typeof entrada === "object" && entrada && "url" in entrada
          ? String((entrada as { url: unknown }).url ?? "")
          : "";
    if (!crudo) continue;
    try {
      return new URL(crudo, base).toString();
    } catch {
      continue;
    }
  }
  return null;
}

/** Lee las meta tags (og:*, twitter:*) de la página. null si no se pudo. */
export async function obtenerPreview(crudo: string): Promise<Preview | null> {
  const url = await urlSegura(crudo);
  if (!url) return null;

  try {
    const { error, result } = await ogs({
      url: url.toString(),
      timeout: 8000,
      fetchOptions: {
        headers: {
          "user-agent": UA,
          "accept-language": "es-MX,es;q=0.9,en;q=0.8",
        },
      },
    });

    if (error || !result?.success) return null;

    const datos = result as Record<string, unknown>;
    const texto = (clave: string) => {
      const valor = datos[clave];
      return typeof valor === "string" && valor.trim() ? valor.trim() : null;
    };

    const precioMonto = texto("ogPriceAmount");
    const precioMoneda = texto("ogPriceCurrency");

    return {
      title: texto("ogTitle") ?? texto("twitterTitle") ?? texto("dcTitle") ?? null,
      imageUrl:
        primeraImagen(datos.ogImage, url) ??
        primeraImagen(datos.twitterImage, url) ??
        primeraImagen(datos.favicon, url),
      siteName: texto("ogSiteName") ?? url.hostname.replace(/^www\./, ""),
      price: precioMonto
        ? `${precioMonto}${precioMoneda ? ` ${precioMoneda}` : ""}`
        : null,
    };
  } catch {
    return null;
  }
}
