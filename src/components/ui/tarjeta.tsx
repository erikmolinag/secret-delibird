import type { ComponentProps } from "react";

import { Pokebola } from "@/components/adornos";
import { cn } from "@/lib/utils";

export function Tarjeta({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border-[3px] border-tinta bg-blanco shadow-dura",
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
        "flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-tinta bg-crema-2 px-5 py-3.5",
        className,
      )}
      {...props}
    />
  );
}

export function TarjetaCuerpo({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 py-5", className)} {...props} />;
}

export function TituloSeccion({
  className,
  children,
  ...props
}: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "flex items-center gap-2 text-lg font-extrabold text-tinta sm:text-xl",
        className,
      )}
      {...props}
    >
      <Pokebola className="size-5 shrink-0" />
      {children}
    </h2>
  );
}
