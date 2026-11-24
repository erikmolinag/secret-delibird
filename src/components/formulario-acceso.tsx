"use client";

import { Mail } from "lucide-react";
import { useActionState } from "react";

import { solicitarAccesoAccion, type EstadoAcceso } from "@/actions/auth";
import { Turnstile } from "@/components/turnstile";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { Campo, Entrada } from "@/components/ui/campo";

const INICIAL: EstadoAcceso = {};

export function FormularioAcceso({
  redirectTo,
  claveTurnstile,
}: {
  redirectTo?: string;
  /** Null cuando no hay captcha configurado: en local, por ejemplo. */
  claveTurnstile: string | null;
}) {
  const [estado, accion] = useActionState(solicitarAccesoAccion, INICIAL);

  if (estado.ok) {
    return (
      <div className="space-y-4 text-center">
        <Mail className="mx-auto size-10 text-rojo" />
        <h2 className="text-2xl font-bold">Revisa tu correo</h2>
        <p className="text-sm text-gris">
          Delibird va en camino a <strong className="text-tinta">{estado.email}</strong>{" "}
          con tu enlace de acceso. Vence en 20 minutos y solo sirve una vez.
        </p>

        {estado.enlaceDev ? (
          <div className="rounded-2xl border-[3px] border-tinta bg-amarillo-claro p-4 text-left">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rojo">
              Modo desarrollo: no hay llave de correo
            </p>
            <a
              href={estado.enlaceDev}
              className="break-all text-sm text-azul underline underline-offset-2"
            >
              {estado.enlaceDev}
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-5">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      <Campo
        etiqueta="Tu correo"
        htmlFor="email"
        pista="Te mandamos un enlace de un clic. No hay contraseñas que recordar."
      >
        <Entrada
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="tu@correo.com"
        />
      </Campo>

      {claveTurnstile ? (
        <Turnstile clave={claveTurnstile} intentos={estado.intentos ?? 0} />
      ) : null}

      {estado.error ? (
        <p className="rounded-2xl border-[3px] border-tinta bg-rojo-claro px-4 py-2.5 text-sm text-rojo-oscuro">
          {estado.error}
        </p>
      ) : null}

      <BotonEnvio className="w-full" cargando="Enviando a Delibird...">
        Mandarme el enlace
      </BotonEnvio>
    </form>
  );
}
