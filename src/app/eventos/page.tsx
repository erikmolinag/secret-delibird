import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AvatarPokemon } from "@/components/avatar-pokemon";
import { BotonLink } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { Tarjeta, TarjetaCuerpo } from "@/components/ui/tarjeta";
import { requerirUsuario } from "@/lib/auth";
import {
  eventosDelUsuario,
  participacionesDelUsuario,
  resumenDeEventos,
} from "@/lib/datos";
import { formatearFecha, formatearPresupuesto } from "@/lib/utils";

export const metadata: Metadata = { title: "Mis eventos" };

/** Depende de la sesión: se renderiza por peticion. */
export const instant = false;

export default async function MisEventos() {
  const usuario = await requerirUsuario();

  const [organizados, participaciones] = await Promise.all([
    eventosDelUsuario(usuario.id),
    participacionesDelUsuario(usuario.id),
  ]);

  const resumen = await resumenDeEventos(organizados.map((e) => e.id));

  const invitadoEn = participaciones.filter(
    (p) => p.evento.organizerId !== usuario.id,
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Mis eventos</h1>
          <p className="text-sm text-humo">
            Solo tú ves estos eventos. Puedes tener todos los que quieras.
          </p>
        </div>
        <BotonLink href="/eventos/nuevo">
          <Plus className="size-4" />
          Nuevo evento
        </BotonLink>
      </div>

      {organizados.length === 0 ? (
        <Tarjeta>
          <TarjetaCuerpo className="space-y-3 py-10 text-center">
            <AvatarPokemon pokemonId={225} tamano="xl" className="mx-auto" />
            <h2 className="text-xl font-bold">Todavía no organizas nada</h2>
            <p className="mx-auto max-w-sm text-sm text-humo">
              Crea tu primer intercambio: le pones fecha y lugar, invitas por
              correo y Delibird se encarga del resto.
            </p>
            <BotonLink href="/eventos/nuevo" className="mt-2">
              Crear mi primer evento
            </BotonLink>
          </TarjetaCuerpo>
        </Tarjeta>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {organizados.map((evento) => {
            const datos = resumen.get(evento.id) ?? { total: 0, listos: 0 };
            const presupuesto = formatearPresupuesto(
              evento.budgetAmount,
              evento.budgetCurrency,
            );

            return (
              <li key={evento.id}>
                <Link href={`/eventos/${evento.id}`} className="group block h-full">
                  <Tarjeta className="h-full transition group-hover:border-hielo/60">
                    <TarjetaCuerpo className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-xl font-bold leading-tight">
                          {evento.name}
                        </h2>
                        <Insignia tono={evento.status === "drawn" ? "listo" : "espera"}>
                          {evento.status === "drawn" ? "Sorteado" : "Sin sortear"}
                        </Insignia>
                      </div>

                      <dl className="space-y-1.5 text-sm text-humo">
                        {evento.eventDate ? (
                          <div className="flex items-center gap-2">
                            <CalendarDays className="size-4 text-hielo" />
                            <dd>{formatearFecha(evento.eventDate)}</dd>
                          </div>
                        ) : null}
                        {evento.place ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-hielo" />
                            <dd>{evento.place}</dd>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-hielo" />
                          <dd>
                            {datos.total} invitado{datos.total === 1 ? "" : "s"} ·{" "}
                            {datos.listos} con lista
                          </dd>
                        </div>
                      </dl>

                      {presupuesto ? (
                        <p className="text-sm font-bold text-dorado">
                          Presupuesto {presupuesto}
                        </p>
                      ) : null}
                    </TarjetaCuerpo>
                  </Tarjeta>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {invitadoEn.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-extrabold">Dónde te invitaron</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {invitadoEn.map(({ participante, evento }) => (
              <li key={participante.id}>
                <Link href={`/e/${participante.id}`} className="group block h-full">
                  <Tarjeta className="h-full transition group-hover:border-hielo/60">
                    <TarjetaCuerpo className="flex items-center gap-4">
                      <AvatarPokemon pokemonId={participante.pokemonId} tamano="lg" />
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold">{evento.name}</h3>
                        <p className="text-sm text-humo">
                          {formatearFecha(evento.eventDate) ?? "Sin fecha todavía"}
                        </p>
                        <p className="mt-1 text-xs font-bold text-hielo">
                          {participante.wishlistUpdatedAt
                            ? "Tu lista ya tiene cosas"
                            : "Te falta armar tu lista"}
                        </p>
                      </div>
                    </TarjetaCuerpo>
                  </Tarjeta>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
