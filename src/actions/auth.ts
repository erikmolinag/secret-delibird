"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { cerrarSesion } from "@/lib/auth";
import {
  anotarEnlacePorIp,
  mensajeDeLimite,
  revisarLimiteAcceso,
} from "@/lib/limite-acceso";
import { VIGENCIA_MINUTOS, crearMagicLink } from "@/lib/magic-link";
import { enviarCorreo, plantillaMagicLink } from "@/lib/mail";
import { normalizarEmail } from "@/lib/utils";

export type EstadoAcceso = {
  ok?: boolean;
  error?: string;
  email?: string;
  /** Solo en desarrollo: el enlace que hubieramos enviado por correo. */
  enlaceDev?: string;
};

const esquemaEmail = z.email();

export async function solicitarAccesoAccion(
  _anterior: EstadoAcceso,
  datos: FormData,
): Promise<EstadoAcceso> {
  const email = normalizarEmail(datos.get("email"));
  const destino = datos.get("redirectTo");
  const redirectTo =
    typeof destino === "string" && destino.startsWith("/") ? destino : null;

  if (!esquemaEmail.safeParse(email).success) {
    return { error: "Ese correo no se ve bien. Revísalo e intenta otra vez." };
  }

  const limite = await revisarLimiteAcceso(email);
  if (!limite.permitido) {
    return { error: mensajeDeLimite(limite) ?? undefined };
  }

  const url = await crearMagicLink(email, redirectTo);
  await anotarEnlacePorIp();

  const plantilla = plantillaMagicLink(url, VIGENCIA_MINUTOS);
  const envio = await enviarCorreo({ to: email, ...plantilla });

  if (!envio.enviado && envio.motivo !== "sin-api-key") {
    // El proveedor falló (dominio, cuota, red). Decirlo, en vez de mandar a
    // la gente a revisar un buzón donde no va a llegar nada.
    return {
      error: "No pudimos mandar el correo. Inténtalo otra vez en un momento.",
    };
  }

  return {
    ok: true,
    email,
    enlaceDev:
      !envio.enviado && process.env.NODE_ENV !== "production" ? url : undefined,
  };
}

export async function cerrarSesionAccion() {
  await cerrarSesion();
  redirect("/");
}
