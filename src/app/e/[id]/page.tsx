import {
  CalendarDays,
  Check,
  Coins,
  Gift,
  ImageOff,
  MapPin,
  Pencil,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { alternarCompradoAccion } from "@/actions/regalos";
import { editarDeseoAccion, eliminarDeseoAccion } from "@/actions/wishlist";
import { Acebo } from "@/components/adornos";
import { Avatar } from "@/components/avatar";
import { SelectorAvatar } from "@/components/selector-avatar";
import { FormularioDeseo } from "@/components/formulario-deseo";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import {
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  TituloSeccion,
} from "@/components/ui/tarjeta";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { AreaTexto, Campo, Entrada, claseInput } from "@/components/ui/campo";
import { requerirUsuario } from "@/lib/auth";
import { nombreAvatar } from "@/lib/avatares";
import {
  aQuienLeRegala,
  comprasDe,
  listaDeDeseos,
  participanteDelUsuario,
} from "@/lib/datos";
import { formatearFecha, formatearPresupuesto } from "@/lib/utils";

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

  const asignado = evento.status === "drawn" ? await aQuienLeRegala(participante.id) : null;
  const listaDeTuPersona = asignado
    ? await listaDeDeseos(asignado.receptor.id)
    : [];
  const yaCompre = asignado ? await comprasDe(participante.id) : new Set<string>();
  const presupuesto = formatearPresupuesto(
    evento.budgetAmount,
    evento.budgetCurrency,
  );

  const datosEvento = [
    evento.eventDate
      ? { icono: CalendarDays, texto: formatearFecha(evento.eventDate)! }
      : null,
    evento.place ? { icono: MapPin, texto: evento.place } : null,
    presupuesto ? { icono: Coins, texto: presupuesto } : null,
  ].filter((d) => d !== null);

  return (
    <div className="space-y-6">
      <header className="relative rounded-3xl border-[3px] border-tinta bg-blanco p-5 shadow-dura">
        <Acebo className="absolute -right-3 -top-4 size-14 rotate-12" />

        <p className="font-display text-sm font-extrabold uppercase tracking-wide text-azul-oscuro">
          {evento.name}
        </p>
        <h1 className="text-3xl font-extrabold">Hola, {participante.name}</h1>

        {datosEvento.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {datosEvento.map((dato) => (
              <span
                key={dato.texto}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-tinta bg-crema-2 px-3 py-1 text-sm font-bold"
              >
                <dato.icono className="size-4 text-azul" />
                {dato.texto}
              </span>
            ))}
          </div>
        ) : null}

        {evento.message ? (
          <p className="mt-4 rounded-2xl border-2 border-tinta bg-amarillo-claro px-4 py-2.5 text-sm font-semibold">
            {evento.message}
          </p>
        ) : null}
      </header>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Tu sprite</TituloSeccion>
        </TarjetaEncabezado>
        <TarjetaCuerpo>
          <SelectorAvatar participantId={participante.id} persona={participante} />
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
                  {asignado.receptor.name}
                </p>
                <p className="text-sm font-semibold text-gris">
                  Anda como {nombreAvatar(asignado.receptor)} en este intercambio.
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
          <ul className="grid gap-4 p-5 sm:grid-cols-2">
            {deseos.map((deseo) => {
              const ganas = GANAS[deseo.priority] ?? GANAS[2];
              return (
                <li
                  key={deseo.id}
                  className="flex gap-4 rounded-2xl border-[3px] border-tinta bg-crema p-3"
                >
                  {deseo.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={deseo.imageUrl}
                      alt=""
                      loading="lazy"
                      className="size-24 shrink-0 rounded-xl border-2 border-tinta bg-blanco object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="grid size-24 shrink-0 place-items-center rounded-xl border-2 border-tinta bg-blanco text-gris">
                      <ImageOff className="size-6" />
                    </span>
                  )}

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-extrabold leading-tight">
                        {deseo.title}
                      </h3>
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
                        <span className="text-sm font-extrabold text-rojo">
                          {deseo.price}
                        </span>
                      ) : null}
                    </div>

                    {deseo.note ? (
                      <p className="text-sm font-semibold text-gris">{deseo.note}</p>
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

                    <details className="pt-1">
                      <summary className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-azul">
                        <Pencil className="size-3" />
                        Editar
                      </summary>

                      <form
                        action={editarDeseoAccion}
                        className="mt-3 space-y-3 rounded-2xl border-2 border-tinta bg-blanco p-3"
                      >
                        <input
                          type="hidden"
                          name="participantId"
                          value={participante.id}
                        />
                        <input type="hidden" name="itemId" value={deseo.id} />

                        <Campo etiqueta="Qué es" htmlFor={`titulo-${deseo.id}`}>
                          <Entrada
                            id={`titulo-${deseo.id}`}
                            name="title"
                            defaultValue={deseo.title}
                            required
                            maxLength={160}
                          />
                        </Campo>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Campo etiqueta="Precio" htmlFor={`precio-${deseo.id}`}>
                            <Entrada
                              id={`precio-${deseo.id}`}
                              name="price"
                              defaultValue={deseo.price ?? ""}
                              maxLength={40}
                            />
                          </Campo>
                          <Campo etiqueta="Ganas" htmlFor={`ganas-${deseo.id}`}>
                            <select
                              id={`ganas-${deseo.id}`}
                              name="priority"
                              defaultValue={String(deseo.priority)}
                              className={claseInput}
                            >
                              <option value="1">Me encantaría</option>
                              <option value="2">Me gusta</option>
                              <option value="3">Tal vez</option>
                            </select>
                          </Campo>
                        </div>

                        <Campo etiqueta="Nota" htmlFor={`nota-${deseo.id}`}>
                          <AreaTexto
                            id={`nota-${deseo.id}`}
                            name="note"
                            defaultValue={deseo.note ?? ""}
                            maxLength={500}
                          />
                        </Campo>

                        <Campo
                          etiqueta="Cambiar la foto"
                          htmlFor={`foto-${deseo.id}`}
                          pista="Pega la dirección de otra imagen. Si lo dejas vacío, se queda la de ahora."
                        >
                          <Entrada
                            id={`foto-${deseo.id}`}
                            name="imageUrl"
                            type="url"
                            placeholder="https://.../foto.jpg"
                          />
                        </Campo>

                        <BotonEnvio
                          variante="secundario"
                          tamano="sm"
                          cargando="Guardando..."
                        >
                          Guardar cambios
                        </BotonEnvio>
                      </form>
                    </details>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <TarjetaCuerpo className="border-t-[3px] border-tinta bg-crema">
          <FormularioDeseo participantId={participante.id} />
        </TarjetaCuerpo>
      </Tarjeta>
    </div>
  );
}
