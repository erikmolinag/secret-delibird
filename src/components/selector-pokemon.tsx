"use client";

import { Loader2, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { alternarShinyAccion, cambiarPokemonAccion } from "@/actions/perfil";
import { Boton } from "@/components/ui/boton";
import { Entrada } from "@/components/ui/campo";
import { GENERACIONES, nombrePokemon, spritePokemon } from "@/lib/pokemon";
import { cn } from "@/lib/utils";

type PokemonBasico = { id: number; nombre: string };


/** Fuera del componente: con mil fichas, recrearla en cada render se siente. */
function Ficha({
  pokemon,
  elegido,
  bloqueado,
  alElegir,
}: {
  pokemon: PokemonBasico;
  elegido: boolean;
  bloqueado: boolean;
  alElegir: (pokemon: PokemonBasico) => void;
}) {
  return (
    <button
      type="button"
      disabled={bloqueado}
      onClick={() => alElegir(pokemon)}
      title={`#${pokemon.id} ${pokemon.nombre}`}
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border-[3px] border-tinta p-2 transition hover:-translate-y-0.5 hover:bg-amarillo-claro disabled:opacity-50",
        elegido ? "bg-amarillo" : "bg-blanco",
      )}
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
  );
}

/** Toques seguidos al sprite para sacar el shiny, y cuanto se puede tardar. */
const TOQUES = 5;
const PAUSA_MS = 1200;

export function SelectorPokemon({
  participantId,
  pokemonId,
  nombre,
  shiny,
}: {
  participantId: string;
  pokemonId: number;
  nombre: string | null;
  shiny: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [brillante, setBrillante] = useState(shiny);
  const toques = useRef({ cuenta: 0, ultimo: 0 });
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<PokemonBasico[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [guardando, iniciarGuardado] = useTransition();
  const lista = useRef<HTMLDivElement>(null);

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

  /** Sin búsqueda, la Pokédex completa partida por generación. */
  const porGeneracion = useMemo(() => {
    if (consulta.trim()) return null;
    return GENERACIONES.map((generacion) => ({
      generacion,
      pokemon: resultados.filter(
        (p) => p.id >= generacion.desde && p.id <= generacion.hasta,
      ),
    })).filter((grupo) => grupo.pokemon.length > 0);
  }, [consulta, resultados]);

  function elegir(pokemon: PokemonBasico) {
    // El shiny era de ese Pokemon: el nuevo entra con su color normal.
    setBrillante(false);
    toques.current = { cuenta: 0, ultimo: 0 };

    iniciarGuardado(async () => {
      await cambiarPokemonAccion({
        participantId,
        pokemonId: pokemon.id,
        nombre: pokemon.nombre,
      });
      setAbierto(false);
    });
  }

  /**
   * Huevo de pascua: cinco toques seguidos al sprite y aparece el shiny. Si te
   * tardas mas de un segundo entre toque y toque, la cuenta se reinicia, para
   * que no salga sin querer a base de clics sueltos.
   */
  function tocarSprite() {
    const ahora = Date.now();
    const anterior = toques.current;
    const cuenta = ahora - anterior.ultimo > PAUSA_MS ? 1 : anterior.cuenta + 1;
    toques.current = { cuenta, ultimo: ahora };

    if (cuenta < TOQUES) return;

    toques.current = { cuenta: 0, ultimo: ahora };
    const nuevo = !brillante;
    setBrillante(nuevo);
    iniciarGuardado(async () => {
      await alternarShinyAccion({ participantId, shiny: nuevo });
    });
  }

  function irAGeneracion(numero: number) {
    const destino = lista.current?.querySelector(`[data-generacion="${numero}"]`);
    // Sin "smooth": el salto es de miles de pixeles y el navegador a veces ni lo
    // hace; de golpe siempre llega.
    destino?.scrollIntoView({ block: "start" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="relative inline-grid shrink-0">
          <button
            type="button"
            onClick={tocarSprite}
            aria-label={nombre ?? nombrePokemon(pokemonId)}
            className="grid size-40 place-items-center rounded-full border-[3px] border-tinta bg-crema-2 shadow-dura-sm transition active:translate-y-[3px] active:shadow-none sm:size-32"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={spritePokemon(pokemonId, brillante)}
              alt={nombre ?? nombrePokemon(pokemonId)}
              className="size-[88%] object-contain [image-rendering:pixelated]"
              referrerPolicy="no-referrer"
            />
          </button>

          {brillante ? (
            <Sparkles
              aria-hidden
              className="absolute right-1 top-1 size-7 fill-amarillo text-tinta sm:size-6"
            />
          ) : null}
        </span>

        <div>
          <p className="flex items-center gap-1.5 font-display text-xl font-extrabold">
            {nombre ?? nombrePokemon(pokemonId)}
            {brillante ? (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-tinta bg-amarillo px-2 py-0.5 text-xs font-extrabold text-tinta">
                <Sparkles className="size-3" />
                Shiny
              </span>
            ) : null}
          </p>
          <p className="mb-2 text-sm text-gris">
            Este Pokémon te acompaña en este intercambio, con un poco de
            suerte podría ser shiny. En otros intercambios puedes elegir otro
            Pokémon.
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

          {porGeneracion ? (
            <div className="flex flex-wrap gap-1.5">
              {GENERACIONES.map((generacion) => (
                <button
                  key={generacion.numero}
                  type="button"
                  onClick={() => irAGeneracion(generacion.numero)}
                  className="rounded-full border-2 border-tinta bg-blanco px-2.5 py-1 text-xs font-extrabold transition hover:bg-amarillo-claro"
                >
                  {generacion.region}
                </button>
              ))}
            </div>
          ) : null}

          {guardando ? (
            <p className="flex items-center gap-2 text-sm font-bold text-azul">
              <Loader2 className="size-4 animate-spin" /> Guardando
            </p>
          ) : null}

          <div
            ref={lista}
            className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 sm:max-h-[28rem]"
          >
            {porGeneracion ? (
              porGeneracion.map(({ generacion, pokemon }) => (
                <div key={generacion.numero} data-generacion={generacion.numero}>
                  <h3 className="sticky top-0 z-10 -mx-1 mb-2 bg-crema px-1 py-1 font-display text-sm font-extrabold uppercase tracking-wide text-azul-oscuro">
                    Gen {generacion.numero} · {generacion.region}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {pokemon.map((p) => (
                      <Ficha
                        key={p.id}
                        pokemon={p}
                        elegido={p.id === pokemonId}
                        bloqueado={guardando}
                        alElegir={elegir}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {resultados.map((p) => (
                  <Ficha
                        key={p.id}
                        pokemon={p}
                        elegido={p.id === pokemonId}
                        bloqueado={guardando}
                        alElegir={elegir}
                      />
                ))}
              </div>
            )}

            {!buscando && resultados.length === 0 ? (
              <p className="py-6 text-center text-sm text-gris">
                Nadie con ese nombre en la Pokédex.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
