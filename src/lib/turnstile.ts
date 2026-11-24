import "server-only";

/**
 * El captcha de Cloudflare en la pantalla de entrar.
 *
 * Está ahí por una razón concreta: cada enlace que alguien pide es un correo
 * que sale y se paga, y con la app abierta al público un script puede teclear
 * direcciones ajenas todo el día. Los topes de `limite-acceso.ts` frenan el
 * volumen; esto frena que sea automático.
 */

const VERIFICAR = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Lo que esperamos a Cloudflare antes de seguir sin él. */
const ESPERA_MS = 10_000;

/**
 * La llave pública del widget. Puede ir al navegador sin problema: lo que no
 * sale de aquí es el secreto.
 */
export function claveTurnstile() {
  return process.env.TURNSTILE_SITE_KEY?.trim() || null;
}

/**
 * Las dos llaves o ninguna. Con media configuración el widget pediría algo que
 * el servidor no sabe revisar, o el servidor exigiría algo que nadie pintó.
 */
export function turnstilePrendido() {
  return !!claveTurnstile() && !!process.env.TURNSTILE_SECRET_KEY?.trim();
}

/**
 * ¿Pasó el captcha?
 *
 * Sin llaves contesta que sí, que es como corre en local y como corría la app
 * antes de esto.
 *
 * **Si Cloudflare no contesta, deja pasar.** Es a propósito y es la lección que
 * dejó la caída de Plunk: un servicio de terceros caído no tiene por qué dejar
 * a nadie sin poder entrar a su intercambio. Lo que se pierde en esos minutos
 * es la protección contra automatización, no los topes por correo y por IP, que
 * viven en nuestra base y siguen en pie. Un rechazo explícito de Cloudflare sí
 * se respeta: eso no es una caída, es un no.
 */
export async function pasoElCaptcha(token: string | null, ip: string | null) {
  if (!turnstilePrendido()) return true;

  // Sin token no hay nada que revisar: o no se pintó el widget, o alguien está
  // mandando el formulario sin pasar por la pantalla.
  if (!token) return false;

  try {
    const cuerpo = new FormData();
    cuerpo.append("secret", process.env.TURNSTILE_SECRET_KEY!.trim());
    cuerpo.append("response", token);
    if (ip) cuerpo.append("remoteip", ip);

    const respuesta = await fetch(VERIFICAR, {
      method: "POST",
      body: cuerpo,
      signal: AbortSignal.timeout(ESPERA_MS),
    });

    if (!respuesta.ok) {
      console.error("Turnstile contestó", respuesta.status, "— se deja pasar");
      return true;
    }

    const json = (await respuesta.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (!json.success) {
      console.warn("Turnstile rechazó:", json["error-codes"]?.join(", "));
    }

    return json.success === true;
  } catch (e) {
    console.error("Turnstile no contestó, se deja pasar:", e);
    return true;
  }
}
