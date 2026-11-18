import {
  CalendarDays,
  Coins,
  Gift,
  ListChecks,
  MapPin,
  Send,
  Settings2,
  Trash2,
  UserPlus,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  actualizarEventoAccion,
  agregarInvitadosAccion,
  eliminarInvitadoAccion,
  enviarInvitacionesAccion,
} from "@/actions/eventos";
import { AvatarPokemon } from "@/components/avatar-pokemon";
import { Boton, BotonLink } from "@/components/ui/boton";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { AreaTexto, Campo, Entrada, claseInput } from "@/components/ui/campo";
import { Insignia } from "@/components/ui/insignia";
import {
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  TituloSeccion,
} from "@/components/ui/tarjeta";
import { requerirUsuario } from "@/lib/auth";
import { eventoDelOrganizador, invitadosDelEvento } from "@/lib/datos";
import {
  aValorInputFecha,
  formatearFecha,
  formatearPresupuesto,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Panel del evento" };

/** Depende de la sesión: se renderiza por peticion. */
export const instant = false;

export default async function PanelEvento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requerirUsuario();

  const evento = await eventoDelOrganizador(id, usuario.id);
  if (!evento) notFound();

  const invitados = await invitadosDelEvento(id);
  const yo = invitados.find((p) => p.isOrganizer);
  const porInvitar = invitados.filter(
    (p) => !p.invitedAt && p.email !== usuario.email,
  ).length;
  const conLista = invitados.filter((p) => p.wishlistUpdatedAt).length;
  const presupuesto = formatearPresupuesto(
    evento.budgetAmount,
    evento.budgetCurrency,
  );

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">{evento.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-humo">
              {evento.eventDate ? (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-hielo" />
                  {formatearFecha(evento.eventDate)}
                </span>
              ) : null}
              {evento.place ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-hielo" />
                  {evento.place}
                </span>
              ) : null}
              {presupuesto ? (
                <span className="flex items-center gap-1.5">
                  <Coins className="size-4 text-hielo" />
                  {presupuesto}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Insignia tono={evento.status === "drawn" ? "listo" : "espera"}>
              {evento.status === "drawn" ? "Ya se sorteó" : "Sin sortear"}
            </Insignia>
            {yo ? (
              <BotonLink href={`/e/${yo.id}`} variante="fantasma" tamano="sm">
                <ListChecks className="size-4" />
                Mi lista
              </BotonLink>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { etiqueta: "Invitados", valor: invitados.length },
            { etiqueta: "Con lista armada", valor: conLista },
            { etiqueta: "Sin invitación enviada", valor: porInvitar },
          ].map((dato) => (
            <div
              key={dato.etiqueta}
              className="rounded-2xl border border-noche-borde/70 bg-noche-suave/60 px-4 py-3"
            >
              <p className="font-display text-2xl font-extrabold text-dorado">
                {dato.valor}
              </p>
              <p className="text-xs uppercase tracking-wide text-humo">
                {dato.etiqueta}
              </p>
            </div>
          ))}
        </div>
      </header>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Invitados</TituloSeccion>
          {porInvitar > 0 ? (
            <form action={enviarInvitacionesAccion}>
              <input type="hidden" name="eventId" value={evento.id} />
              <BotonEnvio tamano="sm" cargando="Enviando...">
                <Send className="size-4" />
                Enviar {porInvitar}{" "}
                {porInvitar === 1 ? "invitación" : "invitaciones"}
              </BotonEnvio>
            </form>
          ) : (
            <span className="text-sm text-humo">Todos tienen su invitación</span>
          )}
        </TarjetaEncabezado>

        <ul className="divide-y divide-noche-borde/60">
          {invitados.map((invitado) => (
            <li
              key={invitado.id}
              className="flex flex-wrap items-center gap-3 px-5 py-3"
            >
              <AvatarPokemon pokemonId={invitado.pokemonId} tamano="sm" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {invitado.name}
                  {invitado.isOrganizer ? (
                    <span className="ml-2 text-xs font-bold text-dorado">
                      organiza
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-humo">{invitado.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {!invitado.isPlaying ? (
                  <Insignia tono="alerta">Fuera del sorteo</Insignia>
                ) : null}
                {invitado.wishlistUpdatedAt ? (
                  <Insignia tono="listo">Lista lista</Insignia>
                ) : null}
                {invitado.joinedAt ? (
                  <Insignia tono="info">Ya entró</Insignia>
                ) : invitado.invitedAt ? (
                  <Insignia tono="espera">Invitado</Insignia>
                ) : (
                  <Insignia tono="alerta">Sin invitar</Insignia>
                )}
              </div>

              {!invitado.isOrganizer ? (
                <div className="flex items-center gap-1">
                  <form action={enviarInvitacionesAccion}>
                    <input type="hidden" name="eventId" value={evento.id} />
                    <input type="hidden" name="participantId" value={invitado.id} />
                    <Boton
                      type="submit"
                      variante="fantasma"
                      tamano="sm"
                      title="Reenviar invitación"
                    >
                      <Send className="size-3.5" />
                    </Boton>
                  </form>

                  {evento.status === "draft" ? (
                    <form action={eliminarInvitadoAccion}>
                      <input type="hidden" name="eventId" value={evento.id} />
                      <input
                        type="hidden"
                        name="participantId"
                        value={invitado.id}
                      />
                      <Boton
                        type="submit"
                        variante="peligro"
                        tamano="sm"
                        title={`Quitar a ${invitado.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Boton>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <TarjetaCuerpo className="border-t border-noche-borde/60">
          <form action={agregarInvitadosAccion} className="space-y-3">
            <input type="hidden" name="eventId" value={evento.id} />
            <Campo
              etiqueta="Agregar invitados"
              htmlFor="invitados"
              pista="Uno por línea. Acepta solo el correo o 'Nombre <correo@dominio.com>'."
            >
              <AreaTexto
                id="invitados"
                name="invitados"
                required
                placeholder={"ana@correo.com\nLuis Pérez <luis@correo.com>"}
              />
            </Campo>
            <BotonEnvio variante="secundario" cargando="Agregando...">
              <UserPlus className="size-4" />
              Agregar a la lista
            </BotonEnvio>
          </form>
        </TarjetaCuerpo>
      </Tarjeta>

      <Tarjeta className="border-dashed">
        <TarjetaCuerpo className="flex flex-wrap items-center gap-4">
          <Gift className="size-8 text-dorado" />
          <div className="min-w-0 flex-1">
            <TituloSeccion>Reglas y sorteo</TituloSeccion>
            <p className="text-sm text-humo">
              Exclusiones, listas blancas, asignaciones fijas y el sorteo en si
              son la siguiente fase. La base de datos ya los guarda.
            </p>
          </div>
          <Insignia tono="espera">Fase 2</Insignia>
        </TarjetaCuerpo>
      </Tarjeta>

      <details className="group rounded-3xl border border-noche-borde/80 bg-noche-suave/60">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 font-display font-bold">
          <Settings2 className="size-5 text-hielo" />
          Ajustes del evento
        </summary>

        <div className="border-t border-noche-borde/60 px-5 py-5">
          <form action={actualizarEventoAccion} className="space-y-5">
            <input type="hidden" name="eventId" value={evento.id} />

            <Campo etiqueta="Nombre del evento" htmlFor="editar-name">
              <Entrada
                id="editar-name"
                name="name"
                defaultValue={evento.name}
                maxLength={120}
                required
              />
            </Campo>

            <div className="grid gap-5 sm:grid-cols-2">
              <Campo etiqueta="Fecha y hora" htmlFor="editar-fecha">
                <Entrada
                  id="editar-fecha"
                  name="eventDate"
                  type="datetime-local"
                  defaultValue={aValorInputFecha(evento.eventDate)}
                />
              </Campo>
              <Campo etiqueta="Lugar" htmlFor="editar-lugar">
                <Entrada
                  id="editar-lugar"
                  name="place"
                  defaultValue={evento.place ?? ""}
                  maxLength={160}
                />
              </Campo>
            </div>

            <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
              <Campo etiqueta="Presupuesto sugerido" htmlFor="editar-monto">
                <Entrada
                  id="editar-monto"
                  name="budgetAmount"
                  inputMode="numeric"
                  defaultValue={evento.budgetAmount ?? ""}
                />
              </Campo>
              <Campo etiqueta="Moneda" htmlFor="editar-moneda">
                <select
                  id="editar-moneda"
                  name="budgetCurrency"
                  defaultValue={evento.budgetCurrency}
                  className={claseInput}
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Campo>
            </div>

            <Campo etiqueta="Mensaje para los invitados" htmlFor="editar-mensaje">
              <AreaTexto
                id="editar-mensaje"
                name="message"
                defaultValue={evento.message ?? ""}
                maxLength={500}
              />
            </Campo>

            <fieldset className="space-y-3 rounded-2xl border border-noche-borde/70 p-4">
              <legend className="px-1 text-sm font-bold text-hielo">
                Cómo quieres jugar
              </legend>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="organizerPlays"
                  defaultChecked={evento.organizerPlays}
                  className="mt-0.5 size-4 accent-[var(--color-rojo)]"
                />
                <span>Yo también juego</span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name="avoidMutual"
                  defaultChecked={evento.avoidMutual}
                  className="mt-0.5 size-4 accent-[var(--color-rojo)]"
                />
                <span>Evitar parejas mutuas</span>
              </label>
            </fieldset>

            <BotonEnvio variante="secundario" cargando="Guardando...">
              Guardar cambios
            </BotonEnvio>
          </form>
        </div>
      </details>
    </div>
  );
}
