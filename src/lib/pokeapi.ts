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

/**
 * El Pokemon que le toca de entrada a alguien en un evento: cualquiera de la
 * Pokedex, evitando los que ya estan ocupados en ese intercambio. Si PokeAPI no
 * contesta, caemos a la lista invernal, que vive en el codigo.
 */
export async function elegirPokemonParaEvento(ocupados: number[]) {
  const todos = await listaPokemon();
  const usados = new Set(ocupados);

  if (!todos.length) {
    const { POKEMON_INVERNALES } = await import("@/lib/pokemon");
    const libre =
      POKEMON_INVERNALES.find((p) => !usados.has(p.id)) ?? POKEMON_INVERNALES[0];
    return { id: libre.id, nombre: libre.nombre };
  }

  for (let intento = 0; intento < 40; intento++) {
    const elegido = todos[Math.floor(Math.random() * todos.length)];
    if (elegido && !usados.has(elegido.id)) return elegido;
  }

  return todos.find((p) => !usados.has(p.id)) ?? todos[0];
}
