"use client";

import { useEffect } from "react";

import { Boton, BotonLink } from "@/components/ui/boton";
import { spritePokemon } from "@/lib/pokemon";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-5 py-10 text-center">
      <span className="mx-auto grid size-32 place-items-center rounded-full border-[3px] border-tinta bg-blanco shadow-dura">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spritePokemon(101)}
          alt=""
          aria-hidden
          className="size-[80%] object-contain [image-rendering:pixelated]"
          referrerPolicy="no-referrer"
        />
      </span>

      <h1 className="text-3xl font-extrabold">Esto explotó</h1>

      <p className="font-semibold text-gris">
        Algo se rompió de este lado. Vuelve a intentar; si sigue igual, revisa la
        consola del servidor.
      </p>

      {error.digest ? (
        <p className="font-mono text-xs text-gris">error {error.digest}</p>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        <Boton type="button" onClick={reset}>
          Intentar otra vez
        </Boton>
        <BotonLink href="/eventos" variante="fantasma">
          Ir a mis eventos
        </BotonLink>
      </div>
    </div>
  );
}
