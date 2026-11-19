import { Suspense } from "react";

import { FranjaPokebola } from "@/components/adornos";
import { AyudaWhatsApp } from "@/components/ayuda-whatsapp";
import { Marca } from "@/components/marca";
import { BotonLink } from "@/components/ui/boton";
import { usuarioActual } from "@/lib/auth";

/** Shell estático: se prerenderiza y la parte de sesión llega en streaming. */
export function Encabezado() {
  return (
    <header className="sticky top-0 z-20">
      <div className="border-b-[3px] border-tinta bg-blanco">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
          <Marca />
          <nav className="flex min-h-10 items-center gap-2">
            <Suspense fallback={null}>
              <NavUsuario />
            </Suspense>
          </nav>
        </div>
      </div>
      <FranjaPokebola />
    </header>
  );
}

async function NavUsuario() {
  const usuario = await usuarioActual();

  if (!usuario) {
    return (
      <BotonLink href="/login" variante="azul" tamano="sm">
        Entrar
      </BotonLink>
    );
  }

  // Salir vive dentro del perfil: en el teléfono no cabe un tercer botón.
  return (
    <>
      <BotonLink href="/perfil" variante="fantasma" tamano="sm">
        Perfil
      </BotonLink>
      <BotonLink href="/eventos" variante="fantasma" tamano="sm">
        Eventos
      </BotonLink>

      {/* Flota abajo a la derecha; se pinta aquí nomás por la sesión. */}
      <AyudaWhatsApp />
    </>
  );
}
