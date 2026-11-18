"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { db, schema } from "@/db";
import { requerirUsuario } from "@/lib/auth";
import {
  correosYaInvitados,
  eventoDelOrganizador,
  invitadosDelEvento,
  parsearInvitados,
  pokemonOcupados,
} from "@/lib/datos";
import { crearMagicLink } from "@/lib/magic-link";
import { enviarCorreo, plantillaInvitacion } from "@/lib/mail";
import { asignarPokemon } from "@/lib/pokemon";
import {
  formatearFecha,
  formatearPresupuesto,
  normalizarEmail,
  parsearFechaLocal,
} from "@/lib/utils";

const TOPE_INVITADOS = 100;

function texto(datos: FormData, campo: string) {
  const valor = datos.get(campo);
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function entero(datos: FormData, campo: string) {
  const valor = texto(datos, campo);
  if (!valor) return null;
  const número = Number.parseInt(valor.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(número) ? número : null;
}

export async function crearEventoAccion(datos: FormData) {
  const usuario = await requerirUsuario();

  const nombre = texto(datos, "name");
  if (!nombre) return;

  const [evento] = await db
    .insert(schema.events)
    .values({
      name: nombre,
      organizerId: usuario.id,
      eventDate: parsearFechaLocal(datos.get("eventDate")),
      place: texto(datos, "place"),
      placeUrl: texto(datos, "placeUrl"),
      budgetAmount: entero(datos, "budgetAmount"),
      budgetCurrency: texto(datos, "budgetCurrency") ?? "MXN",
      message: texto(datos, "message"),
      organizerPlays: datos.get("organizerPlays") === "on",
      avoidMutual: datos.get("avoidMutual") === "on",
    })
    .returning();

  // El organizador queda dentro como invitado (puede dejar de jugar luego).
  await db.insert(schema.participants).values({
    eventId: evento.id,
    email: usuario.email,
    name: usuario.name ?? usuario.email,
    userId: usuario.id,
    pokemonId: asignarPokemon(evento.id, []),
    isOrganizer: true,
    isPlaying: evento.organizerPlays,
    joinedAt: new Date(),
  });

  redirect(`/eventos/${evento.id}`);
}

export async function actualizarEventoAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const eventId = texto(datos, "eventId");
  if (!eventId) return;

  const evento = await eventoDelOrganizador(eventId, usuario.id);
  if (!evento) return;

  const organizadorJuega = datos.get("organizerPlays") === "on";

  await db
    .update(schema.events)
    .set({
      name: texto(datos, "name") ?? evento.name,
      eventDate: parsearFechaLocal(datos.get("eventDate")),
      place: texto(datos, "place"),
      placeUrl: texto(datos, "placeUrl"),
      budgetAmount: entero(datos, "budgetAmount"),
      budgetCurrency: texto(datos, "budgetCurrency") ?? evento.budgetCurrency,
      message: texto(datos, "message"),
      organizerPlays: organizadorJuega,
      avoidMutual: datos.get("avoidMutual") === "on",
    })
    .where(eq(schema.events.id, eventId));

  await db
    .update(schema.participants)
    .set({ isPlaying: organizadorJuega })
    .where(
      and(
        eq(schema.participants.eventId, eventId),
        eq(schema.participants.isOrganizer, true),
      ),
    );

  refresh();
}

export async function agregarInvitadosAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const eventId = texto(datos, "eventId");
  if (!eventId) return;

  const evento = await eventoDelOrganizador(eventId, usuario.id);
  if (!evento) return;

  // Dos formas de agregar: de uno en uno (nombre y correo aparte) o pegando
  // una lista. Las dos acaban en el mismo parser.
  const correo = texto(datos, "email");
  const nombre = texto(datos, "name");
  const lista = correo
    ? nombre
      ? `${nombre} <${correo}>`
      : correo
    : texto(datos, "invitados");

  if (!lista) return;

  const { invitados } = parsearInvitados(lista);
  if (!invitados.length) return;

  const yaEstan = await correosYaInvitados(
    eventId,
    invitados.map((i) => i.email),
  );
  const nuevos = invitados.filter((i) => !yaEstan.has(i.email));
  if (!nuevos.length) return;

  const existentes = await pokemonOcupados(eventId);
  const cupo = Math.max(0, TOPE_INVITADOS - existentes.length);
  const ocupados = [...existentes];

  const filas = nuevos.slice(0, cupo).map((invitado) => {
    const pokemonId = asignarPokemon(eventId, ocupados);
    ocupados.push(pokemonId);
    return {
      eventId,
      email: invitado.email,
      name: invitado.name,
      pokemonId,
    };
  });

  if (filas.length) await db.insert(schema.participants).values(filas);

  refresh();
}

