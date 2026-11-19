import Link from "next/link";

import { Pokebola } from "@/components/adornos";
import { cn } from "@/lib/utils";

/**
 * La marca va siempre en un renglón: apilada se leía como dos palabras sueltas
 * y en el teléfono se perdía. En pantalla chica encoge, no se parte.
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
      className={cn("group inline-flex items-center gap-1.5 sm:gap-2.5", className)}
    >
      <Pokebola
        className={cn(
          "shrink-0 drop-shadow-[0_3px_0_#16304b] transition group-hover:-rotate-12",
          grande ? "size-12 sm:size-16" : "size-9 sm:size-11",
        )}
      />

      <span className="flex items-baseline gap-1.5 leading-none whitespace-nowrap">
        <span
          className={cn(
            "font-display font-extrabold text-azul-oscuro",
            grande ? "text-2xl sm:text-4xl" : "text-lg sm:text-2xl",
          )}
        >
          Secret
        </span>
        <span
          className={cn(
            "font-display font-extrabold",
            grande ? "texto-logo text-2xl sm:text-4xl" : "texto-logo-sm text-lg sm:text-2xl",
          )}
        >
          Delibird
        </span>
      </span>
    </Link>
  );
}
