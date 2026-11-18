import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Tono = "listo" | "espera" | "info" | "alerta";

const tonos: Record<Tono, string> = {
  listo: "border-pino-claro/60 bg-pino/30 text-[#8ff0b5]",
  espera: "border-dorado/50 bg-dorado/15 text-dorado",
  info: "border-hielo/40 bg-hielo/10 text-hielo",
  alerta: "border-rojo/50 bg-rojo/15 text-[#ff9aa6]",
};

export function Insignia({
  tono = "info",
  className,
  ...props
}: ComponentProps<"span"> & { tono?: Tono }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
        tonos[tono],
        className,
      )}
      {...props}
    />
  );
}
