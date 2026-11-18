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
          "grid place-items-center rounded-full border-2 border-nieve/80 bg-rojo shadow-brillo transition group-hover:rotate-6",
          tamano === "lg" ? "size-14" : "size-10",
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
          tamano === "lg" ? "text-3xl" : "text-xl",
        )}
      >
        <span className="text-nieve">Secret </span>
        <span className="text-dorado">Delibird</span>
      </span>
    </Link>
  );
}
