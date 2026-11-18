import { NextResponse, type NextRequest } from "next/server";

import { usuarioActual } from "@/lib/auth";
import { buscarPokemon } from "@/lib/pokeapi";

/** Buscador de la Pokedex para el selector de avatar. */
export async function GET(peticion: NextRequest) {
  const usuario = await usuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "Necesitas entrar" }, { status: 401 });
  }

  const consulta = peticion.nextUrl.searchParams.get("q") ?? "";
  const resultados = await buscarPokemon(consulta);

  return NextResponse.json({ resultados });
}
