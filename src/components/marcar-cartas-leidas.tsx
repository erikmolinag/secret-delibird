"use client";

import { useEffect } from "react";

import { marcarCartasLeidasAccion } from "@/actions/cartas";

/**
 * No pinta nada: solo avisa que ya viste el buzón. Va aquí y no en la página
 * porque escribir mientras se renderiza en el servidor no se puede, y porque
 * así la marca ocurre cuando la pantalla de verdad llegó a tus ojos.
 */
export function MarcarCartasLeidas({ participantId }: { participantId: string }) {
  useEffect(() => {
    marcarCartasLeidasAccion(participantId);
  }, [participantId]);

  return null;
}
