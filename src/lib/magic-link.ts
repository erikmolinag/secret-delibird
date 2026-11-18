import "server-only";

import crypto from "node:crypto";

import { and, eq, isNull, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import type { User } from "@/db/schema";
import { nombreDesdeEmail } from "@/lib/utils";

export const VIGENCIA_MINUTOS = 20;

function hashear(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function urlBase() {
  return process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

/** Crea un magic link de un solo uso. Solo guardamos el hash del token. */
export async function crearMagicLink(email: string, redirectTo?: string | null) {
  const token = crypto.randomBytes(32).toString("base64url");

  await db.insert(schema.loginTokens).values({
    email,
    tokenHash: hashear(token),
    redirectTo: redirectTo ?? null,
    expiresAt: new Date(Date.now() + VIGENCIA_MINUTOS * 60_000),
  });

  const url = new URL("/auth/verify", urlBase());
  url.searchParams.set("token", token);
  return url.toString();
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
  if (fila.usedAt) return { ok: false, motivo: "usado" };
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
    [usuario] = await db
      .insert(schema.users)
      .values({ email: fila.email, name: nombreDesdeEmail(fila.email) })
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
