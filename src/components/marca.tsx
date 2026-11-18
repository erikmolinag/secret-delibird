import Link from "next/link";

import { DELIBIRD_ID, spritePokemon } from "@/lib/pokemon";
import { cn } from "@/lib/utils";

export function Marca({
  className,
  tamano = "md",
}: {
  className?: string;
  tamano?: "md" | "lg";
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full border-[3px] border-tinta bg-blanco shadow-dura-sm transition group-hover:-rotate-6",
          tamano === "lg" ? "size-16" : "size-11",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spritePokemon(DELIBIRD_ID)}
          alt="Delibird"
          className="size-[88%] object-contain [image-rendering:pixelated]"
          referrerPolicy="no-referrer"
        />
      </span>

      <span
        className={cn(
          "font-display font-extrabold leading-none",
          tamano === "lg" ? "text-4xl" : "text-2xl",
        )}
      >
        <span className="text-azul-oscuro">Secret </span>
        <span className={tamano === "lg" ? "texto-logo" : "texto-logo-sm"}>
          Delibird
        </span>
      </span>
    </Link>
  );
}
