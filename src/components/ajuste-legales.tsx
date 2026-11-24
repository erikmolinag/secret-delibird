"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useActionState, useState } from "react";

import { guardarLegalesAccion, type EstadoAjuste } from "@/actions/admin";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { AreaTexto, Campo } from "@/components/ui/campo";

const INICIAL: EstadoAjuste = {};

const PISTA =
  "Una línea con ## adelante es un título, una con - adelante es una viñeta, " +
  "y una línea en blanco separa párrafos. No se interpreta HTML.";

/**
 * El aviso de privacidad y los términos, editables sin tocar código ni
 * desplegar. Vacío devuelve el texto de arranque, así que no hay forma de
 * dejar las páginas en blanco por accidente.
 */
export function AjusteLegales({
  privacidad,
  terminos,
  propios,
}: {
  privacidad: string;
  terminos: string;
  propios: { privacidad: boolean; terminos: boolean };
}) {
  const [estado, accion] = useActionState(guardarLegalesAccion, INICIAL);

  return (
    <form action={accion} className="space-y-4">
      <Campos
        key={`legales-${estado.guardados ?? 0}`}
        privacidad={privacidad}
        terminos={terminos}
      />

      <p className="text-sm text-gris">
        {propios.privacidad && propios.terminos
          ? "Los dos son tuyos."
          : "Lo que no hayas editado se queda con el texto de arranque, y al guardarlo pasa a ser tuyo."}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <BotonEnvio tamano="sm" cargando="Guardando...">
          Guardar textos
        </BotonEnvio>

        {estado.ok ? (
          <span className="flex items-center gap-1 text-sm font-bold text-verde-oscuro">
            <Check className="size-4" />
            Guardado
          </span>
        ) : null}
      </div>

      {estado.error ? (
        <p className="flex items-center gap-2 rounded-2xl border-[3px] border-tinta bg-rojo-claro px-4 py-2.5 text-sm font-semibold text-rojo-oscuro">
          <TriangleAlert className="size-4 shrink-0" />
          {estado.error}
        </p>
      ) : null}
    </form>
  );
}

/**
 * Controlados y con `key`, como los demás ajustes: React vacía los campos que
 * no controla al terminar una server action, y aquí eso serían varias páginas
 * de texto perdidas por un error de validación.
 */
function Campos({
  privacidad,
  terminos,
}: {
  privacidad: string;
  terminos: string;
}) {
  const [uno, setUno] = useState(privacidad);
  const [dos, setDos] = useState(terminos);

  return (
    <div className="space-y-4">
      <Campo etiqueta="Aviso de privacidad" htmlFor="privacidad" pista={PISTA}>
        <AreaTexto
          id="privacidad"
          name="privacidad"
          value={uno}
          onChange={(e) => setUno(e.target.value)}
          rows={14}
          spellCheck={false}
        />
      </Campo>

      <Campo etiqueta="Términos de uso" htmlFor="terminos" pista={PISTA}>
        <AreaTexto
          id="terminos"
          name="terminos"
          value={dos}
          onChange={(e) => setDos(e.target.value)}
          rows={14}
          spellCheck={false}
        />
      </Campo>
    </div>
  );
}
