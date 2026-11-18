import { LogOut } from "lucide-react";
import { Suspense } from "react";

import { cerrarSesionAccion } from "@/actions/auth";
import { Marca } from "@/components/marca";
import { BotonLink } from "@/components/ui/boton";
import { usuarioActual } from "@/lib/auth";

/** Shell estatico: se prerenderiza y la parte de sesión llega en streaming. */
export function Encabezado() {
  return (
    <header className="border-b border-noche-borde/60 bg-noche/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Marca />
        <nav className="flex min-h-9 items-center gap-2">
          <Suspense fallback={null}>
            <NavUsuario />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

async function NavUsuario() {
  const usuario = await usuarioActual();

  if (!usuario) {
    return (
      <BotonLink href="/login" variante="fantasma" tamano="sm">
        Entrar
      </BotonLink>
    );
  }

  return (
    <>
      <BotonLink href="/eventos" variante="fantasma" tamano="sm">
        Mis eventos
      </BotonLink>
      <form action={cerrarSesionAccion}>
        <button
          type="submit"
          title={`Salir (${usuario.email})`}
          className="grid size-9 place-items-center rounded-full border border-noche-borde text-humo transition hover:border-rojo/60 hover:text-rojo"
        >
          <LogOut className="size-4" />
          <span className="sr-only">Salir</span>
        </button>
      </form>
    </>
  );
}
