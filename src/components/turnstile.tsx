"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Opciones = {
  sitekey: string;
  language?: string;
  theme?: "light" | "dark" | "auto";
  "refresh-expired"?: "auto" | "manual" | "never";
};

declare global {
  interface Window {
    turnstile?: {
      render: (donde: HTMLElement, opciones: Opciones) => string | undefined;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

/**
 * El captcha de Cloudflare en la pantalla de entrar.
 *
 * El widget mete un campo escondido (`cf-turnstile-response`) dentro del
 * formulario, y como el `FormData` se arma del formulario de verdad y no del
 * árbol de React, el token llega solo a la server action.
 *
 * Se pinta a mano (`render=explicit`) y no dejando que el script busque divs,
 * porque hace falta poder **reiniciarlo**: un token sirve una sola vez, así que
 * si el intento falla —el correo estaba mal escrito, el tope lo frenó— el que
 * quedó en el formulario ya no vale y el siguiente intento sería rechazado sin
 * que la persona entienda por qué.
 */
export function Turnstile({
  clave,
  intentos,
}: {
  clave: string;
  /** Sube con cada intento fallido; cada cambio pide un token nuevo. */
  intentos: number;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!listo || !caja.current || widget.current) return;

    widget.current =
      window.turnstile?.render(caja.current, {
        sitekey: clave,
        language: "es",
        "refresh-expired": "auto",
      }) ?? null;
  }, [listo, clave]);

  useEffect(() => {
    if (intentos > 0 && widget.current) window.turnstile?.reset(widget.current);
  }, [intentos]);

  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setListo(true)}
      />
      <div ref={caja} />
    </div>
  );
}
