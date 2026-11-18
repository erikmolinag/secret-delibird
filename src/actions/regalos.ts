"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";

import { db, schema } from "@/db";
import { requerirUsuario } from "@/lib/auth";
import { aQuienLeRegala, participanteDelUsuario } from "@/lib/datos";

function texto(datos: FormData, campo: string) {
  const valor = datos.get(campo);
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

/**
 * "Ya lo compré" sobre un regalo de la lista de tu persona. Es tuyo y nada más
 * tuyo: el dueño de la lista nunca ve esta marca, ni en su página ni en correos.
 */
export async function alternarCompradoAccion(datos: FormData) {
  const usuario = await requerirUsuario();
  const participantId = texto(datos, "participantId");
  const itemId = texto(datos, "itemId");
  if (!participantId || !itemId) return;

  // Quien marca tiene que ser quien regala.
  const mio = await participanteDelUsuario(participantId, usuario);
  if (!mio) return;

  const asignado = await aQuienLeRegala(participantId);
  if (!asignado) return;

  // Y el regalo tiene que ser de la lista de su persona.
  const [regalo] = await db
    .select({ id: schema.wishlistItems.id })
    .from(schema.wishlistItems)
    .where(
      and(
        eq(schema.wishlistItems.id, itemId),
        eq(schema.wishlistItems.participantId, asignado.receptor.id),
      ),
    )
    .limit(1);
  if (!regalo) return;

  const [marcado] = await db
    .select({
      id: schema.reservations.id,
      quien: schema.reservations.byParticipantId,
    })
    .from(schema.reservations)
    .where(eq(schema.reservations.itemId, itemId))
    .limit(1);

  if (marcado?.quien === participantId) {
    // Era mía: la quito.
    await db.delete(schema.reservations).where(eq(schema.reservations.id, marcado.id));
    refresh();
    return;
  }

  if (marcado) {
    // Quedó colgada de un sorteo anterior: se la gano.
    await db.delete(schema.reservations).where(eq(schema.reservations.id, marcado.id));
  }

  await db
    .insert(schema.reservations)
    .values({ itemId, byParticipantId: participantId });

  refresh();
}
