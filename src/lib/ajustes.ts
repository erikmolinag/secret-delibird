import "server-only";

import { eq } from "drizzle-orm";
import { cache } from "react";

import { db, schema } from "@/db";

/** La clave del código de afiliado de Amazon en la tabla de ajustes. */
export const CLAVE_AMAZON = "amazon_tag";

export async function leerAjuste(clave: string) {
  const [fila] = await db
    .select({ valor: schema.settings.value })
    .from(schema.settings)
    .where(eq(schema.settings.key, clave))
    .limit(1);

  return fila?.valor.trim() || null;
}

/** Guardar con valor vacío borra el ajuste: así se apaga sin dejar basura. */
export async function guardarAjuste(clave: string, valor: string | null) {
  if (!valor) {
    await db.delete(schema.settings).where(eq(schema.settings.key, clave));
    return;
  }

  await db
    .insert(schema.settings)
    .values({ key: clave, value: valor })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value: valor, updatedAt: new Date() },
    });
}

/**
 * El código con el que se marcan los enlaces de Amazon. Si no hay ninguno
 * puesto, los enlaces se quedan como los pegó cada quien.
 *
 * Va envuelto en `cache` porque una sola pantalla puede pedir tres listas y
 * sería la misma consulta tres veces; así se hace una por petición.
 */
export const codigoAmazon = cache(async () => leerAjuste(CLAVE_AMAZON));
