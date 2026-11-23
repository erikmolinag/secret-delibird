import {
  CalendarDays,
  Check,
  Coins,
  ExternalLink,
  Gift,
  ImageOff,
  Mailbox,
  MapPin,
  PenLine,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { alternarCompradoAccion } from "@/actions/regalos";
import { Acebo } from "@/components/adornos";
import { Avatar } from "@/components/avatar";
import { FormularioCarta } from "@/components/formulario-carta";
import { ListaPublica } from "@/components/lista-publica";
import { MarcarCartasLeidas } from "@/components/marcar-cartas-leidas";
import { SelectorPokemon } from "@/components/selector-pokemon";
import { FormularioDeseo } from "@/components/formulario-deseo";
import { ListaDeseos } from "@/components/lista-deseos";
import { Insignia } from "@/components/ui/insignia";
import {
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  TituloSeccion,
} from "@/components/ui/tarjeta";
import { clasesBoton } from "@/components/ui/boton";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { requerirUsuario } from "@/lib/auth";
import { enlaceCalendario, enlaceMapa } from "@/lib/enlaces";
import { nombrePokemon } from "@/lib/pokemon";
import {
  aQuienLeRegala,
  cartasEnviadas,
  cartasRecibidas,
  comprasDe,
  invitadosDelEvento,
  listaDeDeseos,
  listasDelEvento,
  participanteDelUsuario,
} from "@/lib/datos";
import {
  cn,
  formatearFecha,
  formatearFechaCorta,
  formatearPresupuesto,
  nombreVisible,
  precioVisible,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Mi lista de deseos" };

/** Depende de la sesión: se renderiza por petición. */
export const instant = false;

const GANAS: Record<number, { texto: string; tono: "listo" | "info" | "espera" }> = {
  1: { texto: "Me encantaría", tono: "listo" },
  2: { texto: "Me gusta", tono: "info" },
  3: { texto: "Tal vez", tono: "espera" },
};

export default async function MiEvento({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requerirUsuario();

  const fila = await participanteDelUsuario(id, usuario);
  if (!fila) notFound();

  const { participante, evento } = fila;
  const deseos = await listaDeDeseos(participante.id);
  const invitados = await invitadosDelEvento(evento.id);
  const listas = await listasDelEvento(evento.id);

  const asignado = evento.status === "drawn" ? await aQuienLeRegala(participante.id) : null;
  const listaDeTuPersona = asignado
    ? await listaDeDeseos(asignado.receptor.id)
    : [];
  const yaCompre = asignado ? await comprasDe(participante.id) : new Set<string>();

  const sorteado = evento.status === "drawn";
  const recibidas = sorteado ? await cartasRecibidas(participante.id) : [];
  const enviadas = asignado ? await cartasEnviadas(participante.id) : [];
  const sinLeer = recibidas.filter((carta) => !carta.readAt).length;
  // A quien se quedó fuera del sorteo nadie lo sacó, así que prometerle cartas
  // que no van a llegar es de mal gusto. Si alguna le llegó, el buzón aparece.
  const hayBuzon = sorteado && (participante.isPlaying || recibidas.length > 0);
  const presupuesto = formatearPresupuesto(
    evento.budgetAmount,
    evento.budgetCurrency,
  );

  const mapa = enlaceMapa(evento.place, evento.placeUrl);
  const calendario = enlaceCalendario({
    titulo: evento.name,
    inicio: evento.eventDate,
    lugar: evento.place,
    detalles: evento.message,
  });

  const datosEvento = [
    evento.eventDate
      ? {
          icono: CalendarDays,
          texto: formatearFecha(evento.eventDate)!,
          url: calendario,
          titulo: "Agregar al calendario",
        }
      : null,
    evento.place
      ? { icono: MapPin, texto: evento.place, url: mapa, titulo: "Ver cómo llegar" }
      : null,
    presupuesto
      ? { icono: Coins, texto: presupuesto, url: null, titulo: undefined }
      : null,
  ].filter((d) => d !== null);

  return (
    <div className="space-y-6">
      <header className="relative rounded-3xl border-[3px] border-tinta bg-blanco p-5 shadow-dura">
        <Acebo className="absolute -right-3 -top-4 size-14 rotate-12" />

        <p className="font-display text-sm font-extrabold uppercase tracking-wide text-azul-oscuro">
          {evento.name}
        </p>
        <h1 className="text-3xl font-extrabold">Hola, {nombreVisible(participante)}</h1>

        {datosEvento.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {datosEvento.map((dato) =>
              dato.url ? (
                <a
                  key={dato.texto}
                  href={dato.url}
                  target="_blank"
                  rel="noreferrer"
                  title={dato.titulo}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-tinta bg-crema-2 px-3 py-1 text-sm font-bold transition hover:bg-amarillo-claro"
                >
                  <dato.icono className="size-4 text-azul" />
                  {dato.texto}
                </a>
              ) : (
                <span
                  key={dato.texto}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-tinta bg-crema-2 px-3 py-1 text-sm font-bold"
                >
                  <dato.icono className="size-4 text-azul" />
                  {dato.texto}
                </span>
              ),
            )}
          </div>
        ) : null}

        {evento.message ? (
          <p className="mt-4 rounded-2xl border-2 border-tinta bg-amarillo-claro px-4 py-2.5 text-sm font-semibold">
            {evento.message}
          </p>
        ) : null}

        {/*
          Quién más está en el intercambio. Es para chismosear los sprites, así
          que van nombres y caras, sin correos y sin quién le regala a quién.
        */}
        <details className="group mt-4">
          <summary className="inline-flex cursor-pointer items-center gap-2 rounded-full border-[3px] border-tinta bg-blanco px-4 py-2 font-display text-sm font-extrabold shadow-dura-sm transition hover:bg-crema-2">
            <Users className="size-4 text-azul" />
            Ver invitados
            <span className="text-gris">({invitados.length})</span>
          </summary>

          <ul className="mt-3 divide-y-[3px] divide-tinta/15 overflow-hidden rounded-2xl border-[3px] border-tinta bg-blanco">
            {invitados.map((invitado) => {
              const lista = listas.get(invitado.id) ?? [];
              const soyYo = invitado.id === participante.id;

              return (
              <li
                key={invitado.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <Avatar persona={invitado} tamano="md" />

                <div className="min-w-0 flex-1 basis-32">
                  <p className="truncate font-bold">
                    {nombreVisible(invitado)}
                    {invitado.id === participante.id ? (
                      <span className="ml-2 text-xs font-bold text-azul">tú</span>
                    ) : null}
                    {invitado.isOrganizer ? (
                      <span className="ml-2 text-xs font-bold text-rojo">
                        organiza
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-gris">
                    {invitado.avatarNombre ?? nombrePokemon(invitado.pokemonId)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {!invitado.isPlaying ? (
                    <Insignia tono="alerta">Fuera del sorteo</Insignia>
                  ) : null}
                  {/*
                    La insignia sale de lo que hay en la lista y no de
                    wishlistUpdatedAt: si alguien arma su lista y luego borra
                    todo, esa fecha se queda puesta y la insignia prometía una
                    lista que al abrirla no estaba.
                  */}
                  {lista.length ? (
                    <Insignia tono="listo">Lista armada</Insignia>
                  ) : (
                    <Insignia tono="espera">Sin lista</Insignia>
                  )}
                </div>

                {/*
                  La lista de cada quien está a la vista de todos: así nadie
                  tiene que preguntar qué le gusta a quién. Lo que no sale es
                  quién ya compró qué, que eso sí es del sorteo.
                */}
                {lista.length ? (
                  <details className="w-full">
                    <summary className="cursor-pointer text-sm font-extrabold text-azul-oscuro">
                      {soyYo ? "Ver mi lista" : "Ver su lista"} ({lista.length})
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
        </details>
      </header>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Tu Pokémon</TituloSeccion>
        </TarjetaEncabezado>
        <TarjetaCuerpo>
          <SelectorPokemon
            participantId={participante.id}
            pokemonId={participante.pokemonId}
            nombre={participante.avatarNombre}
            shiny={participante.shiny}
          />
        </TarjetaCuerpo>
      </Tarjeta>

      {asignado ? (
        <Tarjeta>
          <TarjetaEncabezado>
            <TituloSeccion>Te toca regalarle a</TituloSeccion>
            <Insignia tono="alerta">No le digas a nadie</Insignia>
          </TarjetaEncabezado>

          <TarjetaCuerpo className="space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar persona={asignado.receptor} tamano="xl" />
              <div>
                <p className="font-display text-3xl font-extrabold">
                  {nombreVisible(asignado.receptor)}
                </p>
                <p className="text-sm font-semibold text-gris">
                  Anda con{" "}
                  {asignado.receptor.avatarNombre ??
                    nombrePokemon(asignado.receptor.pokemonId)}{" "}
                  en este intercambio.
                </p>
              </div>
            </div>

            {listaDeTuPersona.length === 0 ? (
              <p className="rounded-2xl border-2 border-tinta bg-amarillo-claro px-4 py-3 text-sm font-semibold">
                Este entrenador aún no tiene lista de deseos. Cuando la
                actualice te enviaremos un correo.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {listaDeTuPersona.map((deseo) => {
                  const ganas = GANAS[deseo.priority] ?? GANAS[2];
                  const comprado = yaCompre.has(deseo.id);
                  return (
                    <li
                      key={deseo.id}
                      className={`flex gap-3 rounded-2xl border-[3px] border-tinta p-3 ${
                        comprado ? "bg-verde-claro" : "bg-crema"
                      }`}
                    >
                      {deseo.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={deseo.imageUrl}
                          alt=""
                          loading="lazy"
                          className="size-20 shrink-0 rounded-xl border-2 border-tinta bg-blanco object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="grid size-20 shrink-0 place-items-center rounded-xl border-2 border-tinta bg-blanco text-gris">
                          <ImageOff className="size-5" />
                        </span>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="font-display font-extrabold leading-tight">
                          {deseo.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Insignia tono={ganas.tono}>{ganas.texto}</Insignia>
                          {deseo.price ? (
                            <span className="text-sm font-extrabold text-rojo">
                              {precioVisible(deseo.price)}
                            </span>
                          ) : null}
                        </div>
                        {deseo.note ? (
                          <p className="text-sm font-semibold text-gris">
                            {deseo.note}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 pt-1.5">
                          {deseo.url ? (
                            <a
                              href={deseo.url}
                              target="_blank"
                              rel="noreferrer nofollow"
                              title={deseo.siteName ?? deseo.url}
                              className={clasesBoton("azul", "sm")}
                            >
                              <ExternalLink className="size-3.5" />
                              Ver artículo
                            </a>
                          ) : null}

                          <form action={alternarCompradoAccion}>
                            <input
                              type="hidden"
                              name="participantId"
                              value={participante.id}
                            />
                            <input type="hidden" name="itemId" value={deseo.id} />
                            <BotonEnvio
                              variante={comprado ? "secundario" : "fantasma"}
                              tamano="sm"
                              cargando="..."
                            >
                              {comprado ? (
                                <>
                                  <Check className="size-3.5" />
                                  Ya lo compré
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="size-3.5" />
                                  Marcar comprado
                                </>
                              )}
                            </BotonEnvio>
                          </form>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/*
              Escribirle. Va dentro de esta tarjeta porque es sobre esta
              persona, y así no hay forma de confundirse de destinatario.
            */}
            <div className="space-y-3 rounded-2xl border-[3px] border-tinta bg-crema p-4">
              <h3 className="flex items-center gap-2 font-display font-extrabold">
                <PenLine className="size-4 text-azul" />
                Mándale una carta
              </h3>
              <p className="text-sm font-semibold text-gris">
                Las cartas que envíes son anónimas, tu amigo secreto podrá
                leerlas pero no podrá contestarte.
              </p>

              <FormularioCarta
                participantId={participante.id}
                paraQuien={nombreVisible(asignado.receptor)}
              />

              {enviadas.length ? (
                <details className="pt-1">
                  <summary className="cursor-pointer text-sm font-extrabold text-azul-oscuro">
                    Lo que ya le escribiste ({enviadas.length})
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {enviadas.map((carta) => (
                      <li
                        key={carta.id}
                        className="rounded-xl border-2 border-tinta bg-blanco px-3 py-2"
                      >
                        <p className="whitespace-pre-wrap text-sm font-semibold">
                          {carta.body}
                        </p>
                        <p className="mt-1 text-xs text-gris">
                          {formatearFechaCorta(carta.createdAt)} ·{" "}
                          {carta.readAt ? "ya la leyó" : "sin abrir"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          </TarjetaCuerpo>
        </Tarjeta>
      ) : (
        <Tarjeta>
          <TarjetaCuerpo className="flex flex-wrap items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl border-[3px] border-tinta bg-rojo text-blanco shadow-dura-sm">
              <Gift className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <TituloSeccion>A quién le regalas</TituloSeccion>
              <p className="text-sm font-semibold text-gris">
                {!participante.isPlaying
                  ? "Este año no entras al sorteo: no te toca regalarle a nadie y nadie te saca a ti. Si es un error, dile a quien organiza."
                  : "Delibird todavía no reparte los nombres. Mientras, arma tu lista para que no te regalen calcetines."}
              </p>
            </div>
            <Insignia tono={participante.isPlaying ? "espera" : "alerta"}>
              {participante.isPlaying ? "Sin sortear" : "Fuera del sorteo"}
            </Insignia>
          </TarjetaCuerpo>
        </Tarjeta>
      )}

      {hayBuzon ? (
        <Tarjeta>
          <TarjetaEncabezado>
            <TituloSeccion>Tu buzón</TituloSeccion>
            {sinLeer ? (
              <Insignia tono="alerta">
                {sinLeer} sin abrir
              </Insignia>
            ) : (
              <span className="text-sm font-bold text-gris">
                {recibidas.length} carta{recibidas.length === 1 ? "" : "s"}
              </span>
            )}
          </TarjetaEncabezado>

          <TarjetaCuerpo className="space-y-3">
            {recibidas.length === 0 ? (
              <p className="text-sm font-semibold text-gris">
                Aquí verás las cartas que tu amigo secreto te ha enviado.
              </p>
            ) : (
              <>
                {sinLeer ? (
                  <MarcarCartasLeidas participantId={participante.id} />
                ) : null}

                <ul className="space-y-3">
                  {recibidas.map((carta) => (
                    <li
                      key={carta.id}
                      className={cn(
                        "rounded-2xl border-[3px] border-tinta p-4",
                        carta.readAt ? "bg-crema" : "bg-amarillo-claro",
                      )}
                    >
                      <p className="whitespace-pre-wrap font-semibold leading-relaxed">
                        {carta.body}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-gris">
                        <Mailbox className="size-3.5" />
                        De tu Santa secreto · {formatearFechaCorta(carta.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </TarjetaCuerpo>
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Mi lista de deseos</TituloSeccion>
          <span className="text-sm font-bold text-gris">
            {deseos.length} cosa{deseos.length === 1 ? "" : "s"}
          </span>
        </TarjetaEncabezado>

        {deseos.length === 0 ? (
          <TarjetaCuerpo className="text-sm font-semibold text-gris">
            Todavía no pides nada. Pega un link abajo y aparece la foto.
          </TarjetaCuerpo>
        ) : (
          <ListaDeseos
            participantId={participante.id}
            deseos={deseos.map((d) => ({
              id: d.id,
              title: d.title,
              note: d.note,
              price: d.price,
              url: d.url,
              siteName: d.siteName,
              imageUrl: d.imageUrl,
              priority: d.priority,
            }))}
          />
        )}

        <TarjetaCuerpo className="border-t-[3px] border-tinta bg-crema">
          <FormularioDeseo participantId={participante.id} />
        </TarjetaCuerpo>
      </Tarjeta>
    </div>
  );
}
