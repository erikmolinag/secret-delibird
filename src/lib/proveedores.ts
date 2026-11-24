/**
 * Los dos proveedores de correo y lo que se sabe de ellos sin tocar la base.
 *
 * Vive aparte de `ajustes.ts` a propósito: `mail.ts` lo importa con ruta
 * relativa para poder probarse con `node --test`, que no entiende el alias
 * `@/`. Todo lo que necesite la base se carga a demanda allá, ya con
 * `DATABASE_URL` en la mano.
 */

export type Proveedor = "plunk" | "resend";

export const PROVEEDORES: Proveedor[] = ["plunk", "resend"];

/** Como se escribe cada uno cuando hay que enseñarlo o anotarlo. */
export const NOMBRE_PROVEEDOR: Record<Proveedor, string> = {
  plunk: "Plunk",
  resend: "Resend",
};

export function esProveedor(valor: string): valor is Proveedor {
  return valor === "plunk" || valor === "resend";
}

export type AjustesCorreo = {
  /** Con cuál se intenta primero. El otro queda de respaldo. */
  primero: Proveedor;
  fromPlunk: string | null;
  fromResend: string | null;
};

const DIRECCION = /^[^\s@<>,"]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

/**
 * Valida un remitente: `Secret Delibird <delibird@dominio.com>` o nada más la
 * dirección.
 *
 * Se valida porque esto acaba metido en una cabecera del correo. Un salto de
 * línea ahí deja agregar cabeceras inventadas —otro destinatario, por ejemplo—
 * así que lo que traiga `\r` o `\n` no pasa, aunque el resto se vea bien.
 */
export function remitenteValido(valor: string) {
  const limpio = valor.trim();
  if (!limpio || limpio.length > 120) return false;
  if (/[\r\n]/.test(limpio)) return false;

  const conNombre = limpio.match(/^([^<>]*)<([^<>]+)>$/);
  if (conNombre) {
    if (/["\\]/.test(conNombre[1])) return false;
    return DIRECCION.test(conNombre[2].trim());
  }

  return DIRECCION.test(limpio);
}

/**
 * Lo que dicen las variables de Vercel. Es el punto de partida y el respaldo:
 * si la base está caída o todavía no hay nada guardado en el panel, el correo
 * sigue sabiendo desde dónde mandar.
 *
 * Cada proveedor manda desde el dominio que tiene verificado y rechaza el
 * remitente del otro, por eso cada uno tiene la suya; `EMAIL_FROM` queda como
 * la común para quien no quiera partirlas.
 */
export function ajustesDelEntorno(): AjustesCorreo {
  const comun = process.env.EMAIL_FROM?.trim() || null;
  const primero = process.env.EMAIL_PRIMERO?.trim().toLowerCase() ?? "";

  return {
    primero: esProveedor(primero) ? primero : "plunk",
    fromPlunk: process.env.EMAIL_FROM_PLUNK?.trim() || comun,
    fromResend: process.env.EMAIL_FROM_RESEND?.trim() || comun,
  };
}
