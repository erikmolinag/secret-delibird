"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";

import { db, schema } from "@/db";
import { requerirUsuario } from "@/lib/auth";
import { ENTRENADORES } from "@/lib/avatares";
import { participanteDelUsuario } from "@/lib/datos";

type Eleccion =
  | { participantId: string; tipo: "entrenador"; clave: string }
  | { participantId: string; tipo: "pokemon"; pokemonId: number; nombre: string };

/** Cada quien elige su sprite: un entrenador o cualquier Pokemon de la Pokedex. */
export async function cambiarAvatarAccion(eleccion: Eleccion) {
  const usuario = await requerirUsuario();

  const fila = await participanteDelUsuario(eleccion.participantId, usuario);
  if (!fila) return { ok: false as const };

  if (eleccion.tipo === "entrenador") {
    const entrenador = ENTRENADORES.find((e) => e.clave === eleccion.clave);
    if (!entrenador) return { ok: false as const };

    await db
      .update(schema.participants)
      .set({
        avatarKind: "entrenador",
        trainerKey: entrenador.clave,
        avatarNombre: entrenador.nombre,
      })
      .where(eq(schema.participants.id, eleccion.participantId));
  } else {
    const id = Math.trunc(eleccion.pokemonId);
    if (!Number.isFinite(id) || id < 1 || id > 1025) return { ok: false as const };

    await db
      .update(schema.participants)
      .set({
        avatarKind: "pokemon",
        pokemonId: id,
        trainerKey: null,
        avatarNombre: eleccion.nombre.slice(0, 40),
      })
      .where(eq(schema.participants.id, eleccion.participantId));
  }

  refresh();
  return { ok: true as const };
}
