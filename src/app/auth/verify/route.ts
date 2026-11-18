import { NextResponse, type NextRequest } from "next/server";

import { crearSesion } from "@/lib/auth";
import { consumirMagicLink } from "@/lib/magic-link";

export async function GET(peticion: NextRequest) {
  const token = peticion.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalido", peticion.url));
  }

  const resultado = await consumirMagicLink(token);

  if (!resultado.ok) {
    return NextResponse.redirect(
      new URL(`/login?error=${resultado.motivo}`, peticion.url),
    );
  }

  await crearSesion(resultado.usuario.id);

  const destino =
    resultado.redirectTo && resultado.redirectTo.startsWith("/")
      ? resultado.redirectTo
      : "/eventos";

  // La primera vez que alguien entra —porque se registró o porque aceptó una
  // invitación— lo primero es ponerse nombre y cara. Luego sigue a donde iba.
  if (!resultado.usuario.onboardedAt) {
    const perfil = new URL("/perfil", peticion.url);
    perfil.searchParams.set("siguiente", destino);
    return NextResponse.redirect(perfil);
  }

  return NextResponse.redirect(new URL(destino, peticion.url));
}
