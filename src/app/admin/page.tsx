import { ChevronRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { editarUsuarioAccion } from "@/actions/admin";
import { AjusteAmazon } from "@/components/ajuste-amazon";
import { AjusteCorreo } from "@/components/ajuste-correo";
import { AvatarEntrenador } from "@/components/avatar";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { Campo, Entrada, claseInput } from "@/components/ui/campo";
import { Insignia } from "@/components/ui/insignia";
import {
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  TituloSeccion,
} from "@/components/ui/tarjeta";
import { ajustesDeCorreo, codigoAmazon } from "@/lib/ajustes";
import { requerirAdmin } from "@/lib/auth";
import { GRUPOS_ENTRENADORES } from "@/lib/avatares";
import {
  correosFallidosHoy,
  intercambiosParaAdmin,
  resumenAdmin,
  ultimosCorreos,
  usuariosParaAdmin,
} from "@/lib/datos-admin";
import { NOMBRE_PROVEEDOR, type Proveedor } from "@/lib/proveedores";
import { cn, formatearFecha, formatearFechaCorta } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Depende de la sesión: se renderiza por petición. */
export const instant = false;

export default async function Admin() {
  await requerirAdmin();

  const [resumen, intercambios, usuarios, amazon, correo, correos, fallidos] =
    await Promise.all([
      resumenAdmin(),
      intercambiosParaAdmin(),
      usuariosParaAdmin(),
      codigoAmazon(),
      ajustesDeCorreo(),
      ultimosCorreos(),
      correosFallidosHoy(),
    ]);

  // Las llaves viven en Vercel: aquí solo se dice si están, nunca su valor.
  const llaves: Record<Proveedor, boolean> = {
    plunk: !!process.env.PLUNK_API_KEY,
    resend: !!process.env.RESEND_API_KEY,
  };

  const datos = [
    {
      etiqueta: "Usuarios registrados",
      valor: resumen.usuarios,
      detalle: `${resumen.usuariosNuevos} en los últimos 7 días`,
    },
    {
      etiqueta: "Intercambios",
      valor: resumen.intercambios,
      detalle: `${resumen.sorteados} ya sorteado${resumen.sorteados === 1 ? "" : "s"}`,
    },
    {
      etiqueta: "Invitados",
      valor: resumen.invitados,
      detalle: "sumando todos los intercambios",
    },
    {
      etiqueta: "Deseos en listas",
      valor: resumen.deseos,
      detalle: "regalos pedidos en total",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-sm font-extrabold text-azul">
            <ShieldCheck className="size-4" />
            Panel de admin
          </p>
          <h1 className="text-3xl font-extrabold">Actividad</h1>
          <p className="text-sm text-gris">
            Todo lo que pasa en Secret Delibird. Solo las cuentas de
            ADMIN_EMAILS ven esta página.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {datos.map((dato) => (
            <div
              key={dato.etiqueta}
              className="rounded-2xl border-[3px] border-tinta bg-blanco px-4 py-3 shadow-dura-sm"
            >
              <p className="font-display text-3xl font-extrabold text-rojo">
                {dato.valor}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-tinta">
                {dato.etiqueta}
              </p>
              <p className="text-xs text-gris">{dato.detalle}</p>
            </div>
          ))}
        </div>
      </header>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Enlaces de Amazon</TituloSeccion>
          <span className="text-sm text-gris">
            {amazon ? "Prendido" : "Apagado"}
          </span>
        </TarjetaEncabezado>
        <TarjetaCuerpo className="space-y-3">
          <p className="text-sm text-gris">
            Con un código puesto, todo enlace de Amazon que alguien pegue en su
            lista se limpia —incluido el código de afiliado de quien lo haya
            copiado— y sale con el tuyo. Las direcciones se guardan tal como las
            pegaron: el código se pone al mostrarlas, así que cambiarlo aquí
            cambia todos los enlaces de golpe.
          </p>
          <AjusteAmazon codigo={amazon} />
        </TarjetaCuerpo>
      </Tarjeta>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Correo</TituloSeccion>
          <span className="text-sm text-gris">
            Primero {NOMBRE_PROVEEDOR[correo.primero]}
          </span>
        </TarjetaEncabezado>
        <TarjetaCuerpo>
          <AjusteCorreo ajustes={correo} llaves={llaves} />
        </TarjetaCuerpo>
      </Tarjeta>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Últimos correos</TituloSeccion>
          <span
            className={cn(
              "text-sm",
              fallidos > 0 ? "font-bold text-rojo-oscuro" : "text-gris",
            )}
          >
            {fallidos === 0
              ? "ninguno falló en 24 horas"
              : fallidos === 1
                ? "1 falló hoy"
                : `${fallidos} fallaron hoy`}
          </span>
        </TarjetaEncabezado>

        {correos.length === 0 ? (
          <TarjetaCuerpo className="text-center text-sm text-gris">
            Todavía no se manda ningún correo desde que existe esta bitácora.
          </TarjetaCuerpo>
        ) : (
          <ul className="divide-y-[3px] divide-tinta">
            {correos.map((envio) => (
              <li
                key={envio.id}
                className={cn("px-4 py-3", envio.ok ? null : "bg-rojo-claro")}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Insignia tono={envio.ok ? "listo" : "alerta"}>
                    {envio.ok ? (envio.provider ?? "salió") : "falló"}
                  </Insignia>
                  <span className="font-bold">{envio.toEmail}</span>
                  {envio.kind ? (
                    <span className="text-sm font-semibold text-gris">
                      {envio.kind}
                    </span>
                  ) : null}
                  <span className="ms-auto text-sm text-gris">
                    {formatearFechaCorta(envio.createdAt)}
                    {envio.ms === null ? "" : ` · ${(envio.ms / 1000).toFixed(1)}s`}
                  </span>
                </div>

                <p className="text-sm text-gris">{envio.subject}</p>

                {envio.detail ? (
                  <p className="mt-1 break-words text-sm font-semibold text-rojo-oscuro">
                    {envio.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Intercambios</TituloSeccion>
          <span className="text-sm text-gris">{intercambios.length} en total</span>
        </TarjetaEncabezado>

        {intercambios.length === 0 ? (
          <TarjetaCuerpo className="text-center text-sm text-gris">
            Nadie ha creado un intercambio todavía.
          </TarjetaCuerpo>
        ) : (
          <ul className="divide-y-[3px] divide-tinta/15">
            {intercambios.map(({ evento, organizador, invitados, conLista }) => (
              <li key={evento.id}>
                <Link
                  href={`/admin/eventos/${evento.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-crema"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{evento.name}</p>
                    <p className="truncate text-xs text-gris">
                      Organiza {organizador.name ?? organizador.email} · creado el{" "}
                      {formatearFechaCorta(evento.createdAt)}
                    </p>
                    <p className="text-xs font-semibold text-gris">
                      {invitados} invitado{invitados === 1 ? "" : "s"} · {conLista}{" "}
                      con lista
                      {evento.eventDate
                        ? ` · ${formatearFecha(evento.eventDate, false)}`
                        : ""}
                    </p>
                  </div>
                  <Insignia tono={evento.status === "drawn" ? "listo" : "espera"}>
                    {evento.status === "drawn" ? "Sorteado" : "Sin sortear"}
                  </Insignia>
                  <ChevronRight className="size-5 shrink-0 text-gris" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta>
        <TarjetaEncabezado>
          <TituloSeccion>Usuarios registrados</TituloSeccion>
          <span className="text-sm text-gris">{usuarios.length} en total</span>
        </TarjetaEncabezado>

        <ul className="divide-y-[3px] divide-tinta/15">
          {usuarios.map((usuario) => (
            <li
              key={usuario.id}
              className="flex flex-wrap items-center gap-3 px-5 py-3"
            >
              <AvatarEntrenador trainerKey={usuario.trainerKey} tamano="xs" />

              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate font-bold">{usuario.name ?? "Sin nombre"}</p>
                <p className="truncate text-xs text-gris">{usuario.email}</p>
                <p className="text-xs text-gris">
                  Desde el {formatearFechaCorta(usuario.createdAt)}
                  {usuario.ultimoAcceso
                    ? ` · último acceso el ${formatearFechaCorta(usuario.ultimoAcceso)}`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {usuario.organiza > 0 ? (
                  <Insignia tono="info">Organiza {usuario.organiza}</Insignia>
                ) : null}
                {usuario.participa > 0 ? (
                  <Insignia tono="listo">Juega en {usuario.participa}</Insignia>
                ) : null}
              </div>

              <details className="w-full rounded-2xl border-[3px] border-tinta bg-crema px-4 py-2.5">
                <summary className="cursor-pointer text-sm font-bold text-azul">
                  Editar nombre y entrenador
                </summary>

                <form action={editarUsuarioAccion} className="space-y-4 pt-4">
                  <input type="hidden" name="userId" value={usuario.id} />

                  <Campo
                    etiqueta="Nombre de entrenador"
                    htmlFor={`nombre-${usuario.id}`}
                  >
                    <Entrada
                      id={`nombre-${usuario.id}`}
                      name="name"
                      defaultValue={usuario.name ?? ""}
                      maxLength={60}
                      placeholder="Sin nombre"
                    />
                  </Campo>

                  <Campo
                    etiqueta="Entrenador"
                    htmlFor={`entrenador-${usuario.id}`}
                    pista="Su Pokémon no se toca aquí: ese es de cada intercambio."
                  >
                    <select
                      id={`entrenador-${usuario.id}`}
                      name="trainerKey"
                      defaultValue={usuario.trainerKey ?? ""}
                      className={claseInput}
                    >
                      <option value="">Sin entrenador</option>
                      {GRUPOS_ENTRENADORES.map((g) => (
                        <optgroup key={g.grupo} label={g.grupo}>
                          {g.entrenadores.map((e) => (
                            <option key={e.clave} value={e.clave}>
                              {e.nombre}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </Campo>

                  <BotonEnvio tamano="sm" cargando="Guardando...">
                    Guardar cambios
                  </BotonEnvio>
                </form>
              </details>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  );
}
