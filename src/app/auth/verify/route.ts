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

  return NextResponse.redirect(new URL(destino, peticion.url));
}
