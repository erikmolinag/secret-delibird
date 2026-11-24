import "server-only";

import crypto from "node:crypto";

import { and, eq, isNull, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { nombreDeInvitacion } from "@/lib/datos";
import { nombreDesdeEmail } from "@/lib/utils";

export const VIGENCIA_MINUTOS = 20;

/** Lo que dura el enlace que va dentro de un correo nuestro: un mes. */
export const VIGENCIA_AVISO_DIAS = 30;

function hashear(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * La base de todos los magic links. Si en producción se olvida APP_URL, Vercel
 * nos da su propio dominio: peor sería mandar correos que apuntan a localhost.
 */
export function urlBase() {
  const configurada = process.env.APP_URL?.replace(/\/$/, "");
  if (configurada) return configurada;

  const enVercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (enVercel) return `https://${enVercel}`;

  return "http://localhost:3000";
}

async function crear(
  email: string,
  redirectTo: string | null | undefined,
  duracionMs: number,
  reusable: boolean,
) {
  const token = crypto.randomBytes(32).toString("base64url");

  await db.insert(schema.loginTokens).values({
    email,
    tokenHash: hashear(token),
    redirectTo: redirectTo ?? null,
    reusable,
    expiresAt: new Date(Date.now() + duracionMs),
  });

  const url = new URL("/auth/verify", urlBase());
  url.searchParams.set("token", token);
  return url.toString();
}

/**
 * El enlace de la pantalla de entrar: veinte minutos y un solo uso.
 *
 * Es corto a propósito, porque cualquiera lo puede disparar escribiendo el
 * correo de otra persona. Solo guardamos el hash del token.
 */
export async function crearMagicLink(email: string, redirectTo?: string | null) {
  return crear(email, redirectTo, VIGENCIA_MINUTOS * 60_000, false);
}

/**
 * El enlace que va dentro de un correo que mandamos nosotros: la invitación, el
 * aviso del sorteo, el de una lista que se movió, el de una carta.
 *
 * Dura un mes y sirve las veces que lo abran. Veinte minutos y un solo uso
 * servían para la pantalla de entrar, pero aquí no: la gente abre el correo al
 * otro día, o lo vuelve a buscar en el buzón la semana siguiente, y se topaba
 * con un enlace muerto en un correo que nadie pidió.
 *
 * El costo es real y es a propósito: quien reenvíe ese correo le está dando a
 * otro la entrada a su cuenta durante ese mes. Se aguanta porque estos enlaces
 * los dispara quien organiza, a una lista de correos que él escribió, y no un
 * desconocido escribiendo direcciones ajenas en una pantalla pública.
 */
export async function crearEnlaceDuradero(email: string, redirectTo?: string | null) {
  return crear(email, redirectTo, VIGENCIA_AVISO_DIAS * 86_400_000, true);
}

type Resultado =
  | { ok: true; usuario: User; redirectTo: string | null }
  | { ok: false; motivo: "invalido" | "usado" | "vencido" };

/** Valida el token, lo quema, crea la cuenta si hace falta y liga sus invitaciones. */
export async function consumirMagicLink(token: string): Promise<Resultado> {
  const [fila] = await db
    .select()
    .from(schema.loginTokens)
    .where(eq(schema.loginTokens.tokenHash, hashear(token)))
    .limit(1);

  if (!fila) return { ok: false, motivo: "invalido" };
  // Los duraderos no se queman: se les anota el último uso y ya.
  if (fila.usedAt && !fila.reusable) return { ok: false, motivo: "usado" };
  if (fila.expiresAt.getTime() < Date.now()) return { ok: false, motivo: "vencido" };

  await db
    .update(schema.loginTokens)
    .set({ usedAt: new Date() })
    .where(eq(schema.loginTokens.id, fila.id));

  let [usuario] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, fila.email))
    .limit(1);

  if (!usuario) {
    // Si lo invitaron, su nombre es el que escribió quien organiza al agregarlo;
    // si llegó por su cuenta, lo sacamos del correo y luego lo cambia él.
    const invitado = await nombreDeInvitacion(fila.email);

    [usuario] = await db
      .insert(schema.users)
      .values({
        email: fila.email,
        name: invitado ?? nombreDesdeEmail(fila.email),
      })
      .returning();
  }

  // Cualquier invitación hecha a ese correo pasa a ser suya.
  await db
    .update(schema.participants)
    .set({
      userId: usuario.id,
      joinedAt: sql`coalesce(${schema.participants.joinedAt}, now())`,
    })
    .where(
      and(
        eq(schema.participants.email, fila.email),
        isNull(schema.participants.userId),
      ),
    );

  return { ok: true, usuario, redirectTo: fila.redirectTo };
}
