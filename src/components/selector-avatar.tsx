"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { cambiarAvatarAccion } from "@/actions/perfil";
import { Avatar, type PersonaConAvatar } from "@/components/avatar";
import { Boton } from "@/components/ui/boton";
import { Entrada } from "@/components/ui/campo";
import { GRUPOS_ENTRENADORES, nombreAvatar, urlEntrenador } from "@/lib/avatares";
import { spritePokemon } from "@/lib/pokemon";
import { cn } from "@/lib/utils";

type PokemonBasico = { id: number; nombre: string };
type Pestana = "entrenador" | "pokemon";

export function SelectorAvatar({
  participantId,
  persona,
}: {
  participantId: string;
  persona: PersonaConAvatar;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pestana, setPestana] = useState<Pestana>("entrenador");
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<PokemonBasico[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [guardando, iniciarGuardado] = useTransition();

  useEffect(() => {
    if (!abierto || pestana !== "pokemon") return;

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
  }, [abierto, pestana, consulta]);

  function elegir(eleccion: Parameters<typeof cambiarAvatarAccion>[0]) {
    iniciarGuardado(async () => {
      await cambiarAvatarAccion(eleccion);
      setAbierto(false);
    });
  }

  const claseOpcion =
    "group flex flex-col items-center gap-1 rounded-2xl border-[3px] border-tinta bg-blanco p-2 " +
    "transition hover:-translate-y-0.5 hover:bg-amarillo-claro disabled:opacity-50";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar persona={persona} tamano="xl" />
        <div>
          <p className="font-display text-xl font-extrabold">
            {nombreAvatar(persona)}
          </p>
          <p className="mb-2 text-sm text-gris">
            Así te ven los demás en este intercambio.
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
              "Cambiar mi sprite"
            )}
          </Boton>
        </div>
      </div>

      {abierto ? (
        <div className="rounded-3xl border-[3px] border-tinta bg-crema p-4">
          <div className="mb-4 flex gap-2">
            {(
              [
                ["entrenador", "Entrenadores"],
                ["pokemon", "Pokémon"],
              ] as const
            ).map(([clave, texto]) => (
              <button
                key={clave}
                type="button"
                onClick={() => setPestana(clave)}
                className={cn(
                  "rounded-full border-[3px] border-tinta px-4 py-1.5 font-display text-sm font-extrabold transition",
                  pestana === clave
                    ? "bg-rojo text-blanco shadow-dura-sm"
                    : "bg-blanco text-tinta hover:bg-crema-2",
                )}
              >
                {texto}
              </button>
            ))}
            {guardando ? (
              <span className="ml-auto flex items-center gap-2 text-sm font-bold text-azul">
                <Loader2 className="size-4 animate-spin" /> Guardando
              </span>
            ) : null}
          </div>

          {pestana === "entrenador" ? (
            <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
              {GRUPOS_ENTRENADORES.map((grupo) => (
                <div key={grupo.grupo}>
                  <h3 className="mb-2 font-display text-sm font-extrabold uppercase tracking-wide text-azul-oscuro">
                    {grupo.grupo}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {grupo.entrenadores.map((entrenador) => (
                      <button
                        key={entrenador.clave}
                        type="button"
                        disabled={guardando}
                        onClick={() =>
                          elegir({
                            participantId,
                            tipo: "entrenador",
                            clave: entrenador.clave,
                          })
                        }
                        className={claseOpcion}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={urlEntrenador(entrenador.clave)}
                          alt={entrenador.nombre}
                          loading="lazy"
                          className="h-16 w-full object-contain [image-rendering:pixelated]"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-bold">{entrenador.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
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

              {buscando && resultados.length === 0 ? (
                <p className="py-6 text-center text-sm text-gris">Buscando...</p>
              ) : null}

              <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-6">
                {resultados.map((pokemon) => (
                  <button
                    key={pokemon.id}
                    type="button"
                    disabled={guardando}
                    onClick={() =>
                      elegir({
                        participantId,
                        tipo: "pokemon",
                        pokemonId: pokemon.id,
                        nombre: pokemon.nombre,
                      })
                    }
                    className={claseOpcion}
                    title={`#${pokemon.id} ${pokemon.nombre}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={spritePokemon(pokemon.id)}
                      alt={pokemon.nombre}
                      loading="lazy"
                      className="size-14 object-contain [image-rendering:pixelated]"
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
          )}
        </div>
      ) : null}
    </div>
  );
}
