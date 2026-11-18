import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const claseInput =
  "w-full rounded-2xl border border-noche-borde bg-noche/70 px-4 py-2.5 text-nieve " +
  "placeholder:text-humo/60 transition focus:border-hielo focus:bg-noche " +
  "disabled:opacity-60";

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
        className="block text-sm font-bold text-hielo"
      >
        {etiqueta}
      </label>
      {children}
      {pista ? <p className="text-xs text-humo">{pista}</p> : null}
    </div>
  );
}

export function Entrada({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(claseInput, className)} {...props} />;
}

export function AreaTexto({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(claseInput, "min-h-24", className)} {...props} />;
}
