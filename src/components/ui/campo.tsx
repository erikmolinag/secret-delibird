import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const claseInput =
  "w-full rounded-2xl border-[3px] border-tinta bg-blanco px-4 py-2.5 font-semibold text-tinta " +
  "placeholder:font-normal placeholder:text-gris/70 transition " +
  "focus:border-azul focus:bg-azul-claro/30 disabled:opacity-60";

export function Campo({
  etiqueta,
  pista,
  children,
  htmlFor,
}: {
  etiqueta: string;
  pista?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block font-display text-sm font-extrabold uppercase tracking-wide text-azul-oscuro"
      >
        {etiqueta}
      </label>
      {children}
      {pista ? <p className="text-xs text-gris">{pista}</p> : null}
    </div>
  );
}

export function Entrada({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(claseInput, className)} {...props} />;
}

export function AreaTexto({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(claseInput, "min-h-24", className)} {...props} />;
}
