"use client";

import { Check, Send } from "lucide-react";
import { useActionState, useState } from "react";

import { enviarCartaAccion, type EstadoCarta } from "@/actions/cartas";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { AreaTexto } from "@/components/ui/campo";
import { LARGO_MAXIMO } from "@/lib/cartas";

const INICIAL: EstadoCarta = {};

/**
 * Escribirle a la persona que te tocó. El destinatario no va en el formulario:
 * lo saca el servidor de la asignación, así que no hay nada que cambiar aquí
 * para escribirle a alguien más.
 */
export function FormularioCarta({
  participantId,
  paraQuien,
}: {
  participantId: string;
  paraQuien: string;
}) {
  const [estado, accion] = useActionState(enviarCartaAccion, INICIAL);

  return (
    <form action={accion} className="space-y-3">
      <input type="hidden" name="participantId" value={participantId} />

      {/*
        La `key` cambia con cada carta que sale, y eso vuelve a montar la hoja
        en blanco. Es más limpio que vaciarla a mano: el contador se reinicia
        solo porque su estado se va con el componente viejo.
      */}
      <Hoja key={estado.enviadas ?? 0} />

      {estado.error ? (
        <p className="rounded-2xl border-[3px] border-tinta bg-rojo-claro px-4 py-2.5 text-sm font-semibold text-rojo-oscuro">
          {estado.error}
        </p>
      ) : null}

      {estado.ok ? (
        <p className="flex items-center gap-2 rounded-2xl border-[3px] border-tinta bg-verde-claro px-4 py-2.5 text-sm font-semibold text-verde-oscuro">
          <Check className="size-4 shrink-0" />
          Delibird ya va con tu carta para {paraQuien}.
        </p>
      ) : null}
    </form>
  );
}

/**
 * La hoja la maneja React (`value` + `onChange`) y no el navegador: al terminar
 * una server action, React vacía solo los campos que no controla, y entonces una
 * carta rechazada —por el límite de envíos, por ejemplo— se perdía justo cuando
 * le decimos a la persona que no salió.
 */
function Hoja() {
  const [texto, setTexto] = useState("");
  const restan = LARGO_MAXIMO - texto.length;

  return (
    <>
      <AreaTexto
        name="body"
        required
        maxLength={LARGO_MAXIMO}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Una pista de lo que le vas a regalar, un chiste, un ya casi..."
        className="min-h-28"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gris">
          {restan < 200
            ? `Te quedan ${restan} caracteres.`
            : "No le decimos quién eres. Si la firmas, te delatas tú solito."}
        </p>

        <BotonEnvio tamano="sm" cargando="Volando...">
          <Send className="size-3.5" />
          Mandarle la carta
        </BotonEnvio>
      </div>
    </>
  );
}
