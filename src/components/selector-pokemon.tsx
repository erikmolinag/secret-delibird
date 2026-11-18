"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { cambiarPokemonAccion } from "@/actions/perfil";
import { Boton } from "@/components/ui/boton";
import { Entrada } from "@/components/ui/campo";
import { nombrePokemon, spritePokemon } from "@/lib/pokemon";

type PokemonBasico = { id: number; nombre: string };

export function SelectorPokemon({
  participantId,
  pokemonId,
  nombre,
}: {
  participantId: string;
  pokemonId: number;
  nombre: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<PokemonBasico[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [guardando, iniciarGuardado] = useTransition();

  useEffect(() => {
    if (!abierto) return;

    const control = new AbortController();
    const tiempo = setTimeout(async () => {
      setBuscando(true);
      try {
        const respuesta = await fetch(
          `/api/pokemon?q=${encodeURIComponent(consulta)}`,
          { signal: control.signal },
        );
        if (respuesta.ok) {
          const datos = (await respuesta.json()) as { resultados: PokemonBasico[] };
          setResultados(datos.resultados ?? []);
        }
      } catch {
        // cancelado o sin red: dejamos lo que ya estaba
      } finally {
        setBuscando(false);
      }
    }, 250);

    return () => {
      control.abort();
      clearTimeout(tiempo);
    };
  }, [abierto, consulta]);

  function elegir(pokemon: PokemonBasico) {
    iniciarGuardado(async () => {
      await cambiarPokemonAccion({
        participantId,
        pokemonId: pokemon.id,
        nombre: pokemon.nombre,
      });
      setAbierto(false);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-32 shrink-0 place-items-center rounded-full border-[3px] border-tinta bg-crema-2 shadow-dura-sm sm:size-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spritePokemon(pokemonId)}
            alt={nombre ?? nombrePokemon(pokemonId)}
            className="size-[86%] object-contain [image-rendering:pixelated]"
            referrerPolicy="no-referrer"
          />
        </span>

        <div>
          <p className="font-display text-xl font-extrabold">
            {nombre ?? nombrePokemon(pokemonId)}
          </p>
          <p className="mb-2 text-sm text-gris">
            Te acompaña solo en este intercambio. En otro puedes llevar otro.
          </p>
          <Boton
            type="button"
            variante={abierto ? "fantasma" : "azul"}
            tamano="sm"
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? (
              <>
                <X className="size-4" /> Cerrar
              </>
            ) : (
              "Cambiar de Pokémon"
            )}
          </Boton>
        </div>
      </div>

      {abierto ? (
        <div className="space-y-3 rounded-3xl border-[3px] border-tinta bg-crema p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gris" />
            <Entrada
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Busca por nombre o número: Snorlax, 143..."
              className="pl-10"
              autoFocus
            />
          </div>

          {guardando ? (
            <p className="flex items-center gap-2 text-sm font-bold text-azul">
              <Loader2 className="size-4 animate-spin" /> Guardando
            </p>
          ) : null}

          <div className="grid max-h-[26rem] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:max-h-80 sm:grid-cols-5">
            {resultados.map((pokemon) => (
              <button
                key={pokemon.id}
                type="button"
                disabled={guardando}
                onClick={() => elegir(pokemon)}
                title={`#${pokemon.id} ${pokemon.nombre}`}
                className="group flex flex-col items-center gap-1 rounded-2xl border-[3px] border-tinta bg-blanco p-2 transition hover:-translate-y-0.5 hover:bg-amarillo-claro disabled:opacity-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={spritePokemon(pokemon.id)}
                  alt={pokemon.nombre}
                  loading="lazy"
                  className="size-20 object-contain [image-rendering:pixelated] sm:size-16"
                  referrerPolicy="no-referrer"
                />
                <span className="w-full truncate text-center text-xs font-bold">
                  {pokemon.nombre}
                </span>
              </button>
            ))}
          </div>

          {!buscando && resultados.length === 0 ? (
            <p className="py-6 text-center text-sm text-gris">
              Nadie con ese nombre en la Pokédex.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
