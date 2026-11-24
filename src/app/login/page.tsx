import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FormularioAcceso } from "@/components/formulario-acceso";
import { Tarjeta, TarjetaCuerpo } from "@/components/ui/tarjeta";
import { usuarioActual } from "@/lib/auth";
import { DELIBIRD_ID, spritePokemon } from "@/lib/pokemon";
import { claveTurnstile } from "@/lib/turnstile";

export const metadata: Metadata = { title: "Entrar" };

/** Depende de la sesión: se renderiza por peticion. */
export const instant = false;

const MOTIVOS: Record<string, string> = {
  invalido: "Ese enlace no es válido. Pide uno nuevo.",
  usado: "Ese enlace ya se usó. Pide uno nuevo.",
  vencido: "El enlace venció. Pide uno nuevo, es gratis.",
};

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const { redirectTo, error } = await searchParams;
  const usuario = await usuarioActual();

  if (usuario && !error) redirect(redirectTo ?? "/eventos");

  return (
    <div className="mx-auto max-w-md space-y-5 py-6">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spritePokemon(DELIBIRD_ID)}
          alt=""
          aria-hidden
          className="mx-auto size-24 [image-rendering:pixelated]"
        />
        <h1 className="text-3xl font-extrabold">Entra con tu correo</h1>
      </div>

      {error && MOTIVOS[error] ? (
        <p className="rounded-2xl border-[3px] border-tinta bg-amarillo-claro px-4 py-2.5 text-center text-sm text-rojo">
          {MOTIVOS[error]}
        </p>
      ) : null}

      <Tarjeta>
        <TarjetaCuerpo>
          <FormularioAcceso redirectTo={redirectTo} claveTurnstile={claveTurnstile()} />
        </TarjetaCuerpo>
      </Tarjeta>
    </div>
  );
}
