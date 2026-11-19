"use client";

import { Check, Search, TriangleAlert } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { cambiarEntrenadorAccion } from "@/actions/perfil";
import { AvatarEntrenador } from "@/components/avatar";
import { Entrada } from "@/components/ui/campo";
import {
  ENTRENADORES,
  GRUPOS_ENTRENADORES,
  nombreEntrenador,
  urlEntrenador,
  type Entrenador,
} from "@/lib/avatares";
import { cn } from "@/lib/utils";

type Estado = "quieto" | "guardando" | "guardado" | "error";

/** Sin acentos y en minúsculas, para que "pokemon" encuentre "Pokémon". */
function plano(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Elige el sprite de entrenador del perfil. Guarda en cuanto tocas una cara:
 * antes solo lo dejaba en un input escondido y había que bajar hasta el botón,
 * que en el teléfono queda fuera de la pantalla. El input sigue ahí para que el
 * formulario lo mande también cuando guardas nombre y entrenador de un jalón.
 *
 * Son más de 350, así que lleva buscador y atajos a cada grupo.
 */
export function SelectorEntrenador({ inicial }: { inicial: string | null }) {
  const [clave, setClave] = useState<string | null>(inicial);
  const [estado, setEstado] = useState<Estado>("quieto");
  const [consulta, setConsulta] = useState("");
  const [, empezar] = useTransition();

  const busqueda = plano(consulta.trim());
  const encontrados = useMemo<Entrenador[] | null>(() => {
    if (!busqueda) return null;
    return ENTRENADORES.filter(
      (e) => plano(e.nombre).includes(busqueda) || plano(e.grupo).includes(busqueda),
    );
  }, [busqueda]);

  function elegir(nueva: string) {
    setClave(nueva);
    setEstado("guardando");
    empezar(async () => {
      const resultado = await cambiarEntrenadorAccion(nueva);
      setEstado(resultado.ok ? "guardado" : "error");
    });
  }

  // Se busca en el documento y no con un ref: el reemplazo que hace React al
  // terminar el streaming mueve estos nodos, y el ref se queda apuntando al
  // viejo, que ya no esta en la pagina (y entonces no scrollea nada).
  function irAGrupo(nombre: string) {
    document
      .querySelector(`[data-grupo="${CSS.escape(nombre)}"]`)
      ?.scrollIntoView({ block: "start" });
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="trainerKey" value={clave ?? ""} />

      <div className="flex items-center gap-4">
        <AvatarEntrenador trainerKey={clave} tamano="xl" />
        <div>
          <p className="font-display text-xl font-extrabold">
            {clave ? nombreEntrenador(clave) : "Sin entrenador"}
          </p>

          {estado === "quieto" ? (
            <p className="text-sm text-gris">
              {clave
                ? "Así te ven en todos tus intercambios."
                : "Elige uno de abajo para tener foto de perfil."}
            </p>
          ) : null}

          {estado === "guardando" ? (
            <p className="text-sm font-bold text-gris">Guardando...</p>
          ) : null}

          {estado === "guardado" ? (
            <p className="flex items-center gap-1 text-sm font-bold text-verde-oscuro">
              <Check className="size-4" />
              Guardado
            </p>
          ) : null}

          {estado === "error" ? (
            <p className="flex items-center gap-1 text-sm font-bold text-rojo">
              <TriangleAlert className="size-4" />
              No se pudo guardar. Intenta otra vez.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-3xl border-[3px] border-tinta bg-crema p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gris" />
          <Entrada
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Busca por nombre o grupo: Cynthia, villanos..."
            className="pl-10"
          />
        </div>

        {encontrados ? null : (
          // En el telefono los 25 grupos ocupaban media pantalla apilados: van
          // en un solo renglon que se arrastra de lado, y ya en pantalla ancha
          // se acomodan en varias lineas.
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            {GRUPOS_ENTRENADORES.map((g) => (
              <button
                key={g.grupo}
                type="button"
                onClick={() => irAGrupo(g.grupo)}
                className="shrink-0 whitespace-nowrap rounded-full border-2 border-tinta bg-blanco px-2.5 py-1 text-xs font-extrabold transition hover:bg-amarillo-claro"
              >
                {g.grupo}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1 sm:max-h-[28rem]">
          {encontrados ? (
            encontrados.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {encontrados.map((entrenador) => (
                  <Ficha
                    key={entrenador.clave}
                    entrenador={entrenador}
                    elegido={clave === entrenador.clave}
                    alElegir={elegir}
                  />
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm font-bold text-gris">
                Nadie se llama así por aquí.
              </p>
            )
          ) : (
            GRUPOS_ENTRENADORES.map((g) => (
              <div key={g.grupo} data-grupo={g.grupo}>
                <h3 className="sticky top-0 z-10 -mx-1 mb-2 bg-crema px-1 py-1 font-display text-sm font-extrabold uppercase tracking-wide text-azul-oscuro">
                  {g.grupo}
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {g.entrenadores.map((entrenador) => (
                    <Ficha
                      key={entrenador.clave}
                      entrenador={entrenador}
                      elegido={clave === entrenador.clave}
                      alElegir={elegir}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Ficha({
  entrenador,
  elegido,
  alElegir,
}: {
  entrenador: Entrenador;
  elegido: boolean;
  alElegir: (clave: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => alElegir(entrenador.clave)}
      aria-pressed={elegido}
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border-[3px] border-tinta p-2 transition hover:-translate-y-0.5",
        elegido ? "bg-amarillo shadow-dura-sm" : "bg-blanco hover:bg-amarillo-claro",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urlEntrenador(entrenador.clave)}
        alt={entrenador.nombre}
        loading="lazy"
        className="h-28 w-full object-contain [image-rendering:pixelated] sm:h-24"
        referrerPolicy="no-referrer"
      />
      <span className="w-full truncate text-center text-xs font-bold">
        {entrenador.nombre}
      </span>
    </button>
  );
}
