"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { db, schema } from "@/db";
import { requerirUsuario } from "@/lib/auth";
import { ENTRENADORES } from "@/lib/avatares";
import { participanteDelUsuario } from "@/lib/datos";

function texto(datos: FormData, campo: string) {
  const valor = datos.get(campo);
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

/**
 * El perfil es general: tu nombre de entrenador y tu sprite de entrenador se
 * ven igual en todos los intercambios en los que estés.
 */
export async function actualizarPerfilAccion(datos: FormData) {
  const usuario = await requerirUsuario();

  const nombre = texto(datos, "name");
  const clave = texto(datos, "trainerKey");
  const entrenador = clave
    ? (ENTRENADORES.find((e) => e.clave === clave)?.clave ?? null)
    : null;

  await db
    .update(schema.users)
    .set({
      name: nombre?.slice(0, 60) ?? usuario.name,
      trainerKey: entrenador,
      onboardedAt: usuario.onboardedAt ?? new Date(),
    })
    .where(eq(schema.users.id, usuario.id));

  // Si venía de entrar por primera vez, lo devolvemos a donde iba.
  const siguiente = texto(datos, "siguiente");
  if (siguiente?.startsWith("/")) redirect(siguiente);

  refresh();
}

/** El Pokémon sí es de cada evento: puedes llevar uno distinto a cada uno. */
export async function cambiarPokemonAccion(eleccion: {
  participantId: string;
  pokemonId: number;
  nombre: string;
}) {
  const usuario = await requerirUsuario();

  const fila = await participanteDelUsuario(eleccion.participantId, usuario);
  if (!fila) return { ok: false as const };

  const id = Math.trunc(eleccion.pokemonId);
  if (!Number.isFinite(id) || id < 1 || id > 1025) return { ok: false as const };

  await db
    .update(schema.participants)
    .set({ pokemonId: id, avatarNombre: eleccion.nombre.slice(0, 40) })
    .where(eq(schema.participants.id, eleccion.participantId));

  refresh();
  return { ok: true as const };
}
