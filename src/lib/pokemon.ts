/**
 * Avatares Pokémon. Usamos sprites de PokeAPI (CDN de GitHub, sin API key):
 * no hay que guardar imagenes ni pedir permisos de red raros.
 */

export type PokemonAvatar = { id: number; nombre: string };

/** Pokémon de hielo / invierno / navideños. Alcanza para eventos grandes. */
export const POKEMON_INVERNALES: PokemonAvatar[] = [
  { id: 225, nombre: "Delibird" },
  { id: 131, nombre: "Lapras" },
  { id: 144, nombre: "Articuno" },
  { id: 124, nombre: "Jynx" },
  { id: 215, nombre: "Sneasel" },
  { id: 220, nombre: "Swinub" },
  { id: 221, nombre: "Piloswine" },
  { id: 234, nombre: "Stantler" },
  { id: 238, nombre: "Smoochum" },
  { id: 361, nombre: "Snorunt" },
  { id: 362, nombre: "Glalie" },
  { id: 363, nombre: "Spheal" },
  { id: 364, nombre: "Sealeo" },
  { id: 365, nombre: "Walrein" },
  { id: 378, nombre: "Regice" },
  { id: 459, nombre: "Snover" },
  { id: 460, nombre: "Abomasnow" },
  { id: 471, nombre: "Glaceon" },
  { id: 473, nombre: "Mamoswine" },
  { id: 478, nombre: "Froslass" },
  { id: 582, nombre: "Vanillite" },
  { id: 583, nombre: "Vanillish" },
  { id: 584, nombre: "Vanilluxe" },
  { id: 613, nombre: "Cubchoo" },
  { id: 614, nombre: "Beartic" },
  { id: 615, nombre: "Cryogonal" },
  { id: 646, nombre: "Kyurem" },
  { id: 698, nombre: "Amaura" },
  { id: 699, nombre: "Aurorus" },
  { id: 712, nombre: "Bergmite" },
  { id: 713, nombre: "Avalugg" },
  { id: 740, nombre: "Crabominable" },
  { id: 866, nombre: "Mr. Rime" },
  { id: 873, nombre: "Frosmoth" },
  { id: 875, nombre: "Eiscue" },
  { id: 974, nombre: "Cetoddle" },
  { id: 975, nombre: "Cetitan" },
  { id: 1002, nombre: "Chien-Pao" },
];

export const DELIBIRD_ID = 225;

const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/**
 * Sprite pixelado de los juegos: ligero, ideal para avatares. El shiny es el
 * mismo Pokemon con la otra paleta; se consigue tocando cinco veces el sprite
 * mientras lo eliges.
 */
export function spritePokemon(id: number, shiny = false) {
  return shiny ? `${BASE}/shiny/${id}.png` : `${BASE}/${id}.png`;
}

/** Arte oficial: grande y limpio, para heroes y tarjetas. */
export function artePokemon(id: number) {
  return `${BASE}/other/official-artwork/${id}.png`;
}

export function nombrePokemon(id: number) {
  return POKEMON_INVERNALES.find((p) => p.id === id)?.nombre ?? `Pokémon #${id}`;
}

export const GENERACIONES = [
  { numero: 1, region: "Kanto", desde: 1, hasta: 151 },
  { numero: 2, region: "Johto", desde: 152, hasta: 251 },
  { numero: 3, region: "Hoenn", desde: 252, hasta: 386 },
  { numero: 4, region: "Sinnoh", desde: 387, hasta: 493 },
  { numero: 5, region: "Teselia", desde: 494, hasta: 649 },
  { numero: 6, region: "Kalos", desde: 650, hasta: 721 },
  { numero: 7, region: "Alola", desde: 722, hasta: 809 },
  { numero: 8, region: "Galar", desde: 810, hasta: 905 },
  { numero: 9, region: "Paldea", desde: 906, hasta: 1025 },
] as const;

export function generacionDe(id: number) {
  return GENERACIONES.find((g) => id >= g.desde && id <= g.hasta) ?? null;
}
