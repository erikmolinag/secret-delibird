"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useActionState, useState } from "react";

import { guardarCorreoAccion, type EstadoAjuste } from "@/actions/admin";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { Campo, Entrada } from "@/components/ui/campo";
import {
  NOMBRE_PROVEEDOR,
  PROVEEDORES,
  type AjustesCorreo,
  type Proveedor,
} from "@/lib/proveedores";
import { cn } from "@/lib/utils";

const INICIAL: EstadoAjuste = {};

/**
 * Con cuál proveedor se intenta primero y desde qué dirección manda cada uno.
 *
 * Las dos cosas van juntas en un solo formulario porque van juntas en la
 * realidad: cada proveedor solo puede mandar desde el dominio que tiene
 * verificado, así que cambiar de proveedor sin cambiar el remitente es
 * exactamente el error que tumbó el correo la primera vez.
 */
export function AjusteCorreo({
  ajustes,
  llaves,
}: {
  ajustes: AjustesCorreo;
  llaves: Record<Proveedor, boolean>;
}) {
  const [estado, accion] = useActionState(guardarCorreoAccion, INICIAL);

  return (
    <form action={accion} className="space-y-4">
      <Campos key={`correo-${estado.guardados ?? 0}`} ajustes={ajustes} llaves={llaves} />

      <div className="flex flex-wrap items-center gap-3">
        <BotonEnvio tamano="sm" cargando="Guardando...">
          Guardar
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
 * Los campos los maneja React y no el navegador: al terminar una server action
 * React devuelve a su valor original los que no controla, y una dirección
 * rechazada por una errata se borraría justo cuando hay que corregirla. La
 * `key` de arriba los vuelve a montar con lo guardado cuando sí se guardó.
 */
function Campos({
  ajustes,
  llaves,
}: {
  ajustes: AjustesCorreo;
  llaves: Record<Proveedor, boolean>;
}) {
  const [primero, setPrimero] = useState<Proveedor>(ajustes.primero);
  const [fromPlunk, setFromPlunk] = useState(ajustes.fromPlunk ?? "");
  const [fromResend, setFromResend] = useState(ajustes.fromResend ?? "");

  const remitentes: Record<Proveedor, [string, (v: string) => void]> = {
    plunk: [fromPlunk, setFromPlunk],
    resend: [fromResend, setFromResend],
  };

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="font-display text-sm font-extrabold">
          Con cuál se intenta primero
        </legend>
        <p className="text-sm font-semibold text-gris">
          El otro queda de respaldo: entra solo si el primero no contesta o
          rechaza el envío.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {PROVEEDORES.map((nombre) => (
            <label
              key={nombre}
              className={cn(
                "cursor-pointer rounded-full border-[3px] border-tinta px-4 py-1.5 font-display text-sm font-extrabold transition",
                primero === nombre
                  ? "bg-azul text-blanco shadow-dura-sm"
                  : "bg-blanco hover:bg-crema-2",
              )}
            >
              <input
                type="radio"
                name="primero"
                value={nombre}
                checked={primero === nombre}
                onChange={() => setPrimero(nombre)}
                className="sr-only"
              />
              {NOMBRE_PROVEEDOR[nombre]}
              {llaves[nombre] ? "" : " (sin llave)"}
            </label>
          ))}
        </div>

        {!llaves[primero] ? (
          <p className="text-sm font-semibold text-rojo-oscuro">
            No hay llave de {NOMBRE_PROVEEDOR[primero]} en Vercel, así que se va
            a saltar y el correo va a salir por el otro.
          </p>
        ) : null}
      </fieldset>

      {PROVEEDORES.map((nombre) => {
        const [valor, poner] = remitentes[nombre];
        return (
          <Campo
            key={nombre}
            etiqueta={`Remitente de ${NOMBRE_PROVEEDOR[nombre]}`}
            htmlFor={`from-${nombre}`}
            pista="Tiene que ser de un dominio verificado en ese proveedor, o rechaza el envío."
          >
            <Entrada
              id={`from-${nombre}`}
              name={nombre === "plunk" ? "fromPlunk" : "fromResend"}
              value={valor}
              onChange={(e) => poner(e.target.value)}
              placeholder="Secret Delibird <delibird@tudominio.com>"
              autoComplete="off"
              spellCheck={false}
            />
          </Campo>
        );
      })}
    </div>
  );
}
