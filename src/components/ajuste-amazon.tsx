"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useActionState, useState } from "react";

import { guardarCodigoAmazonAccion, type EstadoAjuste } from "@/actions/admin";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { Campo, Entrada } from "@/components/ui/campo";

const INICIAL: EstadoAjuste = {};

/**
 * El código de afiliado de Amazon. Es un campo chiquito donde una errata cuesta
 * dinero sin avisar, así que va con validación y con un "guardado" visible, en
 * vez de un formulario que se manda y no dice nada.
 */
export function AjusteAmazon({ codigo }: { codigo: string | null }) {
  const [estado, accion] = useActionState(guardarCodigoAmazonAccion, INICIAL);

  return (
    <form action={accion} className="space-y-3">
      <Campo
        etiqueta="Código de afiliado"
        htmlFor="codigo"
        pista="Déjalo vacío para apagarlo: los enlaces vuelven a salir como los pegó cada quien."
      >
        {/*
          La `key` cambia con cada guardado bueno, y eso vuelve a montar el
          campo con lo que quedó guardado. Si el guardado falla no cambia, y
          entonces se conserva lo que la persona alcanzó a escribir.
        */}
        <CampoCodigo key={`codigo-${estado.guardados ?? 0}`} inicial={codigo ?? ""} />
      </Campo>

      <div className="flex flex-wrap items-center gap-3">
        <BotonEnvio tamano="sm" cargando="Guardando...">
          Guardar código
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
 * El campo lo maneja React y no el navegador: al terminar una server action
 * React devuelve a su valor original los campos que no controla, y un código
 * rechazado por una errata se borraría justo cuando hay que corregirlo.
 */
function CampoCodigo({ inicial }: { inicial: string }) {
  const [valor, setValor] = useState(inicial);

  return (
    <Entrada
      id="codigo"
      name="codigo"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      placeholder="midominio-20"
      autoComplete="off"
      spellCheck={false}
    />
  );
}
