"use client";

import { TriangleAlert } from "lucide-react";
import { useActionState } from "react";

import { borrarCuentaAccion, type EstadoBorrado } from "@/actions/cuenta";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { Campo, Entrada } from "@/components/ui/campo";
import { PALABRA_BORRAR } from "@/lib/cuenta";

const INICIAL: EstadoBorrado = {};

/**
 * Borrar la cuenta. Va cerrado dentro de un `details` y pide escribir una
 * palabra: no es un botón que se pueda picar por accidente buscando "cerrar
 * sesión", que está ahí al lado y se parece bastante.
 *
 * Lo que se va se dice por su nombre y con la lista enfrente, antes de que la
 * persona escriba nada. Una advertencia genérica no sirve: hay que ver de qué
 * intercambios te sales.
 */
export function BorrarCuenta({
  organiza,
  intercambios,
}: {
  organiza: string[];
  intercambios: string[];
}) {
  const [estado, accion] = useActionState(borrarCuentaAccion, INICIAL);

  return (
    <details className="rounded-3xl border-[3px] border-tinta bg-blanco p-5 shadow-dura-sm">
      <summary className="cursor-pointer font-display text-sm font-extrabold text-rojo">
        Borrar mi cuenta
      </summary>

      {organiza.length > 0 ? (
        <div className="mt-4 space-y-2 rounded-2xl border-[3px] border-tinta bg-amarillo-claro px-4 py-3">
          <p className="text-sm font-bold">
            Todavía organizas {organiza.length === 1 ? "un intercambio" : "estos intercambios"}:
          </p>
          <ul className="list-inside list-disc text-sm font-semibold text-gris">
            {organiza.map((nombre) => (
              <li key={nombre}>{nombre}</li>
            ))}
          </ul>
          <p className="text-sm font-semibold text-gris">
            Si borráramos tu cuenta se irían con ella, y con ellos las listas, el
            sorteo y las cartas de toda la gente que invitaste. Bórralos tú desde
            Mis eventos, uno por uno, y regresa aquí.
          </p>
        </div>
      ) : (
        <form action={accion} className="mt-4 space-y-4">
          <div className="space-y-2 rounded-2xl border-[3px] border-tinta bg-rojo-claro px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-extrabold text-rojo-oscuro">
              <TriangleAlert className="size-4 shrink-0" />
              Esto no se puede deshacer
            </p>

            {intercambios.length > 0 ? (
              <>
                <p className="text-sm font-semibold">
                  Te vas a salir de {intercambios.length === 1 ? "este intercambio" : "estos intercambios"}:
                </p>
                <ul className="list-inside list-disc text-sm font-semibold">
                  {intercambios.map((nombre) => (
                    <li key={nombre}>{nombre}</li>
                  ))}
                </ul>
                <p className="text-sm font-semibold">
                  Se van tu lista de deseos, lo que tengas apartado y tus cartas.
                  Si alguno ya se sorteó, quien te haya tocado se queda sin nadie
                  a quien regalarle y quien organiza va a tener que arreglarlo.
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold">
                No estás en ningún intercambio: se borra tu cuenta y ya.
              </p>
            )}
          </div>

          <Campo
            etiqueta={`Escribe ${PALABRA_BORRAR} para confirmar`}
            htmlFor="confirmacion"
          >
            <Entrada
              id="confirmacion"
              name="confirmacion"
              placeholder={PALABRA_BORRAR}
              autoComplete="off"
              spellCheck={false}
              required
            />
          </Campo>

          {estado.error ? (
            <p className="rounded-2xl border-[3px] border-tinta bg-rojo-claro px-4 py-2.5 text-sm font-semibold text-rojo-oscuro">
              {estado.error}
            </p>
          ) : null}

          <BotonEnvio variante="peligro" tamano="sm" cargando="Borrando...">
            Borrar mi cuenta para siempre
          </BotonEnvio>
        </form>
      )}
    </details>
  );
}
