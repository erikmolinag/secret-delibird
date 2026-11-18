import "server-only";

import { cacheLife } from "next/cache";

export type PokemonBasico = { id: number; nombre: string };

/** Acentos y mayusculas fuera, para buscar sin pelearse con el teclado. */
export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function capitalizar(nombre: string) {
  return nombre
    .split("-")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

/** La lista completa de la Pokedex. Se cachea: cambia una vez por generacion. */
export async function listaPokemon(): Promise<PokemonBasico[]> {
  "use cache";
  cacheLife("days");

  try {
    const respuesta = await fetch(
      "https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0",
      { headers: { accept: "application/json" } },
    );
    if (!respuesta.ok) return [];

    const datos = (await respuesta.json()) as {
      results?: { name: string; url: string }[];
    };

    return (datos.results ?? []).map((entrada, i) => ({
      id: i + 1,
      nombre: capitalizar(entrada.name),
    }));
  } catch {
    return [];
  }
}

/** Sin consulta devuelve la Pokedex completa: la pantalla la parte por generacion. */
export async function buscarPokemon(consulta: string, limite = 200) {
  const todos = await listaPokemon();
  const q = normalizar(consulta);

  if (!q) return todos;

  const porNumero = Number.parseInt(q, 10);
  const resultados = todos.filter(
    (p) => normalizar(p.nombre).includes(q) || p.id === porNumero,
  );

  // Los que empiezan con lo que escribiste van primero.
  resultados.sort((a, b) => {
    const aEmpieza = normalizar(a.nombre).startsWith(q) ? 0 : 1;
    const bEmpieza = normalizar(b.nombre).startsWith(q) ? 0 : 1;
    return aEmpieza - bEmpieza || a.id - b.id;
  });

  return resultados.slice(0, limite);
}
