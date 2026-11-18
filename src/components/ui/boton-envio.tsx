"use client";

import { useFormStatus } from "react-dom";

import { Boton } from "@/components/ui/boton";

type Props = React.ComponentProps<typeof Boton> & { cargando?: string };

/** Boton de submit que se bloquea solo mientras corre la server action. */
export function BotonEnvio({ children, cargando, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? (cargando ?? "Un momento...") : children}
    </Boton>
  );
}
