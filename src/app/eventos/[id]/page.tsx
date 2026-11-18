import {
  CalendarDays,
  Coins,
  Eye,
  Gift,
  ListChecks,
  MapPin,
  Send,
  Settings2,
  Shuffle,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  actualizarEventoAccion,
  agregarInvitadosAccion,
  alternarJuegaAccion,
  eliminarInvitadoAccion,
  enviarInvitacionesAccion,
} from "@/actions/eventos";
import {
  deshacerSorteoAccion,
  revelarAccion,
  sortearAccion,
} from "@/actions/sorteo";
import { Avatar } from "@/components/avatar";
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
import {
  asignacionesDelEvento,
  cuantosYaCompraron,
  eventoDelOrganizador,
  invitadosDelEvento,
  reglasDelEvento,
} from "@/lib/datos";
import { enlaceMapa } from "@/lib/enlaces";
import { analizar, type ReglaSorteo } from "@/lib/sorteo";
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ revelar?: string }>;
}) {
  const { id } = await params;
  const { revelar } = await searchParams;
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

  const jugadores = invitados.filter((p) => p.isPlaying);
  const reglas = await reglasDelEvento(id);
  const analisis = analizar(
    jugadores.map((j) => ({ id: j.id, nombre: j.name })),
    reglas.map(
      (r): ReglaSorteo => ({
        tipo: r.type,
        from: r.fromParticipantId,
        to: r.toParticipantId,
        bidireccional: r.bidirectional,
      }),
    ),
  );

  const mapa = enlaceMapa(evento.place, evento.placeUrl);
  const yaSorteado = evento.status === "drawn";
  const parejas = yaSorteado && revelar ? await asignacionesDelEvento(id) : [];
  const yaCompraron = yaSorteado ? await cuantosYaCompraron(id) : 0;

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">{evento.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gris">
              {evento.eventDate ? (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-azul" />
                  {formatearFecha(evento.eventDate)}
                </span>
              ) : null}
              {evento.place ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-azul" />
                  {mapa ? (
                    <a
                      href={mapa}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-azul underline-offset-2 hover:underline"
                    >
                      {evento.place}
                    </a>
                  ) : (
                    evento.place
                  )}
                </span>
              ) : null}
              {presupuesto ? (
                <span className="flex items-center gap-1.5">
                  <Coins className="size-4 text-azul" />
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
            yaSorteado
              ? { etiqueta: "Ya compraron su regalo", valor: yaCompraron }
              : { etiqueta: "Sin invitación enviada", valor: porInvitar },
          ].map((dato) => (
            <div
              key={dato.etiqueta}
              className="rounded-2xl border-[3px] border-tinta bg-blanco px-4 py-3 shadow-dura-sm"
            >
              <p className="font-display text-2xl font-extrabold text-rojo">
                {dato.valor}
              </p>
              <p className="text-xs uppercase tracking-wide text-gris">
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
            <span className="text-sm text-gris">Todos tienen su invitación</span>
          )}
        </TarjetaEncabezado>

        <ul className="divide-y-[3px] divide-tinta/15">
          {invitados.map((invitado) => (
            <li
              key={invitado.id}
              className="flex flex-wrap items-center gap-3 px-5 py-3"
            >
              <Avatar persona={invitado} tamano="sm" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {invitado.name}
                  {invitado.isOrganizer ? (
                    <span className="ml-2 text-xs font-bold text-rojo">
                      organiza
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-gris">{invitado.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {!invitado.isPlaying ? (
                  <Insignia tono="alerta">Fuera del sorteo</Insignia>
                ) : null}
                {invitado.wishlistUpdatedAt ? (
                  <Insignia tono="listo">Lista armada</Insignia>
                ) : null}
                {invitado.joinedAt ? (
                  <Insignia tono="info">Ya entró</Insignia>
                ) : invitado.invitedAt ? (
                  <Insignia tono="espera">Invitado</Insignia>
                ) : (
                  <Insignia tono="alerta">Sin invitar</Insignia>
                )}
              </div>

              <div className="flex items-center gap-1">
                {evento.status === "draft" ? (
                  <form action={alternarJuegaAccion}>
                    <input type="hidden" name="eventId" value={evento.id} />
                    <input type="hidden" name="participantId" value={invitado.id} />
                    <Boton
                      type="submit"
                      variante="fantasma"
                      tamano="sm"
                      title={
                        invitado.isPlaying
                          ? `Sacar a ${invitado.name} del sorteo`
                          : `Meter a ${invitado.name} al sorteo`
                      }
                    >
                      {invitado.isPlaying ? (
                        <UserMinus className="size-3.5" />
                      ) : (
                        <UserCheck className="size-3.5" />
                      )}
                    </Boton>
                  </form>
                ) : null}
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

        <TarjetaCuerpo className="border-t-[3px] border-tinta">
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

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Reglas y sorteo</TituloSeccion>
          <Insignia tono={yaSorteado ? "listo" : analisis.ok ? "info" : "alerta"}>
            {yaSorteado
              ? `Sorteado ${formatearFecha(evento.drawnAt, false) ?? ""}`
              : analisis.ok
                ? "Listo para sortear"
                : "Reglas imposibles"}
          </Insignia>
        </TarjetaEncabezado>

        <TarjetaCuerpo className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl border-[3px] border-tinta bg-rojo text-blanco shadow-dura-sm">
              <Gift className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {reglas.length === 0
                  ? "Sin reglas: a cualquiera le puede tocar cualquiera."
                  : `${reglas.length} regla${reglas.length === 1 ? "" : "s"} configurada${reglas.length === 1 ? "" : "s"}.`}{" "}
                {jugadores.length} personas jugando.
              </p>
              {!analisis.ok ? (
                <p className="mt-1 text-sm font-bold text-rojo-oscuro">
                  {analisis.problemas[0]?.motivo}
                </p>
              ) : null}
            </div>
            <BotonLink
              href={`/eventos/${evento.id}/reglas`}
              variante="fantasma"
              tamano="sm"
            >
              <Shuffle className="size-4" />
              {yaSorteado ? "Ver reglas" : "Configurar reglas"}
            </BotonLink>
          </div>

          {!yaSorteado && analisis.ok ? (
            <form action={sortearAccion}>
              <input type="hidden" name="eventId" value={evento.id} />
              <BotonEnvio className="w-full" tamano="lg" cargando="Repartiendo...">
                Sortear y avisar a todos
              </BotonEnvio>
            </form>
          ) : null}

          {yaSorteado ? (
            <div className="flex flex-wrap gap-2">
              {!revelar ? (
                <form action={revelarAccion}>
                  <input type="hidden" name="eventId" value={evento.id} />
                  <BotonEnvio variante="fantasma" tamano="sm" cargando="Abriendo...">
                    <Eye className="size-4" />
                    Revelar quién le regala a quién
                  </BotonEnvio>
                </form>
              ) : null}

              <form action={deshacerSorteoAccion}>
                <input type="hidden" name="eventId" value={evento.id} />
                <BotonEnvio variante="peligro" tamano="sm" cargando="Deshaciendo...">
                  Deshacer y volver a sortear
                </BotonEnvio>
              </form>

              <p className="w-full text-xs font-semibold text-gris">
                Deshacer se puede aunque ya hayas avisado: el correo no dice
                quién te tocó, solo lleva aquí. Quien ya haya entrado, eso sí, ya
                vio un nombre.
              </p>
            </div>
          ) : null}

          {parejas.length ? (
            <div className="space-y-2">
              <p className="rounded-2xl border-2 border-tinta bg-amarillo-claro px-3 py-2 text-sm font-bold">
                Quedó anotado que abriste esto. Ya no hay vuelta atrás con la
                sorpresa.
              </p>
              <ul className="divide-y-2 divide-tinta/15 rounded-2xl border-2 border-tinta bg-crema">
                {parejas.map((pareja) => (
                  <li
                    key={`${pareja.quienDa}-${pareja.quienRecibe}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold"
                  >
                    <span className="font-bold">{pareja.quienDa}</span>
                    <span className="text-gris">le regala a</span>
                    <span className="font-bold">{pareja.quienRecibe}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </TarjetaCuerpo>
      </Tarjeta>

      <details className="group rounded-3xl border-[3px] border-tinta bg-blanco shadow-dura">
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 font-display font-bold">
          <Settings2 className="size-5 text-azul" />
          Ajustes del evento
        </summary>

        <div className="border-t-[3px] border-tinta px-5 py-5">
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

            <Campo
              etiqueta="Liga del mapa"
              htmlFor="editar-mapa"
              pista="Si la dejas vacía, el correo lleva a una búsqueda del lugar en Google Maps."
            >
              <Entrada
                id="editar-mapa"
                name="placeUrl"
                type="url"
                defaultValue={evento.placeUrl ?? ""}
                maxLength={500}
                placeholder="https://maps.app.goo.gl/..."
              />
            </Campo>

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

            <fieldset className="space-y-3 rounded-2xl border-[3px] border-tinta bg-crema p-4">
              <legend className="px-1 text-sm font-bold text-azul">
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
