import "server-only";

import { headers } from "next/headers";
import { and, desc, eq, gte } from "drizzle-orm";

import { db, schema } from "@/db";

/**
 * Topes del formulario de acceso. Cada enlace que se pide es un correo que
 * sale, y los correos se pagan: sin estos topes cualquiera puede inflar la
 * cuenta (y de paso llenarle el buzón a quien se le antoje) nomás tecleando
 * correos en la pantalla de entrada.
 *
 * El conteo por correo sale de `login_tokens`, que ya guarda un renglón por
 * enlace. El de IP vive en memoria a propósito: no queremos una tabla de IPs de
 * visitantes para un intercambio de regalos.
 */

const MINUTO = 60_000;
const HORA = 60 * MINUTO;

/** Dos enlaces seguidos al mismo correo casi siempre es doble clic. */
const ESPERA_MS = MINUTO;
/** Por correo en una hora: da margen para equivocarse sin volverse spam. */
const TOPE_CORREO_HORA = 5;
/** Por IP en una hora, para que no sirva de nada ir rotando correos. */
const TOPE_IP_HORA = 10;

export type LimiteAcceso =
  | { permitido: true }
  | { permitido: false; motivo: "espera"; segundos: number }
  | { permitido: false; motivo: "correo" | "ip" };

/**
 * Las marcas de tiempo de cada IP. Es "lo mejor que se pueda": en Vercel cada
 * instancia tiene su propio mapa y se reinicia solo, así que frena al que
 * insiste pero no es una garantía. El tope por correo sí es firme.
 */
const porIp = new Map<string, number[]>();

async function ipDelVisitante() {
  const cabeceras = await headers();
  const reenviada = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || cabeceras.get("x-real-ip") || null;
}

function vigentes(sellos: number[] | undefined, ahora: number) {
  return (sellos ?? []).filter((t) => ahora - t < HORA);
}

/** Tira las IPs que ya no cuentan, para que el mapa no crezca sin fin. */
function podar(ahora: number) {
  for (const [ip, sellos] of porIp) {
    const quedan = vigentes(sellos, ahora);
    if (quedan.length) porIp.set(ip, quedan);
    else porIp.delete(ip);
  }
}

export async function revisarLimiteAcceso(email: string): Promise<LimiteAcceso> {
  const ahora = Date.now();

  // Primero la IP: es en memoria, no cuesta un viaje a la base.
  const ip = await ipDelVisitante();
  if (ip && vigentes(porIp.get(ip), ahora).length >= TOPE_IP_HORA) {
    return { permitido: false, motivo: "ip" };
  }

  // Los enlaces que ya se pidieron para ese correo en la última hora. Pedimos
  // uno más que el tope: con saber que lo pasa basta.
  const recientes = await db
    .select({ creado: schema.loginTokens.createdAt })
    .from(schema.loginTokens)
    .where(
      and(
        eq(schema.loginTokens.email, email),
        // Solo los que esta persona pidió. Los duraderos los dispara quien
        // organiza al invitar o al sortear, y no tienen por qué dejar a nadie
        // sin poder entrar justo después de que le llegó su invitación.
        eq(schema.loginTokens.reusable, false),
        gte(schema.loginTokens.createdAt, new Date(ahora - HORA)),
      ),
    )
    .orderBy(desc(schema.loginTokens.createdAt))
    .limit(TOPE_CORREO_HORA + 1);

  const ultimo = recientes[0]?.creado.getTime();
  if (ultimo !== undefined && ahora - ultimo < ESPERA_MS) {
    return {
      permitido: false,
      motivo: "espera",
      segundos: Math.max(1, Math.ceil((ESPERA_MS - (ahora - ultimo)) / 1000)),
    };
  }

  if (recientes.length >= TOPE_CORREO_HORA) {
    return { permitido: false, motivo: "correo" };
  }

  return { permitido: true };
}

/**
 * Se llama cuando se le entrega un enlace a alguien, haya salido el correo o
 * no: un enlace creado ya es una llave, y en desarrollo se muestra en pantalla.
 */
export async function anotarEnlacePorIp() {
  const ip = await ipDelVisitante();
  if (!ip) return;

  const ahora = Date.now();
  porIp.set(ip, [...vigentes(porIp.get(ip), ahora), ahora]);
  if (porIp.size > 500) podar(ahora);
}

export function mensajeDeLimite(limite: LimiteAcceso) {
  if (limite.permitido) return null;

  if (limite.motivo === "espera") {
    const s = limite.segundos;
    return `Delibird ya salió con tu enlace. Revisa tu correo o espera ${s} segundo${s === 1 ? "" : "s"}.`;
  }

  if (limite.motivo === "correo") {
    return "Pediste varios enlaces en la última hora. Busca el último en tu correo (checa también el spam) e inténtalo más tarde.";
  }

  return "Demasiados intentos desde aquí. Espera un rato e inténtalo otra vez.";
}
