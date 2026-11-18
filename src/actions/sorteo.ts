"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { db, schema } from "@/db";
import { requerirUsuario } from "@/lib/auth";
import {
  eventoDelOrganizador,
  jugadoresDelEvento,
  reglasDelEvento,
} from "@/lib/datos";
import { crearMagicLink } from "@/lib/magic-link";
import { enviarCorreo, plantillaSorteo } from "@/lib/mail";
import { sortear, type ReglaSorteo } from "@/lib/sorteo";
import { formatearFecha, formatearPresupuesto } from "@/lib/utils";

function texto(datos: FormData, campo: string) {
  const valor = datos.get(campo);
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

/** Trae el evento solo si lo organiza quien está en sesión. */
async function eventoMio(eventId: string | null) {
  if (!eventId) return null;
  const usuario = await requerirUsuario();
  const evento = await eventoDelOrganizador(eventId, usuario.id);
  return evento ? { evento, usuario } : null;
}

export async function agregarReglaAccion(datos: FormData) {
  const eventId = texto(datos, "eventId");
  const contexto = await eventoMio(eventId);
  if (!contexto || contexto.evento.status === "drawn") return;

  const tipo = texto(datos, "tipo");
  const from = texto(datos, "from");
  const to = texto(datos, "to");

  if (!tipo || !from || !to || from === to) return;
  if (!["exclude", "whitelist", "pin"].includes(tipo)) return;

  const jugadores = await jugadoresDelEvento(contexto.evento.id);
  const ids = new Set(jugadores.map((j) => j.id));
  if (!ids.has(from) || !ids.has(to)) return;

  // Nada de reglas repetidas.
  const existentes = await reglasDelEvento(contexto.evento.id);
  const repetida = existentes.some(
    (r) => r.type === tipo && r.fromParticipantId === from && r.toParticipantId === to,
  );
  if (repetida) return;

  await db.insert(schema.rules).values({
    eventId: contexto.evento.id,
    type: tipo as "exclude" | "whitelist" | "pin",
    fromParticipantId: from,
    toParticipantId: to,
    bidirectional: tipo === "exclude" && datos.get("bidireccional") === "on",
  });

  refresh();
}

export async function eliminarReglaAccion(datos: FormData) {
  const eventId = texto(datos, "eventId");
  const ruleId = texto(datos, "ruleId");
  const contexto = await eventoMio(eventId);
  if (!contexto || !ruleId || contexto.evento.status === "drawn") return;

  await db
    .delete(schema.rules)
    .where(
      and(
        eq(schema.rules.id, ruleId),
        eq(schema.rules.eventId, contexto.evento.id),
      ),
    );

  refresh();
}

/** Sortea, guarda y avisa a cada quien por correo. */
export async function sortearAccion(datos: FormData) {
  const eventId = texto(datos, "eventId");
  const contexto = await eventoMio(eventId);
  if (!contexto) return;

  const { evento } = contexto;
  if (evento.status === "drawn") return;

  const jugadores = await jugadoresDelEvento(evento.id);
  const reglas = await reglasDelEvento(evento.id);

  const resultado = sortear(
    jugadores.map((j) => ({ id: j.id, nombre: j.name })),
    reglas.map(
      (r): ReglaSorteo => ({
        tipo: r.type,
        from: r.fromParticipantId,
        to: r.toParticipantId,
        bidireccional: r.bidirectional,
      }),
    ),
    { evitarMutuos: evento.avoidMutual },
  );

  if (!resultado.ok) {
    const motivo = resultado.problemas[0]?.motivo ?? "No se pudo sortear.";
    redirect(`/eventos/${evento.id}/reglas?error=${encodeURIComponent(motivo)}`);
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.assignments)
      .where(eq(schema.assignments.eventId, evento.id));

    await tx.insert(schema.assignments).values(
      resultado.parejas.map((pareja) => ({
        eventId: evento.id,
        giverId: pareja.giver,
        receiverId: pareja.receiver,
      })),
    );

    await tx
      .update(schema.events)
      .set({ status: "drawn", drawnAt: new Date() })
      .where(eq(schema.events.id, evento.id));
  });

  // Aviso a cada quien. El correo no dice a quién le tocó: hay que entrar.
  const porId = new Map(jugadores.map((j) => [j.id, j]));
  for (const pareja of resultado.parejas) {
    const quienDa = porId.get(pareja.giver);
    if (!quienDa) continue;

    const url = await crearMagicLink(quienDa.email, `/e/${quienDa.id}`);
    const plantilla = plantillaSorteo({
      evento: evento.name,
      url,
      fecha: formatearFecha(evento.eventDate),
      presupuesto: formatearPresupuesto(evento.budgetAmount, evento.budgetCurrency),
    });

    await enviarCorreo({ to: quienDa.email, ...plantilla });

    await db
      .update(schema.assignments)
      .set({ notifiedAt: new Date() })
      .where(
        and(
          eq(schema.assignments.eventId, evento.id),
          eq(schema.assignments.giverId, quienDa.id),
        ),
      );
  }

  redirect(`/eventos/${evento.id}`);
}

/**
 * Borra las asignaciones y deja el evento sin sortear. Se puede aunque ya se
 * hayan mandado los correos: el correo no dice a quién le tocó, solo lleva a la
 * app, así que al volver a sortear cada quien verá su nueva persona.
 */
export async function deshacerSorteoAccion(datos: FormData) {
  const eventId = texto(datos, "eventId");
  const contexto = await eventoMio(eventId);
  if (!contexto || contexto.evento.status !== "drawn") return;

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.assignments)
      .where(eq(schema.assignments.eventId, contexto.evento.id));
    await tx
      .update(schema.events)
      .set({ status: "draft", drawnAt: null })
      .where(eq(schema.events.id, contexto.evento.id));
  });

  refresh();
}

/** Ver quién le regala a quién. Queda anotado quién miró y cuándo. */
export async function revelarAccion(datos: FormData) {
  const eventId = texto(datos, "eventId");
  const contexto = await eventoMio(eventId);
  if (!contexto || contexto.evento.status !== "drawn") return;

  await db.insert(schema.revealLog).values({
    eventId: contexto.evento.id,
    userId: contexto.usuario.id,
  });

  redirect(`/eventos/${contexto.evento.id}?revelar=1`);
}
