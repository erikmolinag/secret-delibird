/**
 * Avatares: sprite de Pokemon (PokeAPI) o sprite de entrenador (Pokemon Showdown).
 * Ninguno de los dos necesita API key ni guardar imagenes.
 */

import { nombrePokemon, spritePokemon } from "@/lib/pokemon";

export type TipoAvatar = "pokemon" | "entrenador";

export type Entrenador = {
  clave: string;
  nombre: string;
  grupo: string;
};

const PROTAGONISTAS: Entrenador[] = [
  { clave: "red", nombre: "Red", grupo: "Gen 1 · Kanto" },
  { clave: "green", nombre: "Green", grupo: "Gen 1 · Kanto" },
  { clave: "ethan", nombre: "Ethan", grupo: "Gen 2 · Johto" },
  { clave: "lyra", nombre: "Lyra", grupo: "Gen 2 · Johto" },
  { clave: "kris", nombre: "Kris", grupo: "Gen 2 · Johto" },
  { clave: "brendan", nombre: "Brendan", grupo: "Gen 3 · Hoenn" },
  { clave: "may", nombre: "May", grupo: "Gen 3 · Hoenn" },
  { clave: "lucas", nombre: "Lucas", grupo: "Gen 4 · Sinnoh" },
  { clave: "dawn", nombre: "Dawn", grupo: "Gen 4 · Sinnoh" },
  { clave: "hilbert", nombre: "Hilbert", grupo: "Gen 5 · Teselia" },
  { clave: "hilda", nombre: "Hilda", grupo: "Gen 5 · Teselia" },
  { clave: "nate", nombre: "Nate", grupo: "Gen 5 · Teselia" },
  { clave: "rosa", nombre: "Rosa", grupo: "Gen 5 · Teselia" },
  { clave: "calem", nombre: "Calem", grupo: "Gen 6 · Kalos" },
  { clave: "serena", nombre: "Serena", grupo: "Gen 6 · Kalos" },
  { clave: "elio", nombre: "Elio", grupo: "Gen 7 · Alola" },
  { clave: "selene", nombre: "Selene", grupo: "Gen 7 · Alola" },
  { clave: "victor", nombre: "Victor", grupo: "Gen 8 · Galar" },
  { clave: "gloria", nombre: "Gloria", grupo: "Gen 8 · Galar" },
];

const CONOCIDOS: Entrenador[] = [
  { clave: "blue", nombre: "Blue", grupo: "Caras conocidas" },
  { clave: "brock", nombre: "Brock", grupo: "Caras conocidas" },
  { clave: "misty", nombre: "Misty", grupo: "Caras conocidas" },
  { clave: "lance", nombre: "Lance", grupo: "Caras conocidas" },
  { clave: "giovanni", nombre: "Giovanni", grupo: "Caras conocidas" },
  { clave: "silver", nombre: "Silver", grupo: "Caras conocidas" },
  { clave: "cynthia", nombre: "Cynthia", grupo: "Caras conocidas" },
  { clave: "barry", nombre: "Barry", grupo: "Caras conocidas" },
  { clave: "hugh", nombre: "Hugh", grupo: "Caras conocidas" },
  { clave: "hop", nombre: "Hop", grupo: "Caras conocidas" },
  { clave: "marnie", nombre: "Marnie", grupo: "Caras conocidas" },
  { clave: "leon", nombre: "Leon", grupo: "Caras conocidas" },
  { clave: "raihan", nombre: "Raihan", grupo: "Caras conocidas" },
  { clave: "penny", nombre: "Penny", grupo: "Caras conocidas" },
];

export const ENTRENADORES = [...PROTAGONISTAS, ...CONOCIDOS];

export const GRUPOS_ENTRENADORES = ENTRENADORES.reduce<
  { grupo: string; entrenadores: Entrenador[] }[]
>((acc, entrenador) => {
  const ultimo = acc.at(-1);
  if (ultimo && ultimo.grupo === entrenador.grupo) ultimo.entrenadores.push(entrenador);
  else acc.push({ grupo: entrenador.grupo, entrenadores: [entrenador] });
  return acc;
}, []);

export function urlEntrenador(clave: string) {
  return `https://play.pokemonshowdown.com/sprites/trainers/${clave}.png`;
}

export function nombreEntrenador(clave: string | null) {
  if (!clave) return "Entrenador";
  return ENTRENADORES.find((e) => e.clave === clave)?.nombre ?? "Entrenador";
}

type ConAvatar = {
  avatarKind: TipoAvatar;
  pokemonId: number;
  trainerKey: string | null;
  avatarNombre: string | null;
};

export function urlAvatar(p: ConAvatar) {
  return p.avatarKind === "entrenador" && p.trainerKey
    ? urlEntrenador(p.trainerKey)
    : spritePokemon(p.pokemonId);
}

export function nombreAvatar(p: ConAvatar) {
  if (p.avatarNombre) return p.avatarNombre;
  return p.avatarKind === "entrenador"
    ? nombreEntrenador(p.trainerKey)
    : nombrePokemon(p.pokemonId);
}
