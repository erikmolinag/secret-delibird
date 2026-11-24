"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { cerrarSesion } from "@/lib/auth";
import {
  barrerEnlacesViejos,
  ipDelVisitante,
  mensajeDeLimite,
  revisarLimiteAcceso,
} from "@/lib/limite-acceso";
import { VIGENCIA_MINUTOS, crearMagicLink } from "@/lib/magic-link";
import { enviarCorreo, plantillaMagicLink } from "@/lib/mail";
import { pasoElCaptcha } from "@/lib/turnstile";
import { normalizarEmail } from "@/lib/utils";

export type EstadoAcceso = {
  ok?: boolean;
  error?: string;
  email?: string;
  /**
   * Sube con cada intento fallido. El captcha lo necesita: un token sirve una
   * sola vez, así que cada vez que esto crece hay que pedir uno nuevo.
   */
  intentos?: number;
  /** Solo en desarrollo: el enlace que hubieramos enviado por correo. */
  enlaceDev?: string;
};

const esquemaEmail = z.email();

export async function solicitarAccesoAccion(
  previo: EstadoAcceso,
  datos: FormData,
): Promise<EstadoAcceso> {
  const falla = (error: string): EstadoAcceso => ({
    error,
    intentos: (previo.intentos ?? 0) + 1,
  });

  const email = normalizarEmail(datos.get("email"));
  const destino = datos.get("redirectTo");
  const redirectTo =
    typeof destino === "string" && destino.startsWith("/") ? destino : null;

  if (!esquemaEmail.safeParse(email).success) {
    return falla("Ese correo no se ve bien. Revísalo e intenta otra vez.");
  }

  // Antes que nada de la base: si esto es un script, que se vaya aquí.
  const prueba = datos.get("cf-turnstile-response");
  const paso = await pasoElCaptcha(
    typeof prueba === "string" && prueba ? prueba : null,
    await ipDelVisitante(),
  );

  if (!paso) {
    return falla(
      "No pudimos comprobar que eres una persona. Recarga la página e intenta otra vez.",
    );
  }

  const limite = await revisarLimiteAcceso(email);
  if (!limite.permitido) {
    return falla(mensajeDeLimite(limite) ?? "Espera un momento e intenta otra vez.");
  }

  const url = await crearMagicLink(email, redirectTo);

  // De vez en cuando, no en cada acceso: no vale un DELETE por persona que
  // entra, pero la tabla tampoco debe crecer para siempre.
  if (Math.random() < 0.05) await barrerEnlacesViejos();

  const plantilla = plantillaMagicLink(url, VIGENCIA_MINUTOS);
  const envio = await enviarCorreo({ to: email, tipo: "acceso", ...plantilla });

  if (!envio.enviado && envio.motivo !== "sin-api-key") {
    // El proveedor falló (dominio, cuota, red). Decirlo, en vez de mandar a
    // la gente a revisar un buzón donde no va a llegar nada.
    return falla("No pudimos mandar el correo. Inténtalo otra vez en un momento.");
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
