import "server-only";

import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { db, schema } from "@/db";

const COOKIE = "delibird_sesion";
const DIAS = 30;

function clave() {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) throw new Error("Falta AUTH_SECRET en el entorno");
  return new TextEncoder().encode(secreto);
}

export async function crearSesion(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DIAS}d`)
    .sign(clave());

  const galletas = await cookies();
  galletas.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DIAS * 24 * 60 * 60,
  });
}

export async function cerrarSesion() {
  const galletas = await cookies();
  galletas.delete(COOKIE);
}

export async function usuarioActual() {
  const galletas = await cookies();
  const token = galletas.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, clave());
    if (!payload.sub) return null;
    const [usuario] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, payload.sub))
      .limit(1);
    return usuario ?? null;
  } catch {
    return null;
  }
}

export async function requerirUsuario() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}

/** Quién ve el panel de admin: correos separados por coma en ADMIN_EMAILS. */
export function esAdmin(usuario: { email: string }) {
  const correos = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .filter(Boolean);
  return correos.includes(usuario.email.toLowerCase());
}

/** Para los demás el panel no existe: 404, no "prohibido". */
export async function requerirAdmin() {
  const usuario = await requerirUsuario();
  if (!esAdmin(usuario)) notFound();
  return usuario;
}
