import type { Metadata } from "next";

import { actualizarPerfilAccion } from "@/actions/perfil";
import { SelectorEntrenador } from "@/components/selector-entrenador";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { Campo, Entrada } from "@/components/ui/campo";
import {
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  TituloSeccion,
} from "@/components/ui/tarjeta";
import { requerirUsuario } from "@/lib/auth";

export const metadata: Metadata = { title: "Mi perfil" };

/** Depende de la sesión: se renderiza por petición. */
export const instant = false;

export default async function Perfil() {
  const usuario = await requerirUsuario();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Mi perfil</h1>
        <p className="text-sm font-semibold text-gris">
          Tu nombre y tu entrenador son los mismos en todos los intercambios. El
          Pokémon se elige dentro de cada evento.
        </p>
      </div>

      <form action={actualizarPerfilAccion}>
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
                defaultValue={usuario.name ?? ""}
                maxLength={60}
                required
                placeholder="Erik"
              />
            </Campo>

            <SelectorEntrenador inicial={usuario.trainerKey} />

            <BotonEnvio cargando="Guardando...">Guardar perfil</BotonEnvio>
          </TarjetaCuerpo>
        </Tarjeta>
      </form>
    </div>
  );
}
