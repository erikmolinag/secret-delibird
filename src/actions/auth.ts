"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { cerrarSesion } from "@/lib/auth";
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

  const url = await crearMagicLink(email, redirectTo);
  const plantilla = plantillaMagicLink(url, VIGENCIA_MINUTOS);
  const envio = await enviarCorreo({ to: email, ...plantilla });

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
