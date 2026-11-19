import type { Metadata } from "next";

import { crearEventoAccion } from "@/actions/eventos";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { AreaTexto, Campo, Entrada, claseInput } from "@/components/ui/campo";
import { Tarjeta, TarjetaCuerpo } from "@/components/ui/tarjeta";
import { requerirUsuario } from "@/lib/auth";

export const metadata: Metadata = { title: "Nuevo evento" };

/** Depende de la sesión: se renderiza por peticion. */
export const instant = false;

export default async function NuevoEvento() {
  await requerirUsuario();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Nuevo intercambio</h1>
        <p className="text-sm text-gris">
          Lo único obligatorio es el nombre. Todo lo demás lo puedes cambiar
          después.
        </p>
      </div>

      <Tarjeta>
        <TarjetaCuerpo>
          <form action={crearEventoAccion} className="space-y-5">
            <Campo etiqueta="Nombre del evento" htmlFor="name">
              <Entrada
                id="name"
                name="name"
                required
                maxLength={120}
                autoFocus
                placeholder="Posada de la familia Molina"
              />
            </Campo>

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo etiqueta="Fecha y hora" htmlFor="eventDate" pista="Opcional.">
                <Entrada id="eventDate" name="eventDate" type="datetime-local" />
              </Campo>

              <Campo etiqueta="Lugar" htmlFor="place" pista="Opcional.">
                <Entrada
                  id="place"
                  name="place"
                  maxLength={160}
                  placeholder="Casa de la abuela"
                />
              </Campo>
            </div>

            <Campo
              etiqueta="Liga del mapa"
              htmlFor="placeUrl"
              pista="Opcional. Si la dejas vacía, el correo lleva a una búsqueda del lugar en Google Maps."
            >
              <Entrada
                id="placeUrl"
                name="placeUrl"
                type="url"
                maxLength={500}
                placeholder="https://maps.app.goo.gl/..."
              />
            </Campo>

            <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
              <Campo
                etiqueta="Presupuesto sugerido"
                htmlFor="budgetAmount"
                pista="Se lo decimos a todos en la invitación."
              >
                <Entrada
                  id="budgetAmount"
                  name="budgetAmount"
                  inputMode="numeric"
                  placeholder="500"
                />
              </Campo>

              <Campo etiqueta="Moneda" htmlFor="budgetCurrency">
                <select
                  id="budgetCurrency"
                  name="budgetCurrency"
                  defaultValue="MXN"
                  className={claseInput}
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Campo>
            </div>

            <Campo
              etiqueta="Mensaje para los invitados"
              htmlFor="message"
              pista="Aparece en el correo de invitación."
            >
              <AreaTexto
                id="message"
                name="message"
                maxLength={500}
                placeholder="Traigan algo para compartir. El intercambio es después de la cena."
              />
            </Campo>

            <fieldset className="space-y-3 rounded-2xl border-[3px] border-tinta bg-crema p-4">
              <legend className="px-1 text-sm font-bold text-azul">
                Cómo quieres jugar
              </legend>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="organizerPlays"
                  defaultChecked
                  className="mt-0.5 size-4 accent-[var(--color-rojo)]"
                />
                <span>
                  Yo también juego
                  <span className="block text-xs text-gris">
                    Entras al sorteo como cualquier invitado. Las asignaciones
                    quedan ocultas, incluso para ti.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="avoidMutual"
                  className="mt-0.5 size-4 accent-[var(--color-rojo)]"
                />
                <span>
                  Evitar que parejas se regalen
                  <span className="block text-xs text-gris">
                    Crear reglas para evitar que persona A le dé el regalo a
                    persona B y viceversa.
                  </span>
                </span>
              </label>
            </fieldset>

            <BotonEnvio className="w-full" cargando="Creando...">
              Crear evento
            </BotonEnvio>
          </form>
        </TarjetaCuerpo>
      </Tarjeta>
    </div>
  );
}
