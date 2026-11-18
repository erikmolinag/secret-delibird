import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Tarjeta({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-noche-borde/80 bg-noche-suave/80 shadow-tarjeta backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function TarjetaEncabezado({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-noche-borde/70 px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

export function TarjetaCuerpo({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 py-5", className)} {...props} />;
}

export function TituloSeccion({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-lg font-bold text-nieve sm:text-xl", className)}
      {...props}
    />
  );
}
