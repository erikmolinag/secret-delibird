import "server-only";

import { eq, inArray } from "drizzle-orm";
import { cache } from "react";

import { db, schema } from "@/db";
import {
  ajustesDelEntorno,
  esProveedor,
  type AjustesCorreo,
} from "@/lib/proveedores";

/** La clave del código de afiliado de Amazon en la tabla de ajustes. */
export const CLAVE_AMAZON = "amazon_tag";

export const CLAVE_PRIMERO = "email_primero";
export const CLAVE_FROM_PLUNK = "email_from_plunk";
export const CLAVE_FROM_RESEND = "email_from_resend";

export async function leerAjuste(clave: string) {
  const [fila] = await db
    .select({ valor: schema.settings.value })
    .from(schema.settings)
    .where(eq(schema.settings.key, clave))
    .limit(1);

  return fila?.valor.trim() || null;
}

/** El valor y cuándo se tocó, para poder decir "actualizado el ...". */
export async function leerAjusteConFecha(clave: string) {
  const [fila] = await db
    .select({
      valor: schema.settings.value,
      actualizado: schema.settings.updatedAt,
    })
    .from(schema.settings)
    .where(eq(schema.settings.key, clave))
    .limit(1);

  if (!fila?.valor.trim()) return null;
  return { valor: fila.valor.trim(), actualizado: fila.actualizado };
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

/** Varias claves de un jalón, para no hacer tres viajes por un correo. */
async function leerVarios(claves: string[]) {
  const filas = await db
    .select({ clave: schema.settings.key, valor: schema.settings.value })
    .from(schema.settings)
    .where(inArray(schema.settings.key, claves));

  return new Map(filas.map((f) => [f.clave, f.valor.trim() || null]));
}

/**
 * Cómo sale el correo: con cuál se intenta primero y desde qué dirección manda
 * cada proveedor.
 *
 * Esto vive en la base y no en variables de Vercel porque cambiarlo allá exige
 * volver a desplegar, y lo que se quiere es poder mover el remitente —o pasarse
 * al otro proveedor— mientras algo está fallando, sin esperar un deploy. Las
 * variables de entorno se quedan de respaldo, para que una base caída no deje a
 * la app sin saber desde dónde mandar.
 *
 * Sin `DATABASE_URL` ni siquiera lo intenta: así `enviarCorreo` se puede probar
 * sin levantar Postgres.
 */
export const ajustesDeCorreo = cache(async (): Promise<AjustesCorreo> => {
  const delEntorno = ajustesDelEntorno();

  if (!process.env.DATABASE_URL) return delEntorno;

  try {
    const guardados = await leerVarios([
      CLAVE_PRIMERO,
      CLAVE_FROM_PLUNK,
      CLAVE_FROM_RESEND,
    ]);

    const primero = guardados.get(CLAVE_PRIMERO);

    return {
      primero: primero && esProveedor(primero) ? primero : delEntorno.primero,
      fromPlunk: guardados.get(CLAVE_FROM_PLUNK) ?? delEntorno.fromPlunk,
      fromResend: guardados.get(CLAVE_FROM_RESEND) ?? delEntorno.fromResend,
    };
  } catch (e) {
    // Que la base esté caída no tiene por qué impedir mandar un correo.
    console.error("No se pudieron leer los ajustes de correo:", e);
    return delEntorno;
  }
});
