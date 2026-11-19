import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * La marca va siempre en un renglón: apilada se leía como dos palabras sueltas
 * y en el teléfono se perdía. En pantalla chica encoge, no se parte.
 *
 * El Delibird es más alto que ancho, así que se le manda la altura y el ancho
 * sale solo; si se le pusiera `size-*` como a la pokébola, saldría aplastado.
 * Y va sin la sombra dura: ya trae su propio contorno grueso, y la sombra le
 * rellenaba los huecos entre las plumas hasta volverlo una mancha.
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
      <Image
        src="/delibird.png"
        alt=""
        width={189}
        height={231}
        priority
        className={cn(
          "w-auto shrink-0 transition group-hover:-rotate-12",
          grande ? "h-16 sm:h-20" : "h-12 sm:h-14",
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
