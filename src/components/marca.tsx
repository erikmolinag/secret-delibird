import Link from "next/link";

import { Pokebola } from "@/components/adornos";
import { cn } from "@/lib/utils";

/**
 * En el teléfono la marca se apila ("Secret" encima de "Delibird") para que
 * quepa completa sin encogerla. Los dos renglones van casi del mismo tamaño y
 * pegados, que es lo que hace que se lea como un logotipo y no como dos palabras.
 */
export function Marca({
  className,
  tamano = "md",
}: {
  className?: string;
  tamano?: "md" | "lg";
}) {
  const grande = tamano === "lg";

  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2 sm:gap-2.5", className)}
    >
      <Pokebola
        className={cn(
          "shrink-0 drop-shadow-[0_3px_0_#16304b] transition group-hover:-rotate-12",
          grande ? "size-16" : "size-12 sm:size-11",
        )}
      />

      <span className="flex flex-col leading-none sm:flex-row sm:items-baseline sm:gap-1.5">
        <span
          className={cn(
            "font-display font-extrabold text-azul-oscuro",
            grande
              ? "text-2xl tracking-[0.12em] sm:text-4xl sm:tracking-normal"
              : "text-base tracking-[0.1em] sm:text-2xl sm:tracking-normal",
          )}
        >
          Secret
        </span>
        <span
          className={cn(
            "font-display font-extrabold",
            grande
              ? "texto-logo text-4xl"
              : "texto-logo-sm text-lg sm:mt-0 sm:text-2xl",
          )}
        >
          Delibird
        </span>
      </span>
    </Link>
  );
}
