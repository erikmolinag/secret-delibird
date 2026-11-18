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
          tamano === "lg" ? "size-16" : "size-11",
        )}
      />

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
