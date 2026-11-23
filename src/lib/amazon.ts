/**
 * Enlaces de Amazon con el código de afiliado de la casa.
 *
 * La regla es: primero se limpia lo que el enlace traiga pegado —que casi
 * siempre es basura de seguimiento, y a veces el código de afiliado de alguien
 * más— y hasta el final se pone el nuestro. Así da igual de dónde copiaron el
 * enlace: el que queda es el de aquí.
 *
 * No toca la base de datos ni la red: entra una cadena y sale otra, para poder
 * probarlo sin levantar nada.
 */

/** Las tiendas de Amazon: amazon.com, amazon.com.mx, amazon.es, amazon.co.uk... */
function esTiendaAmazon(host: string) {
  return /(^|\.)amazon\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host);
}

/** Las ligas cortas que reparte la propia Amazon. */
function esLigaCorta(host: string) {
  return host === "a.co" || host === "amzn.to" || host === "amzn.eu";
}

export function esEnlaceDeAmazon(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return esTiendaAmazon(host) || esLigaCorta(host);
  } catch {
    return false;
  }
}

/**
 * El ASIN es el identificador del producto, y con él solo se arma un enlace que
 * lleva al mismo lado sin arrastrar nada: `/dp/B0XXXXXXXX`.
 */
function sacarAsin(ruta: string) {
  const con = ruta.match(/\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return con ? con[1].toUpperCase() : null;
}

/**
 * Parámetros que no aportan nada a dónde lleva el enlace: seguimiento, de qué
 * búsqueda salió, y el código de afiliado de quien lo copió. `tag` va aquí
 * porque siempre lo volvemos a poner nosotros al final.
 */
const BASURA = new Set([
  "tag",
  "linkcode",
  "linkid",
  "ascsubtag",
  "creative",
  "creativeasin",
  "camp",
  "ref",
  "ref_",
  "_encoding",
  "psc",
  "smid",
  "th",
  "qid",
  "sr",
  "crid",
  "sprefix",
  "content-id",
  "dib",
  "dib_tag",
  "pd_rd_i",
  "pd_rd_r",
  "pd_rd_w",
  "pd_rd_wg",
  "pf_rd_i",
  "pf_rd_m",
  "pf_rd_p",
  "pf_rd_r",
  "pf_rd_s",
  "pf_rd_t",
  "ie",
  "s",
  "spia",
  "spla",
  "me",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
]);

/** `/Nombre-Del-Producto/dp/B0.../ref=sr_1_3` -> se va el `/ref=...`. */
function quitarRefDeLaRuta(ruta: string) {
  return ruta.replace(/\/ref=[^/]*\/?$/i, "") || "/";
}

/**
 * Devuelve el enlace con nuestro código. Si no hay código configurado, o el
 * enlace no es de Amazon, o ni siquiera es una dirección válida, lo regresa tal
 * cual: esto nunca debe romper un enlace que ya servía.
 */
export function conReferidoDeAmazon(url: string, etiqueta: string | null | undefined) {
  if (!etiqueta) return url;

  let liga: URL;
  try {
    liga = new URL(url);
  } catch {
    return url;
  }

  if (liga.protocol !== "http:" && liga.protocol !== "https:") return url;

  const host = liga.hostname.toLowerCase().replace(/^www\./, "");

  // Las ligas cortas no dicen a qué producto van: se les quita todo lo que
  // traigan colgando y se les pone la etiqueta. Amazon la respeta al redirigir.
  if (esLigaCorta(host)) {
    const corta = new URL(`${liga.origin}${liga.pathname}`);
    corta.searchParams.set("tag", etiqueta);
    return corta.toString();
  }

  if (!esTiendaAmazon(host)) return url;

  const asin = sacarAsin(liga.pathname);
  if (asin) {
    // Con el ASIN se arma el enlace mínimo: nada de lo que traía sobrevive.
    const limpio = new URL(`${liga.origin}/dp/${asin}`);
    limpio.searchParams.set("tag", etiqueta);
    return limpio.toString();
  }

  // Sin ASIN (una búsqueda, una tienda, una lista): se conserva la ruta y lo
  // que de verdad sirve de la consulta, y se tira el resto.
  const limpio = new URL(liga.origin + quitarRefDeLaRuta(liga.pathname));
  for (const [clave, valor] of liga.searchParams) {
    if (BASURA.has(clave.toLowerCase())) continue;
    limpio.searchParams.append(clave, valor);
  }
  limpio.searchParams.set("tag", etiqueta);
  return limpio.toString();
}

/**
 * Los códigos de afiliado de Amazon son del tipo `midominio-20`: letras,
 * números y guiones. Se valida porque este valor acaba metido en una URL.
 */
const CODIGO_VALIDO = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,48}[a-zA-Z0-9]$/;

export function codigoAmazonValido(valor: string) {
  return CODIGO_VALIDO.test(valor);
}
