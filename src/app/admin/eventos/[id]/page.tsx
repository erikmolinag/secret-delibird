import { ArrowLeft, CalendarDays, Coins, MapPin, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/avatar";
import { ListaPublica } from "@/components/lista-publica";
import { BotonLink } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import {
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  TituloSeccion,
} from "@/components/ui/tarjeta";
import { requerirAdmin } from "@/lib/auth";
import {
  cuantosYaCompraron,
  invitadosDelEvento,
  listasDelEvento,
  reglasDelEvento,
} from "@/lib/datos";
import { intercambioParaAdmin } from "@/lib/datos-admin";
import {
  formatearFecha,
  formatearFechaCorta,
  formatearPresupuesto,
  nombreVisible,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Depende de la sesión: se renderiza por petición. */
export const instant = false;

export default async function IntercambioAdmin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requerirAdmin();

  const fila = await intercambioParaAdmin(id);
  if (!fila) notFound();

  const { evento, organizador } = fila;
  const yaSorteado = evento.status === "drawn";

  // Las listas completas, no nada más el conteo: desde aquí se puede ayudar a
  // alguien que no sabe usar la página, o ver por qué una lista se ve rara.
  const [invitados, reglas, listas, yaCompraron] = await Promise.all([
    invitadosDelEvento(id),
    reglasDelEvento(id),
    listasDelEvento(id),
    yaSorteado ? cuantosYaCompraron(id) : Promise.resolve(0),
  ]);

  const conLista = invitados.filter((p) => p.wishlistUpdatedAt).length;
  const presupuesto = formatearPresupuesto(
    evento.budgetAmount,
    evento.budgetCurrency,
  );

  const datos = [
    { etiqueta: "Invitados", valor: invitados.length },
    { etiqueta: "Con lista armada", valor: conLista },
    { etiqueta: "Reglas del sorteo", valor: reglas.length },
    yaSorteado
      ? { etiqueta: "Ya compraron su regalo", valor: yaCompraron }
      : {
          etiqueta: "Ya entraron",
          valor: invitados.filter((p) => p.joinedAt).length,
        },
  ];

  return (
    <div className="space-y-8">
      <BotonLink href="/admin" variante="fantasma" tamano="sm">
        <ArrowLeft className="size-4" />
        Actividad
      </BotonLink>

      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">{evento.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gris">
              <span className="flex items-center gap-1.5">
                <UserRound className="size-4 text-azul" />
                {organizador.name ?? "Sin nombre"} ({organizador.email})
              </span>
              {evento.eventDate ? (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-azul" />
                  {formatearFecha(evento.eventDate)}
                </span>
              ) : null}
              {evento.place ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-azul" />
                  {evento.place}
                </span>
              ) : null}
              {presupuesto ? (
                <span className="flex items-center gap-1.5">
                  <Coins className="size-4 text-azul" />
                  {presupuesto}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-gris">
              Creado el {formatearFechaCorta(evento.createdAt)}
              {evento.drawnAt
                ? ` · sorteado el ${formatearFechaCorta(evento.drawnAt)}`
                : ""}
            </p>
          </div>

          <Insignia tono={yaSorteado ? "listo" : "espera"}>
            {yaSorteado ? "Ya se sorteó" : "Sin sortear"}
          </Insignia>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {datos.map((dato) => (
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
        </TarjetaEncabezado>

        <ul className="divide-y-[3px] divide-tinta/15">
          {invitados.map((invitado) => {
            const lista = listas.get(invitado.id) ?? [];
            const cuantos = lista.length;

            return (
              <li
                key={invitado.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3"
              >
                <Avatar persona={invitado} tamano="sm" />

                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate font-bold">
                    {nombreVisible(invitado)}
                    {invitado.isOrganizer ? (
                      <span className="ml-2 text-xs font-bold text-rojo">
                        organiza
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-gris">{invitado.email}</p>
                  <p className="text-xs font-semibold text-gris">
                    {cuantos === 0
                      ? "Sin deseos todavía"
                      : `${cuantos} deseo${cuantos === 1 ? "" : "s"} en su lista`}
                  </p>
                </div>

                <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
                  {!invitado.isPlaying ? (
                    <Insignia tono="alerta">Fuera del sorteo</Insignia>
                  ) : null}
                  {invitado.joinedAt ? (
                    <Insignia tono="info">Ya entró</Insignia>
                  ) : invitado.invitedAt ? (
                    <Insignia tono="espera">Invitado</Insignia>
                  ) : (
                    <Insignia tono="alerta">Sin invitar</Insignia>
                  )}
                </div>

                {cuantos ? (
                  <details className="w-full">
                    <summary className="cursor-pointer text-sm font-extrabold text-azul-oscuro">
                      Ver su lista ({cuantos})
                    </summary>
                    <div className="pt-2">
                      <ListaPublica deseos={lista} />
                    </div>
                  </details>
                ) : null}
              </li>
            );
          })}
        </ul>

        {yaSorteado ? (
          <TarjetaCuerpo className="border-t-[3px] border-tinta text-xs font-semibold text-gris">
            Quién le regala a quién no sale aquí, a propósito: para eso está el
            botón de revelar del organizador, que deja registro.
          </TarjetaCuerpo>
        ) : null}
      </Tarjeta>
    </div>
  );
}
