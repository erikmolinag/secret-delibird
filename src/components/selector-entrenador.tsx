"use client";

import { useState } from "react";

import { AvatarEntrenador } from "@/components/avatar";
import { GRUPOS_ENTRENADORES, nombreEntrenador, urlEntrenador } from "@/lib/avatares";
import { cn } from "@/lib/utils";

/**
 * Elige el sprite de entrenador del perfil. No guarda solo: deja la clave en un
 * input escondido y se guarda junto con el nombre, en el mismo formulario.
 */
export function SelectorEntrenador({ inicial }: { inicial: string | null }) {
  const [clave, setClave] = useState<string | null>(inicial);

  return (
    <div className="space-y-4">
      <input type="hidden" name="trainerKey" value={clave ?? ""} />

      <div className="flex items-center gap-4">
        <AvatarEntrenador trainerKey={clave} tamano="xl" />
        <div>
          <p className="font-display text-xl font-extrabold">
            {clave ? nombreEntrenador(clave) : "Sin entrenador"}
          </p>
          <p className="text-sm text-gris">
            {clave
              ? "Así te ven en todos tus intercambios."
              : "Elige uno de abajo para tener foto de perfil."}
          </p>
        </div>
      </div>

      <div className="max-h-[32rem] space-y-4 overflow-y-auto rounded-3xl border-[3px] border-tinta bg-crema p-4 sm:max-h-96">
        {GRUPOS_ENTRENADORES.map((grupo) => (
          <div key={grupo.grupo}>
            <h3 className="mb-2 font-display text-sm font-extrabold uppercase tracking-wide text-azul-oscuro">
              {grupo.grupo}
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {grupo.entrenadores.map((entrenador) => (
                <button
                  key={entrenador.clave}
                  type="button"
                  onClick={() => setClave(entrenador.clave)}
                  aria-pressed={clave === entrenador.clave}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border-[3px] border-tinta p-2 transition hover:-translate-y-0.5",
                    clave === entrenador.clave
                      ? "bg-amarillo shadow-dura-sm"
                      : "bg-blanco hover:bg-amarillo-claro",
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
                  <span className="text-xs font-bold">{entrenador.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
