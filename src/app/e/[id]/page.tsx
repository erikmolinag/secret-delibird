import {
  CalendarDays,
  Check,
  Coins,
  Gift,
  ImageOff,
  MapPin,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { alternarCompradoAccion } from "@/actions/regalos";
import { Acebo } from "@/components/adornos";
import { Avatar } from "@/components/avatar";
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
import { BotonEnvio } from "@/components/ui/boton-envio";
import { requerirUsuario } from "@/lib/auth";
import { enlaceCalendario, enlaceMapa } from "@/lib/enlaces";
import { nombrePokemon } from "@/lib/pokemon";
import {
  aQuienLeRegala,
  comprasDe,
  invitadosDelEvento,
  listaDeDeseos,
  participanteDelUsuario,
} from "@/lib/datos";
import {
  formatearFecha,
  formatearPresupuesto,
  nombreVisible,
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

  const asignado = evento.status === "drawn" ? await aQuienLeRegala(participante.id) : null;
  const listaDeTuPersona = asignado
    ? await listaDeDeseos(asignado.receptor.id)
    : [];
  const yaCompre = asignado ? await comprasDe(participante.id) : new Set<string>();
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
            {invitados.map((invitado) => (
              <li
                key={invitado.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <Avatar persona={invitado} tamano="sm" />

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
                  {invitado.wishlistUpdatedAt ? (
                    <Insignia tono="listo">Lista armada</Insignia>
                  ) : (
                    <Insignia tono="espera">Sin lista</Insignia>
                  )}
                </div>
              </li>
            ))}
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
                Todavía no ha pedido nada. Si tarda, aquí te va a aparecer su
                lista en cuanto la arme, y te avisamos por correo.
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
                              {deseo.price}
                            </span>
                          ) : null}
                        </div>
                        {deseo.note ? (
                          <p className="text-sm font-semibold text-gris">
                            {deseo.note}
                          </p>
                        ) : null}
                        {deseo.url ? (
                          <a
                            href={deseo.url}
                            target="_blank"
                            rel="noreferrer nofollow"
                            className="block truncate text-xs font-bold text-azul underline underline-offset-2"
                          >
                            {deseo.siteName ?? deseo.url}
                          </a>
                        ) : null}

                        <form action={alternarCompradoAccion} className="pt-1">
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
                    </li>
                  );
                })}
              </ul>
            )}
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
