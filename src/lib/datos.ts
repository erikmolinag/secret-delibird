import "server-only";

import { and, asc, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db, schema } from "@/db";
import { nombreDesdeEmail } from "@/lib/utils";

/** Eventos que organiza esta persona. */
export async function eventosDelUsuario(userId: string) {
  return db
    .select()
    .from(schema.events)
    .where(eq(schema.events.organizerId, userId))
    .orderBy(desc(schema.events.createdAt));
}

/** Eventos ajenos en los que participa. */
export async function participacionesDelUsuario(userId: string) {
  return db
    .select({
      participante: schema.participants,
      evento: schema.events,
    })
    .from(schema.participants)
    .innerJoin(schema.events, eq(schema.events.id, schema.participants.eventId))
    .where(eq(schema.participants.userId, userId))
    .orderBy(desc(schema.events.createdAt));
}

export async function eventoDelOrganizador(eventId: string, userId: string) {
  const [evento] = await db
    .select()
    .from(schema.events)
    .where(and(eq(schema.events.id, eventId), eq(schema.events.organizerId, userId)))
    .limit(1);
  return evento ?? null;
}

export async function invitadosDelEvento(eventId: string) {
  return db
    .select()
    .from(schema.participants)
    .where(eq(schema.participants.eventId, eventId))
    .orderBy(desc(schema.participants.isOrganizer), asc(schema.participants.name));
}

/** El invitado solo es suyo si coincide la cuenta o el correo. */
export async function participanteDelUsuario(
  participantId: string,
  usuario: { id: string; email: string },
) {
  const [fila] = await db
    .select({ participante: schema.participants, evento: schema.events })
    .from(schema.participants)
    .innerJoin(schema.events, eq(schema.events.id, schema.participants.eventId))
    .where(eq(schema.participants.id, participantId))
    .limit(1);

  if (!fila) return null;

  const esSuyo =
    fila.participante.userId === usuario.id ||
    fila.participante.email === usuario.email.toLowerCase();

  if (!esSuyo) return null;
  return fila;
}

export async function reglasDelEvento(eventId: string) {
  return db
    .select()
    .from(schema.rules)
    .where(eq(schema.rules.eventId, eventId))
    .orderBy(asc(schema.rules.createdAt));
}

/** Los que entran al sorteo. */
export async function jugadoresDelEvento(eventId: string) {
  return db
    .select()
    .from(schema.participants)
    .where(
      and(
        eq(schema.participants.eventId, eventId),
        eq(schema.participants.isPlaying, true),
      ),
    )
    .orderBy(asc(schema.participants.name));
}

/** A quién le toca regalarle a quién. Solo para el botón de revelar. */
export async function asignacionesDelEvento(eventId: string) {
  const quienDa = alias(schema.participants, "quien_da");
  const quienRecibe = alias(schema.participants, "quien_recibe");

  return db
    .select({
      quienDa: quienDa.name,
      quienRecibe: quienRecibe.name,
      notificadoEn: schema.assignments.notifiedAt,
    })
    .from(schema.assignments)
    .innerJoin(quienDa, eq(quienDa.id, schema.assignments.giverId))
    .innerJoin(quienRecibe, eq(quienRecibe.id, schema.assignments.receiverId))
    .where(eq(schema.assignments.eventId, eventId))
    .orderBy(asc(quienDa.name));
}

/** La persona que le tocó a este invitado (y su ficha completa). */
export async function aQuienLeRegala(participantId: string) {
  const [fila] = await db
    .select({
      asignacion: schema.assignments,
      receptor: schema.participants,
    })
    .from(schema.assignments)
    .innerJoin(
      schema.participants,
      eq(schema.participants.id, schema.assignments.receiverId),
    )
    .where(eq(schema.assignments.giverId, participantId))
    .limit(1);

  return fila ?? null;
}

/** Quién le regala a esta persona (para avisarle que movió su lista). */
export async function quienLeRegalaA(participantId: string) {
  const [fila] = await db
    .select({ asignacion: schema.assignments, quienDa: schema.participants })
    .from(schema.assignments)
    .innerJoin(
      schema.participants,
      eq(schema.participants.id, schema.assignments.giverId),
    )
    .where(eq(schema.assignments.receiverId, participantId))
    .limit(1);

  return fila ?? null;
}

export async function listaDeDeseos(participantId: string) {
  return db
    .select()
    .from(schema.wishlistItems)
    .where(eq(schema.wishlistItems.participantId, participantId))
    .orderBy(asc(schema.wishlistItems.priority), desc(schema.wishlistItems.createdAt));
}

/** Pokémon ya repartidos en el evento, para no repetir avatares. */
export async function pokemonOcupados(eventId: string) {
  const filas = await db
    .select({ pokemonId: schema.participants.pokemonId })
    .from(schema.participants)
    .where(eq(schema.participants.eventId, eventId));
  return filas.map((f) => f.pokemonId);
}

export async function correosYaInvitados(eventId: string, correos: string[]) {
  if (!correos.length) return new Set<string>();
  const filas = await db
    .select({ email: schema.participants.email })
    .from(schema.participants)
    .where(
      and(
        eq(schema.participants.eventId, eventId),
        inArray(schema.participants.email, correos),
      ),
    );
  return new Set(filas.map((f) => f.email));
}

/** Cuantos invitados y cuantos ya armaron su lista, por evento. */
export async function resumenDeEventos(eventIds: string[]) {
  if (!eventIds.length) return new Map<string, { total: number; listos: number }>();

  const filas = await db
    .select({
      eventId: schema.participants.eventId,
      total: count(),
    })
    .from(schema.participants)
    .where(inArray(schema.participants.eventId, eventIds))
    .groupBy(schema.participants.eventId);

  const conLista = await db
    .select({
      eventId: schema.participants.eventId,
      total: count(),
    })
    .from(schema.participants)
    .where(
      and(
        inArray(schema.participants.eventId, eventIds),
        isNotNull(schema.participants.wishlistUpdatedAt),
      ),
    )
    .groupBy(schema.participants.eventId);

  const listos = new Map(conLista.map((f) => [f.eventId, Number(f.total)]));

  return new Map(
    filas.map((f) => [
      f.eventId,
      { total: Number(f.total), listos: listos.get(f.eventId) ?? 0 },
    ]),
  );
}

/** Acepta "Erik <erik@x.com>", "erik@x.com" y separadores por línea, coma o ;. */
export function parsearInvitados(texto: string) {
  // Primero sacamos el correo; lo que sobra de la línea es el nombre.
  const buscarCorreo = /[^\s<>,;"]+@[^\s<>,;"]+\.[^\s<>,;"]+/;

  const vistos = new Set<string>();
  const invitados: { email: string; name: string }[] = [];
  const inválidos: string[] = [];

  for (const entrada of texto.split(/[\n,;]+/)) {
    const limpio = entrada.trim();
    if (!limpio) continue;

    const coincidencia = limpio.match(buscarCorreo);
    if (!coincidencia) {
      inválidos.push(limpio);
      continue;
    }

    const email = coincidencia[0].toLowerCase();
    if (vistos.has(email)) continue;
    vistos.add(email);

    const nombre = limpio.replace(coincidencia[0], "").replace(/[<>"]/g, "").trim();
    invitados.push({ email, name: nombre || nombreDesdeEmail(email) });
  }

  return { invitados, inválidos };
}
