import { LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { cerrarSesionAccion } from "@/actions/auth";
import { FranjaPokebola } from "@/components/adornos";
import { AvatarEntrenador } from "@/components/avatar";
import { Marca } from "@/components/marca";
import { BotonLink } from "@/components/ui/boton";
import { usuarioActual } from "@/lib/auth";

/** Shell estático: se prerenderiza y la parte de sesión llega en streaming. */
export function Encabezado() {
  return (
    <header className="sticky top-0 z-20">
      <div className="border-b-[3px] border-tinta bg-blanco">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
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

  return (
    <>
      <Link
        href="/perfil"
        title={`Mi perfil (${usuario.name ?? usuario.email})`}
        className="transition hover:-translate-y-0.5"
      >
        <AvatarEntrenador trainerKey={usuario.trainerKey} tamano="sm" />
        <span className="sr-only">Mi perfil</span>
      </Link>

      <BotonLink href="/eventos" variante="fantasma" tamano="sm">
        Mis eventos
      </BotonLink>
      <form action={cerrarSesionAccion}>
        <button
          type="submit"
          title={`Salir (${usuario.email})`}
          className="grid size-10 place-items-center rounded-full border-[3px] border-tinta bg-blanco text-tinta shadow-dura-sm transition hover:bg-rojo-claro hover:text-rojo active:translate-y-[3px] active:shadow-none"
        >
          <LogOut className="size-4" />
          <span className="sr-only">Salir</span>
        </button>
      </form>
    </>
  );
}