export async function eliminarInvitadoAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const eventId = texto(datos, "eventId");
  const participantId = texto(datos, "participantId");
  if (!eventId || !participantId) return;

  const evento = await eventoDelOrganizador(eventId, usuario.id);
  if (!evento || evento.status === "drawn") return;

  await db
    .delete(schema.participants)
    .where(
      and(
        eq(schema.participants.id, participantId),
        eq(schema.participants.eventId, eventId),
        eq(schema.participants.isOrganizer, false),
      ),
    );

  refresh();
}

/**
 * Manda la invitación con un magic link que aterriza directo en su lista.
 * Por defecto solo a quienes no se les ha mandado nada.
 */
export async function enviarInvitacionesAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const eventId = texto(datos, "eventId");
  if (!eventId) return;

  const evento = await eventoDelOrganizador(eventId, usuario.id);
  if (!evento) return;

  const unicoId = texto(datos, "participantId");
  const todos = await invitadosDelEvento(eventId);

  const objetivo = unicoId
    ? todos.filter((p) => p.id === unicoId)
    : todos.filter((p) => !p.invitedAt && p.email !== normalizarEmail(usuario.email));

  for (const invitado of objetivo) {
    const url = await crearMagicLink(invitado.email, `/e/${invitado.id}`);
    const plantilla = plantillaInvitacion({
      evento: evento.name,
      anfitrion: usuario.name ?? usuario.email,
      url,
      fecha: formatearFecha(evento.eventDate),
      inicio: evento.eventDate,
      lugar: evento.place,
      lugarUrl: evento.placeUrl,
      presupuesto: formatearPresupuesto(evento.budgetAmount, evento.budgetCurrency),
      mensaje: evento.message,
    });

    await enviarCorreo({ to: invitado.email, ...plantilla });

    await db
      .update(schema.participants)
      .set({ invitedAt: new Date() })
      .where(eq(schema.participants.id, invitado.id));
  }

  refresh();
}

/** Saca o mete a alguien al sorteo sin borrarlo del evento. */
export async function alternarJuegaAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const eventId = texto(datos, "eventId");
  const participantId = texto(datos, "participantId");
  if (!eventId || !participantId) return;

  const evento = await eventoDelOrganizador(eventId, usuario.id);
  if (!evento || evento.status === "drawn") return;

  const [invitado] = await db
    .select()
    .from(schema.participants)
    .where(
      and(
        eq(schema.participants.id, participantId),
        eq(schema.participants.eventId, eventId),
      ),
    )
    .limit(1);
  if (!invitado) return;

  const juega = !invitado.isPlaying;

  await db
    .update(schema.participants)
    .set({ isPlaying: juega })
    .where(eq(schema.participants.id, participantId));

  // El organizador tiene su propio interruptor en los ajustes del evento.
  if (invitado.isOrganizer) {
    await db
      .update(schema.events)
      .set({ organizerPlays: juega })
      .where(eq(schema.events.id, eventId));
  }

  refresh();
}

/**
 * Borra el evento entero: invitados, reglas, asignaciones, listas y fotos se
 * van con el por las llaves foraneas. No hay vuelta atras.
 */
export async function eliminarEventoAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const eventId = texto(datos, "eventId");
  if (!eventId) return;

  const evento = await eventoDelOrganizador(eventId, usuario.id);
  if (!evento) return;

  await db.delete(schema.events).where(eq(schema.events.id, eventId));

  redirect("/eventos");
}
