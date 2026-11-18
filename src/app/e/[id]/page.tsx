import {
  CalendarDays,
  Coins,
  Gift,
  ImageOff,
  MapPin,
  Trash2,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { eliminarDeseoAccion } from "@/actions/wishlist";
import { AvatarPokemon } from "@/components/avatar-pokemon";
import { FormularioDeseo } from "@/components/formulario-deseo";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import {
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  TituloSeccion,
} from "@/components/ui/tarjeta";
import { requerirUsuario } from "@/lib/auth";
import { listaDeDeseos, participanteDelUsuario } from "@/lib/datos";
import { nombrePokemon } from "@/lib/pokemon";
import { formatearFecha, formatearPresupuesto } from "@/lib/utils";

export const metadata: Metadata = { title: "Mi lista de deseos" };

/** Depende de la sesión: se renderiza por peticion. */
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
  const presupuesto = formatearPresupuesto(
    evento.budgetAmount,
    evento.budgetCurrency,
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-5">
        <AvatarPokemon pokemonId={participante.pokemonId} tamano="xl" />
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-hielo">
            {evento.name}
          </p>
          <h1 className="text-3xl font-extrabold">Hola, {participante.name}</h1>
          <p className="text-sm text-humo">
            Tu Pokémon en este intercambio es{" "}
            <strong className="text-nieve">
              {nombrePokemon(participante.pokemonId)}
            </strong>
            .
          </p>
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
      </header>

      {evento.message ? (
        <p className="rounded-2xl border border-dorado/30 bg-dorado/10 px-5 py-3 text-sm">
          {evento.message}
        </p>
      ) : null}

      <Tarjeta className="border-dashed">
        <TarjetaCuerpo className="flex flex-wrap items-center gap-4">
          <Gift className="size-8 text-dorado" />
          <div className="min-w-0 flex-1">
            <TituloSeccion>A quién le regalas</TituloSeccion>
            <p className="text-sm text-humo">
              {evento.status === "drawn"
                ? "El sorteo ya corrió. Aquí va a aparecer tu persona y su lista."
                : "Delibird todavía no reparte los nombres. Mientras, arma tu lista para que no te regalen calcetines."}
            </p>
          </div>
          <Insignia tono="espera">
            {evento.status === "drawn" ? "Fase 2" : "Sin sortear"}
          </Insignia>
        </TarjetaCuerpo>
      </Tarjeta>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Mi lista de deseos</TituloSeccion>
          <span className="text-sm text-humo">
            {deseos.length} cosa{deseos.length === 1 ? "" : "s"}
          </span>
        </TarjetaEncabezado>

        {deseos.length === 0 ? (
          <TarjetaCuerpo className="text-sm text-humo">
            Todavía no pides nada. Pega un link abajo y aparece la foto.
          </TarjetaCuerpo>
        ) : (
          <ul className="grid gap-4 p-5 sm:grid-cols-2">
            {deseos.map((deseo) => {
              const ganas = GANAS[deseo.priority] ?? GANAS[2];
              return (
                <li
                  key={deseo.id}
                  className="flex gap-4 rounded-2xl border border-noche-borde/70 bg-noche/40 p-3"
                >
                  {deseo.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={deseo.imageUrl}
                      alt=""
                      loading="lazy"
                      className="size-24 shrink-0 rounded-xl bg-white object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="grid size-24 shrink-0 place-items-center rounded-xl border border-noche-borde text-humo">
                      <ImageOff className="size-6" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold leading-tight">{deseo.title}</h3>
                      <form action={eliminarDeseoAccion}>
                        <input
                          type="hidden"
                          name="participantId"
                          value={participante.id}
                        />
                        <input type="hidden" name="itemId" value={deseo.id} />
                        <Boton
                          type="submit"
                          variante="peligro"
                          tamano="sm"
                          title="Quitar de mi lista"
                          className="px-2 py-1"
                        >
                          <Trash2 className="size-3.5" />
                        </Boton>
                      </form>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Insignia tono={ganas.tono}>{ganas.texto}</Insignia>
                      {deseo.price ? (
                        <span className="text-sm font-bold text-dorado">
                          {deseo.price}
                        </span>
                      ) : null}
                    </div>

                    {deseo.note ? (
                      <p className="text-sm text-humo">{deseo.note}</p>
                    ) : null}

                    {deseo.url ? (
                      <a
                        href={deseo.url}
                        target="_blank"
                        rel="noreferrer nofollow"
                        className="block truncate text-xs text-hielo underline underline-offset-2"
                      >
                        {deseo.siteName ?? deseo.url}
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <TarjetaCuerpo className="border-t border-noche-borde/60">
          <FormularioDeseo participantId={participante.id} />
        </TarjetaCuerpo>
      </Tarjeta>
    </div>
  );
}
