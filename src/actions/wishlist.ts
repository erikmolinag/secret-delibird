"use server";

import { and, desc, eq } from "drizzle-orm";
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


const TOPE_FOTO = 900_000; // ~650 KB de imagen ya codificada

/**
 * Guarda la miniatura que armo el navegador y devuelve la URL con la que se
 * pinta. Si la foto no cuadra, devuelve null y el regalo se queda como estaba.
 */
async function guardarFoto(itemId: string, dataUrl: string) {
  const partes = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(
    dataUrl,
  );
  if (!partes) return null;

  const [, mime, datos] = partes;
  if (datos.length > TOPE_FOTO) return null;

  await db
    .insert(schema.wishlistImages)
    .values({ itemId, mime, datos })
    .onConflictDoUpdate({
      target: schema.wishlistImages.itemId,
      set: { mime, datos, createdAt: new Date() },
    });

  // La version en la URL hace que el navegador no se quede con la foto vieja.
  return `/api/imagen/${itemId}?v=${Date.now()}`;
}

async function borrarFoto(itemId: string) {
  await db
    .delete(schema.wishlistImages)
    .where(eq(schema.wishlistImages.itemId, itemId));
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
  const fotoSubida = texto(datos, "fotoSubida");
  const prioridad = Number.parseInt(texto(datos, "priority") ?? "2", 10);

  // Al final de la lista, para que lo nuevo no se cuele hasta arriba.
  const [ultimo] = await db
    .select({ posicion: schema.wishlistItems.position })
    .from(schema.wishlistItems)
    .where(eq(schema.wishlistItems.participantId, participantId))
    .orderBy(desc(schema.wishlistItems.position))
    .limit(1);

  const [creado] = await db
    .insert(schema.wishlistItems)
    .values({
      participantId,
      url,
      title: titulo.slice(0, 160),
      note: texto(datos, "note")?.slice(0, 500) ?? null,
      price: texto(datos, "price")?.slice(0, 40) ?? null,
      siteName: texto(datos, "siteName"),
      imageUrl: imagenManual ?? imagenScrape,
      imageSource: imagenManual ? "manual" : imagenScrape ? "scraped" : "none",
      priority: [1, 2, 3].includes(prioridad) ? prioridad : 2,
      position: (ultimo?.posicion ?? 0) + 1,
    })
    .returning({ id: schema.wishlistItems.id });

  if (fotoSubida && creado) {
    const url = await guardarFoto(creado.id, fotoSubida);
    if (url) {
      await db
        .update(schema.wishlistItems)
        .set({ imageUrl: url, imageSource: "manual" })
        .where(eq(schema.wishlistItems.id, creado.id));
    }
  }

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
  const fotoSubida = texto(datos, "fotoSubida");

  // La foto subida gana sobre la dirección pegada a mano.
  let foto: string | null = null;
  if (fotoSubida) foto = await guardarFoto(itemId, fotoSubida);
  else if (imagen) await borrarFoto(itemId);

  await db
    .update(schema.wishlistItems)
    .set({
      title: titulo.slice(0, 160),
      note: texto(datos, "note")?.slice(0, 500) ?? null,
      price: texto(datos, "price")?.slice(0, 40) ?? null,
      priority: [1, 2, 3].includes(prioridad) ? prioridad : 2,
      ...(foto
        ? { imageUrl: foto, imageSource: "manual" as const }
        : imagen
          ? { imageUrl: imagen, imageSource: "manual" as const }
          : {}),
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

/** Guarda el orden nuevo despues de arrastrar. */
export async function reordenarDeseosAccion(orden: {
  participantId: string;
  ids: string[];
}) {
  const usuario = await requerirUsuario();

  const fila = await participanteDelUsuario(orden.participantId, usuario);
  if (!fila) return { ok: false as const };

  const mios = await db
    .select({ id: schema.wishlistItems.id })
    .from(schema.wishlistItems)
    .where(eq(schema.wishlistItems.participantId, orden.participantId));

  const permitidos = new Set(mios.map((m) => m.id));
  const limpios = orden.ids.filter((id) => permitidos.has(id));
  if (limpios.length !== permitidos.size) return { ok: false as const };

  await db.transaction(async (tx) => {
    for (const [posicion, id] of limpios.entries()) {
      await tx
        .update(schema.wishlistItems)
        .set({ position: posicion + 1 })
        .where(eq(schema.wishlistItems.id, id));
    }
  });

  refresh();
  return { ok: true as const };
}
