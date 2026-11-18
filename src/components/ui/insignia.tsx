import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Tono = "listo" | "espera" | "info" | "alerta";

const tonos: Record<Tono, string> = {
  listo: "bg-verde-claro text-verde-oscuro",
  espera: "bg-amarillo-claro text-tinta",
  info: "bg-azul-claro text-azul-oscuro",
  alerta: "bg-rojo-claro text-rojo-oscuro",
};

export function Insignia({
  tono = "info",
  className,
  ...props
}: ComponentProps<"span"> & { tono?: Tono }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border-2 border-tinta px-2.5 py-0.5 text-xs font-extrabold",
        tonos[tono],
        className,
      )}
      {...props}
    />
  );
}
