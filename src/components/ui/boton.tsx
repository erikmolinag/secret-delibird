import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Variante = "primario" | "secundario" | "azul" | "fantasma" | "peligro";
type Tamano = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-tinta " +
  "font-display font-extrabold shadow-dura-sm transition " +
  "hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

const variantes: Record<Variante, string> = {
  primario: "bg-rojo text-blanco hover:bg-rojo-oscuro",
  secundario: "bg-verde text-blanco hover:bg-verde-oscuro",
  azul: "bg-azul text-blanco hover:bg-azul-oscuro",
  fantasma: "bg-blanco text-tinta hover:bg-crema-2",
  peligro: "bg-blanco text-rojo hover:bg-rojo-claro",
};

const tamanos: Record<Tamano, string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3 text-lg",
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
