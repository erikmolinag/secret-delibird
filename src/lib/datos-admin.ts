import "server-only";

import { count, desc, eq, gte, max, sql } from "drizzle-orm";

import { db, schema } from "@/db";

const { events, loginTokens, participants, users, wishlistItems } = schema;

/** Los números grandes del panel. */
export async function resumenAdmin() {
  const haceUnaSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [usuarios, usuariosNuevos, intercambios, sorteados, invitados, deseos] =
    await Promise.all([
      db.$count(users),
      db.$count(users, gte(users.createdAt, haceUnaSemana)),
      db.$count(events),
      db.$count(events, eq(events.status, "drawn")),
      db.$count(participants),
      db.$count(wishlistItems),
    ]);

  return { usuarios, usuariosNuevos, intercambios, sorteados, invitados, deseos };
}

/*
 * Los conteos van en subconsultas agrupadas y unidas con LEFT JOIN, no en
 * subconsultas correlacionadas: en un select de una sola tabla Drizzle no le
 * pone el nombre de la tabla a las columnas, y `"id" = "id"` dentro de la
 * subconsulta se compara consigo misma. Ojo: los `.as()` de las subconsultas
 * salen sin prefijo en la consulta de afuera, así que cada uno lleva nombre único.
 */

/** Todas las cuentas, con lo que organizan, dónde juegan y cuándo entraron. */
export async function usuariosParaAdmin() {
  const organizados = db
    .select({ userId: events.organizerId, total: count().as("total_organiza") })
    .from(events)
    .groupBy(events.organizerId)
    .as("organizados");

  const jugados = db
    .select({ userId: participants.userId, total: count().as("total_participa") })
    .from(participants)
    .groupBy(participants.userId)
    .as("jugados");

  // La sesión dura 30 días: esto es el último magic link usado, no la última visita.
  const accesos = db
    .select({ email: loginTokens.email, ultimo: max(loginTokens.usedAt).as("ultimo_acceso") })
    .from(loginTokens)
    .groupBy(loginTokens.email)
    .as("accesos");

  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      trainerKey: users.trainerKey,
      createdAt: users.createdAt,
      organiza: sql<number>`coalesce(${organizados.total}, 0)`.mapWith(Number),
      participa: sql<number>`coalesce(${jugados.total}, 0)`.mapWith(Number),
      ultimoAcceso: accesos.ultimo,
    })
    .from(users)
    .leftJoin(organizados, eq(organizados.userId, users.id))
    .leftJoin(jugados, eq(jugados.userId, users.id))
    .leftJoin(accesos, eq(accesos.email, users.email))
    .orderBy(desc(users.createdAt));
}

/** Todos los intercambios, del más nuevo al más viejo. */
export async function intercambiosParaAdmin() {
  const conteo = db
    .select({
      eventId: participants.eventId,
      invitados: count().as("invitados"),
      // count(columna) se salta los null: solo cuenta a quien ya armó su lista.
      conLista: count(participants.wishlistUpdatedAt).as("con_lista"),
    })
    .from(participants)
    .groupBy(participants.eventId)
    .as("conteo");

  return db
    .select({
      evento: events,
      organizador: { name: users.name, email: users.email },
      invitados: sql<number>`coalesce(${conteo.invitados}, 0)`.mapWith(Number),
      conLista: sql<number>`coalesce(${conteo.conLista}, 0)`.mapWith(Number),
    })
    .from(events)
    .innerJoin(users, eq(users.id, events.organizerId))
    .leftJoin(conteo, eq(conteo.eventId, events.id))
    .orderBy(desc(events.createdAt));
}

/** Un intercambio cualquiera, sin importar quién lo organiza. */
export async function intercambioParaAdmin(eventId: string) {
  const [fila] = await db
    .select({ evento: events, organizador: users })
    .from(events)
    .innerJoin(users, eq(users.id, events.organizerId))
    .where(eq(events.id, eventId))
    .limit(1);
  return fila ?? null;
}
