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

/** Sprite pixelado de los juegos: ligero, ideal para avatares. */
export function spritePokemon(id: number) {
  return `${BASE}/${id}.png`;
}

/** Arte oficial: grande y limpio, para heroes y tarjetas. */
export function artePokemon(id: number) {
  return `${BASE}/other/official-artwork/${id}.png`;
}

export function nombrePokemon(id: number) {
  return POKEMON_INVERNALES.find((p) => p.id === id)?.nombre ?? `Pokémon #${id}`;
}

/** PRNG deterministico para que el mismo evento siempre reparta igual. */
function mulberry32(semilla: number) {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Reparte un Pokémon distinto a cada invitado del evento, de forma estable:
 * mismo evento + mismos ocupados = mismo resultado.
 */
export function asignarPokemon(eventId: string, ocupados: number[]) {
  const random = mulberry32(hash(eventId));
  const baraja = [...POKEMON_INVERNALES];
  for (let i = baraja.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
  }
  const usados = new Set(ocupados);
  const libre = baraja.find((p) => !usados.has(p.id));
  // Si el evento tiene más invitados que Pokémon de la lista, reciclamos.
  return (libre ?? baraja[ocupados.length % baraja.length]).id;
}
