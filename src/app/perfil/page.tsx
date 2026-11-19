import { LogOut, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { cerrarSesionAccion } from "@/actions/auth";
import { actualizarPerfilAccion } from "@/actions/perfil";
import { Estrella } from "@/components/adornos";
import { SelectorEntrenador } from "@/components/selector-entrenador";
import { Boton, BotonLink } from "@/components/ui/boton";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { Campo, Entrada } from "@/components/ui/campo";
import {
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  TituloSeccion,
} from "@/components/ui/tarjeta";
import { esAdmin, requerirUsuario } from "@/lib/auth";
import { nombreDeInvitacion } from "@/lib/datos";

export const metadata: Metadata = { title: "Mi perfil" };

/** Depende de la sesión: se renderiza por petición. */
export const instant = false;

export default async function Perfil({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string }>;
}) {
  const { siguiente } = await searchParams;
  const usuario = await requerirUsuario();

  const bienvenida = !usuario.onboardedAt;

  // Mientras no se ponga nombre de entrenador, el mejor valor por omisión es el
  // nombre con el que la invitaron, no uno adivinado de su correo.
  const sugerido = bienvenida ? await nombreDeInvitacion(usuario.email) : null;
  const destino = siguiente?.startsWith("/") ? siguiente : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {bienvenida ? (
        <div className="relative rounded-3xl border-[3px] border-tinta bg-amarillo-claro p-5 shadow-dura">
          <Estrella className="absolute -right-3 -top-4 size-12 rotate-12" />
          <h1 className="text-3xl font-extrabold">Bienvenido, entrenador</h1>
          <p className="mt-1 font-semibold text-gris">
            Antes de entrar, ponte nombre y cara. Así te van a ver en todos los
            intercambios. El Pokémon que te acompaña se elige luego, dentro de
            cada evento.
          </p>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-extrabold">Mi perfil</h1>
          <p className="text-sm font-semibold text-gris">
            Tu nombre y tu entrenador son los mismos en todos los intercambios.
            El Pokémon se elige dentro de cada evento.
          </p>
        </div>
      )}

      <form action={actualizarPerfilAccion}>
        {destino ? <input type="hidden" name="siguiente" value={destino} /> : null}

        <Tarjeta>
          <TarjetaEncabezado>
            <TituloSeccion>Entrenador</TituloSeccion>
            <span className="text-sm font-bold text-gris">{usuario.email}</span>
          </TarjetaEncabezado>

          <TarjetaCuerpo className="space-y-5">
            <Campo
              etiqueta="Nombre de entrenador"
              htmlFor="name"
              pista="Es como te ven los demás en las listas y en el sorteo."
            >
              <Entrada
                id="name"
                name="name"
                defaultValue={(bienvenida ? sugerido ?? usuario.name : usuario.name) ?? ""}
                maxLength={60}
                required
                autoFocus={bienvenida}
                placeholder="Erik"
              />
            </Campo>

            <SelectorEntrenador inicial={usuario.trainerKey} />
          </TarjetaCuerpo>
        </Tarjeta>

        {/* Pegado abajo: el selector de entrenador es largo y en el teléfono el
            botón se quedaba fuera de la pantalla. */}
        <div className="sticky bottom-3 z-10 mt-5 pe-16 md:pe-0">
          <BotonEnvio className="w-full" cargando="Guardando...">
            {bienvenida ? "Listo, vamos" : "Guardar perfil"}
          </BotonEnvio>
        </div>
      </form>

      {!bienvenida ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* El panel no tiene botón en el encabezado: en el teléfono no cabe. */}
          {esAdmin(usuario) ? (
            <BotonLink href="/admin" variante="azul" tamano="sm">
              <ShieldCheck className="size-4" />
              Panel de admin
            </BotonLink>
          ) : null}
          <form action={cerrarSesionAccion}>
            <Boton type="submit" variante="peligro" tamano="sm">
              <LogOut className="size-4" />
              Cerrar sesión
            </Boton>
          </form>
        </div>
      ) : null}
    </div>
  );
}
