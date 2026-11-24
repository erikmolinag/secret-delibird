import "server-only";

import crypto from "node:crypto";

import { and, count, desc, eq, gte, isNotNull, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";

import { db, schema } from "@/db";

/**
 * Topes del formulario de acceso. Cada enlace que se pide es un correo que
 * sale, y los correos se pagan: sin estos topes cualquiera puede inflar la
 * cuenta (y de paso llenarle el buzón a quien se le antoje) nomás tecleando
 * correos en la pantalla de entrada.
 *
 * Los dos conteos salen de `login_tokens`, que ya guarda un renglón por enlace.
 * El de IP vivía en memoria, y en Vercel eso no frena nada: cada instancia
 * tenía su propio mapa, así que el tope real era diez por instancia y alguien
 * podía quemar la cuota del día mandando correos a direcciones ajenas.
 *
 * Lo que se guarda es una **huella** de la IP, no la IP: no queremos un
 * registro de visitantes para un intercambio de regalos.
 */

const MINUTO = 60_000;
const HORA = 60 * MINUTO;

/** Dos enlaces seguidos al mismo correo casi siempre es doble clic. */
const ESPERA_MS = MINUTO;
/** Por correo en una hora: da margen para equivocarse sin volverse spam. */
const TOPE_CORREO_HORA = 5;
/** Por IP en una hora, para que no sirva de nada ir rotando correos. */
const TOPE_IP_HORA = 10;

/** Cuánto se queda un enlace ya vencido antes de que lo barramos. */
const DIAS_DE_GRACIA = 7;

export type LimiteAcceso =
  | { permitido: true }
  | { permitido: false; motivo: "espera"; segundos: number }
  | { permitido: false; motivo: "correo" | "ip" };

export async function ipDelVisitante() {
  const cabeceras = await headers();
  const reenviada = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || cabeceras.get("x-real-ip") || null;
}

/**
 * La huella de la IP de quien está pidiendo el enlace.
 *
 * Va salada con `AUTH_SECRET` por una razón concreta: una IPv4 son cuatro mil
 * millones de posibilidades, y un sha256 sin sal se revierte probándolas todas
 * en un rato. Con la sal, el renglón no dice de dónde entró nadie; solo sirve
 * para comparar contra otros renglones de la misma hora.
 */
export async function huellaDeIp() {
  const ip = await ipDelVisitante();
  if (!ip) return null;

  return crypto
    .createHash("sha256")
    .update(`${process.env.AUTH_SECRET ?? ""}:${ip}`)
    .digest("hex");
}

export async function revisarLimiteAcceso(email: string): Promise<LimiteAcceso> {
  const ahora = Date.now();
  const desde = new Date(ahora - HORA);

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
        gte(schema.loginTokens.createdAt, desde),
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

  // Y los que salieron de esta misma máquina, para que rotar correos no sirva.
  const huella = await huellaDeIp();
  if (huella) {
    const [desdeAqui] = await db
      .select({ cuantos: count() })
      .from(schema.loginTokens)
      .where(
        and(
          eq(schema.loginTokens.ipHash, huella),
          gte(schema.loginTokens.createdAt, desde),
        ),
      );

    if ((desdeAqui?.cuantos ?? 0) >= TOPE_IP_HORA) {
      return { permitido: false, motivo: "ip" };
    }
  }

  return { permitido: true };
}

/**
 * Barre los enlaces vencidos hace rato. Sin esto la tabla crece para siempre, y
 * con ella las huellas de IP: lo que no se guarda no se filtra. Se deja una
 * semana de gracia para que un enlace que acaba de vencer todavía pueda
 * contestar "vencido" en vez de "inválido", que es un mensaje más útil.
 */
export async function barrerEnlacesViejos() {
  await db
    .delete(schema.loginTokens)
    .where(
      and(
        isNotNull(schema.loginTokens.expiresAt),
        lt(
          schema.loginTokens.expiresAt,
          sql`now() - interval '${sql.raw(String(DIAS_DE_GRACIA))} days'`,
        ),
      ),
    );
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
