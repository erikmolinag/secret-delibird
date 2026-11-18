import Link from "next/link";

import { Pokebola } from "@/components/adornos";
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
      <Pokebola
        className={cn(
          "shrink-0 drop-shadow-[0_3px_0_#16304b] transition group-hover:-rotate-12",
          tamano === "lg" ? "size-14 sm:size-16" : "size-9 sm:size-11",
        )}
      />

      <span
        className={cn(
          "whitespace-nowrap font-display font-extrabold leading-none",
          tamano === "lg" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl",
        )}
      >
        {/* En pantallas chicas la marca es la pokebola + "Delibird" */}
        <span className="hidden text-azul-oscuro sm:inline">Secret </span>
        <span className={tamano === "lg" ? "texto-logo" : "texto-logo-sm"}>
          Delibird
        </span>
      </span>
    </Link>
  );
}
