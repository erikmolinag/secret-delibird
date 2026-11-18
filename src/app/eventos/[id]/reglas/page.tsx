import { ArrowLeft, Ban, CheckCircle2, Pin, Trash2, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { agregarReglaAccion, eliminarReglaAccion, sortearAccion } from "@/actions/sorteo";
import { Avatar } from "@/components/avatar";
import { Boton, BotonLink } from "@/components/ui/boton";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { claseInput } from "@/components/ui/campo";
import {
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  TituloSeccion,
} from "@/components/ui/tarjeta";
import { requerirUsuario } from "@/lib/auth";
import {
  eventoDelOrganizador,
  jugadoresDelEvento,
  reglasDelEvento,
} from "@/lib/datos";
import { analizar, type ReglaSorteo } from "@/lib/sorteo";
import { nombreVisible } from "@/lib/utils";

export const metadata: Metadata = { title: "Reglas del sorteo" };

/** Depende de la sesión: se renderiza por petición. */
export const instant = false;


type Jugador = { id: string; name: string };

function Selector({
  name,
  etiqueta,
  jugadores,
}: {
  name: string;
  etiqueta: string;
  jugadores: Jugador[];
}) {
  return (
    <select
      name={name}
      required
      defaultValue=""
      className={claseInput}
      aria-label={etiqueta}
    >
      <option value="" disabled>
        {etiqueta}
      </option>
      {jugadores.map((jugador) => (
        <option key={jugador.id} value={jugador.id}>
          {nombreVisible(jugador)}
        </option>
      ))}
    </select>
  );
}

function FilaRegla({
  eventId,
  ruleId,
  editable,
  children,
}: {
  eventId: string;
  ruleId: string;
  editable: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border-2 border-tinta bg-crema px-3 py-2">
      <span className="text-sm font-semibold">{children}</span>
      {editable ? (
        <form action={eliminarReglaAccion}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="ruleId" value={ruleId} />
          <Boton type="submit" variante="peligro" tamano="sm" className="px-2 py-1">
            <Trash2 className="size-3.5" />
            <span className="sr-only">Quitar regla</span>
          </Boton>
        </form>
      ) : null}
    </li>
  );
}

export default async function Reglas({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const usuario = await requerirUsuario();

  const evento = await eventoDelOrganizador(id, usuario.id);
  if (!evento) notFound();

  const [jugadores, reglas] = await Promise.all([
    jugadoresDelEvento(id),
    reglasDelEvento(id),
  ]);

  const porId = new Map(jugadores.map((j) => [j.id, j]));
  const nombre = (participantId: string) =>
    (() => { const j = porId.get(participantId); return j ? nombreVisible(j) : "alguien que ya no está"; })();

  const analisis = analizar(
    jugadores.map((j) => ({ id: j.id, nombre: nombreVisible(j) })),
    reglas.map(
      (r): ReglaSorteo => ({
        tipo: r.type,
        from: r.fromParticipantId,
        to: r.toParticipantId,
        bidireccional: r.bidirectional,
      }),
    ),
  );

  const exclusiones = reglas.filter((r) => r.type === "exclude");
  const listasBlancas = reglas.filter((r) => r.type === "whitelist");
  const pines = reglas.filter((r) => r.type === "pin");
  const yaSorteado = evento.status === "drawn";

  const porPersona = new Map<string, typeof listasBlancas>();
  for (const regla of listasBlancas) {
    const actuales = porPersona.get(regla.fromParticipantId) ?? [];
    porPersona.set(regla.fromParticipantId, [...actuales, regla]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <BotonLink
            href={`/eventos/${evento.id}`}
            variante="fantasma"
            tamano="sm"
            className="mb-2"
          >
            <ArrowLeft className="size-4" />
            Volver al panel
          </BotonLink>
          <h1 className="text-3xl font-extrabold">Reglas del sorteo</h1>
          <p className="text-sm font-semibold text-gris">
            {evento.name} · {jugadores.length} personas jugando
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border-[3px] border-tinta bg-rojo-claro px-4 py-3 text-sm font-bold text-rojo-oscuro shadow-dura-sm">
          {error}
        </p>
      ) : null}

      {analisis.ok ? (
        <div className="rounded-3xl border-[3px] border-tinta bg-verde-claro p-5 shadow-dura">
          <div className="flex flex-wrap items-center gap-4">
            <CheckCircle2 className="size-8 shrink-0 text-verde-oscuro" />
            <div className="min-w-48 flex-1">
              <h2 className="text-lg font-extrabold text-verde-oscuro">
                El sorteo es posible
              </h2>
              <p className="text-sm font-semibold text-verde-oscuro/80">
                {yaSorteado
                  ? "Ya está sorteado. Para cambiar reglas tendrías que deshacer el sorteo desde el panel."
                  : "Con estas reglas sí hay forma de repartir a todos."}
              </p>
            </div>
            {!yaSorteado ? (
              <form action={sortearAccion} className="w-full sm:w-auto">
                <input type="hidden" name="eventId" value={evento.id} />
                <BotonEnvio
                  tamano="lg"
                  cargando="Repartiendo..."
                  className="w-full sm:w-auto"
                >
                  Sortear y avisar a todos
                </BotonEnvio>
              </form>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border-[3px] border-tinta bg-rojo-claro p-5 shadow-dura">
          <div className="flex items-start gap-4">
            <TriangleAlert className="size-8 shrink-0 text-rojo-oscuro" />
            <div>
              <h2 className="text-lg font-extrabold text-rojo-oscuro">
                Así no se puede sortear
              </h2>
              <ul className="mt-1 space-y-1 text-sm font-semibold text-rojo-oscuro">
                {analisis.problemas.map((problema) => (
                  <li key={problema.motivo}>{problema.motivo}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>
            <Ban className="size-5 text-rojo" />
            No se pueden tocar
          </TituloSeccion>
          <span className="text-sm font-bold text-gris">{exclusiones.length}</span>
        </TarjetaEncabezado>

        <TarjetaCuerpo className="space-y-4">
          <p className="text-sm font-semibold text-gris">
            Para parejas, roomies o quien ya se regaló el año pasado.
          </p>

          {exclusiones.length ? (
            <ul className="space-y-2">
              {exclusiones.map((regla) => (
                <FilaRegla key={regla.id} eventId={evento.id} ruleId={regla.id} editable={!yaSorteado}>
                  {nombre(regla.fromParticipantId)}{" "}
                  {regla.bidirectional ? "y" : "no le regala a"}{" "}
                  {nombre(regla.toParticipantId)}
                  {regla.bidirectional ? " no se regalan entre ellos" : ""}
                </FilaRegla>
              ))}
            </ul>
          ) : null}

          {!yaSorteado ? (
            <form action={agregarReglaAccion} className="space-y-3">
              <input type="hidden" name="eventId" value={evento.id} />
              <input type="hidden" name="tipo" value="exclude" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Selector name="from" etiqueta="Quién" jugadores={jugadores} />
                <Selector name="to" etiqueta="No le regala a" jugadores={jugadores} />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name="bidireccional"
                  defaultChecked
                  className="size-4 accent-[var(--color-rojo)]"
                />
                También al revés
              </label>
              <BotonEnvio variante="secundario" tamano="sm" cargando="Agregando...">
                Agregar exclusión
              </BotonEnvio>
            </form>
          ) : null}
        </TarjetaCuerpo>
      </Tarjeta>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Solo le puede tocar</TituloSeccion>
          <span className="text-sm font-bold text-gris">{porPersona.size}</span>
        </TarjetaEncabezado>

        <TarjetaCuerpo className="space-y-4">
          <p className="text-sm font-semibold text-gris">
            Lo incluyente: si alguien tiene lista, el sorteo solo le puede dar a
            esas personas. Por ejemplo, los niños solo le regalan a niños.
          </p>

          {porPersona.size ? (
            <ul className="space-y-2">
              {[...porPersona].map(([from, reglasDe]) => {
                const jugador = porId.get(from);
                return (
                  <li
                    key={from}
                    className="rounded-2xl border-2 border-tinta bg-crema px-3 py-2"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {jugador ? <Avatar persona={jugador} tamano="sm" /> : null}
                      <span className="font-bold">
                        {nombre(from)} solo le puede regalar a:
                      </span>
                    </div>
                    <ul className="flex flex-wrap gap-2">
                      {reglasDe.map((regla) => (
                        <li key={regla.id}>
                          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-tinta bg-blanco px-2.5 py-0.5 text-sm font-bold">
                            {nombre(regla.toParticipantId)}
                            {!yaSorteado ? (
                              <form action={eliminarReglaAccion}>
                                <input type="hidden" name="eventId" value={evento.id} />
                                <input type="hidden" name="ruleId" value={regla.id} />
                                <button
                                  type="submit"
                                  className="text-rojo hover:text-rojo-oscuro"
                                  title="Quitar"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </form>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {!yaSorteado ? (
            <form action={agregarReglaAccion} className="space-y-3">
              <input type="hidden" name="eventId" value={evento.id} />
              <input type="hidden" name="tipo" value="whitelist" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Selector name="from" etiqueta="Quién" jugadores={jugadores} />
                <Selector name="to" etiqueta="Solo le puede tocar" jugadores={jugadores} />
              </div>
              <BotonEnvio variante="secundario" tamano="sm" cargando="Agregando...">
                Agregar a su lista
              </BotonEnvio>
            </form>
          ) : null}
        </TarjetaCuerpo>
      </Tarjeta>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>
            <Pin className="size-5 text-azul" />
            Asignaciones fijas
          </TituloSeccion>
          <span className="text-sm font-bold text-gris">{pines.length}</span>
        </TarjetaEncabezado>

        <TarjetaCuerpo className="space-y-4">
          <p className="text-sm font-semibold text-gris">
            Ojo: tú te enteras de estos pares, así que úsalos solo cuando haga falta.
          </p>

          {pines.length ? (
            <ul className="space-y-2">
              {pines.map((regla) => (
                <FilaRegla key={regla.id} eventId={evento.id} ruleId={regla.id} editable={!yaSorteado}>
                  {nombre(regla.fromParticipantId)} le regala a{" "}
                  {nombre(regla.toParticipantId)}
                </FilaRegla>
              ))}
            </ul>
          ) : null}

          {!yaSorteado ? (
            <form action={agregarReglaAccion} className="space-y-3">
              <input type="hidden" name="eventId" value={evento.id} />
              <input type="hidden" name="tipo" value="pin" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Selector name="from" etiqueta="Quién regala" jugadores={jugadores} />
                <Selector name="to" etiqueta="Le toca" jugadores={jugadores} />
              </div>
              <BotonEnvio variante="secundario" tamano="sm" cargando="Fijando...">
                Fijar esta pareja
              </BotonEnvio>
            </form>
          ) : null}
        </TarjetaCuerpo>
      </Tarjeta>
    </div>
  );
}
