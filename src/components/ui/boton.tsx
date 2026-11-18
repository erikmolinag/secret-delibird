import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Variante = "primario" | "secundario" | "fantasma" | "peligro";
type Tamano = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-display font-bold transition " +
  "disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px";

const variantes: Record<Variante, string> = {
  primario:
    "bg-rojo text-nieve shadow-[0_8px_0_-2px_var(--color-rojo-oscuro)] hover:bg-rojo/90",
  secundario:
    "bg-pino text-nieve shadow-[0_8px_0_-2px_#0a3a24] hover:bg-pino-claro",
  fantasma:
    "border border-noche-borde bg-noche-suave/70 text-nieve hover:border-hielo/60 hover:bg-noche-suave",
  peligro:
    "border border-rojo/50 bg-transparent text-rojo hover:bg-rojo/10",
};

const tamanos: Record<Tamano, string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
};

export function clasesBoton(variante: Variante = "primario", tamano: Tamano = "md") {
  return cn(base, variantes[variante], tamanos[tamano]);
}

export function Boton({
  variante = "primario",
  tamano = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante; tamano?: Tamano }) {
  return <button className={cn(clasesBoton(variante, tamano), className)} {...props} />;
}

export function BotonLink({
  variante = "primario",
  tamano = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante; tamano?: Tamano }) {
  return <Link className={cn(clasesBoton(variante, tamano), className)} {...props} />;
}
