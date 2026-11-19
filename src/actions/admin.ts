"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";

import { db, schema } from "@/db";
import { requerirAdmin } from "@/lib/auth";
import { ENTRENADORES } from "@/lib/avatares";

function texto(datos: FormData, campo: string) {
  const valor = datos.get(campo);
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

/**
 * Corregir desde el panel el nombre y el entrenador de alguien. Sirve para
 * cuando una persona se queda con el nombre que salió de su correo y no sabe
 * dónde cambiarlo, o se le fue el dedo al elegir cara.
 *
 * Solo toca el perfil: su Pokémon es de cada evento y se elige ahí.
 */
export async function editarUsuarioAccion(datos: FormData) {
  await requerirAdmin();

  const userId = texto(datos, "userId");
  if (!userId) return;

  const nombre = texto(datos, "name");
  const clave = texto(datos, "trainerKey");
  const entrenador = clave
    ? (ENTRENADORES.find((e) => e.clave === clave)?.clave ?? null)
    : null;

  await db
    .update(schema.users)
    .set({ name: nombre?.slice(0, 60) ?? null, trainerKey: entrenador })
    .where(eq(schema.users.id, userId));

  refresh();
}
