"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";

import { db, schema } from "@/db";
import { requerirUsuario } from "@/lib/auth";
import { participanteDelUsuario, quienLeRegalaA } from "@/lib/datos";
import { crearMagicLink } from "@/lib/magic-link";
import { enviarCorreo, plantillaListaActualizada } from "@/lib/mail";
import { obtenerPreview, type Preview } from "@/lib/og";

function texto(datos: FormData, campo: string) {
  const valor = datos.get(campo);
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

/** Lo llama el formulario al pegar un link, antes de guardar. */
export async function previsualizarLinkAccion(url: string): Promise<Preview | null> {
  await requerirUsuario();
  return obtenerPreview(url);
}


const ESPERA_AVISO_MS = 6 * 60 * 60 * 1000;

/**
 * Le avisa por correo a quien te regala que moviste tu lista. Como maximo un
 * aviso cada seis horas, para no llenarle el buzon a nadie. Si el evento no se
 * ha sorteado no hay a quien avisarle.
 */
async function avisarAQuienTeRegala(participantId: string) {
  const fila = await quienLeRegalaA(participantId);
  if (!fila) return;

  const { asignacion, quienDa } = fila;
  const reciente =
    asignacion.wishlistAlertAt &&
    Date.now() - asignacion.wishlistAlertAt.getTime() < ESPERA_AVISO_MS;
  if (reciente) return;

  const [evento] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, asignacion.eventId))
    .limit(1);
  if (!evento) return;

  const url = await crearMagicLink(quienDa.email, `/e/${quienDa.id}`);
  await enviarCorreo({
    to: quienDa.email,
    ...plantillaListaActualizada({ evento: evento.name, url }),
  });

  await db
    .update(schema.assignments)
    .set({ wishlistAlertAt: new Date() })
    .where(eq(schema.assignments.id, asignacion.id));
}

export async function agregarDeseoAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const participantId = texto(datos, "participantId");
  if (!participantId) return;

  const fila = await participanteDelUsuario(participantId, usuario);
  if (!fila) return;

  const url = texto(datos, "url");
  const titulo = texto(datos, "title") ?? (url ? "Regalo sorpresa" : null);
  if (!titulo) return;

  const imagenManual = texto(datos, "imageUrl");
  const imagenScrape = texto(datos, "scrapedImageUrl");
  const prioridad = Number.parseInt(texto(datos, "priority") ?? "2", 10);

  await db.insert(schema.wishlistItems).values({
    participantId,
    url,
    title: titulo.slice(0, 160),
    note: texto(datos, "note")?.slice(0, 500) ?? null,
    price: texto(datos, "price")?.slice(0, 40) ?? null,
    siteName: texto(datos, "siteName"),
    imageUrl: imagenManual ?? imagenScrape,
    imageSource: imagenManual ? "manual" : imagenScrape ? "scraped" : "none",
    priority: [1, 2, 3].includes(prioridad) ? prioridad : 2,
  });

  await db
    .update(schema.participants)
    .set({ wishlistUpdatedAt: new Date() })
    .where(eq(schema.participants.id, participantId));

  await avisarAQuienTeRegala(participantId);
  refresh();
}

export async function eliminarDeseoAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const participantId = texto(datos, "participantId");
  const itemId = texto(datos, "itemId");
  if (!participantId || !itemId) return;

  const fila = await participanteDelUsuario(participantId, usuario);
  if (!fila) return;

  await db
    .delete(schema.wishlistItems)
    .where(
      and(
        eq(schema.wishlistItems.id, itemId),
        eq(schema.wishlistItems.participantId, participantId),
      ),
    );

  await avisarAQuienTeRegala(participantId);
  refresh();
}

/** Cambiar lo que ya pediste: nombre, nota, precio, ganas o la foto. */
export async function editarDeseoAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const participantId = texto(datos, "participantId");
  const itemId = texto(datos, "itemId");
  const titulo = texto(datos, "title");
  if (!participantId || !itemId || !titulo) return;

  const fila = await participanteDelUsuario(participantId, usuario);
  if (!fila) return;

  const prioridad = Number.parseInt(texto(datos, "priority") ?? "2", 10);
  const imagen = texto(datos, "imageUrl");

  await db
    .update(schema.wishlistItems)
    .set({
      title: titulo.slice(0, 160),
      note: texto(datos, "note")?.slice(0, 500) ?? null,
      price: texto(datos, "price")?.slice(0, 40) ?? null,
      priority: [1, 2, 3].includes(prioridad) ? prioridad : 2,
      ...(imagen ? { imageUrl: imagen, imageSource: "manual" as const } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.wishlistItems.id, itemId),
        eq(schema.wishlistItems.participantId, participantId),
      ),
    );

  await db
    .update(schema.participants)
    .set({ wishlistUpdatedAt: new Date() })
    .where(eq(schema.participants.id, participantId));

  await avisarAQuienTeRegala(participantId);
  refresh();
}
