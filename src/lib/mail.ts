import "server-only";

import { Resend } from "resend";

type Correo = { to: string; subject: string; html: string; text: string };

/**
 * Manda el correo con Resend. Si no hay RESEND_API_KEY (desarrollo),
 * lo escribe en la consola del servidor y avisa que no se envio.
 */
export async function enviarCorreo(correo: Correo) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Secret Delibird <onboarding@resend.dev>";

  if (!key) {
    console.log(
      [
        "",
        "=== CORREO (modo desarrollo, sin RESEND_API_KEY) ===",
        `Para:   ${correo.to}`,
        `Asunto: ${correo.subject}`,
        "",
        correo.text,
        "===",
        "",
      ].join("\n"),
    );
    return { enviado: false as const, motivo: "sin-api-key" as const };
  }

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: correo.to,
      subject: correo.subject,
      html: correo.html,
      text: correo.text,
    });
    if (error) {
      console.error("Resend fallo:", error);
      return { enviado: false as const, motivo: error.message };
    }
    return { enviado: true as const };
  } catch (e) {
    console.error("Resend fallo:", e);
    return { enviado: false as const, motivo: "excepcion" as const };
  }
}

const ROJO = "#d7263d";
const VERDE = "#0f5132";
const CREMA = "#fff8ec";

function cascaron(titulo: string, cuerpo: string) {
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:${CREMA};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b2430">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:2px solid ${VERDE};border-radius:16px;overflow:hidden">
    <tr><td style="background:${VERDE};padding:18px 24px;color:#ffffff;font-size:18px;font-weight:700">
      Secret Delibird
    </td></tr>
    <tr><td style="padding:24px">
      <h1 style="margin:0 0 12px;font-size:22px;color:${ROJO}">${titulo}</h1>
      ${cuerpo}
    </td></tr>
    <tr><td style="padding:16px 24px;background:${CREMA};font-size:12px;color:#6b7280">
      Intercambio de regalos estilo Pokémon. Si no esperabas este correo, ignóralo.
    </td></tr>
  </table>
</body></html>`;
}

function botón(url: string, texto: string) {
  return `<p style="margin:24px 0"><a href="${url}" style="background:${ROJO};color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;display:inline-block">${texto}</a></p>`;
}

export function plantillaMagicLink(url: string, minutos: number) {
  const html = cascaron(
    "Tu acceso llegó volando",
    `<p>Delibird te trae tu enlace de acceso. Vence en ${minutos} minutos y solo sirve una vez.</p>
     ${botón(url, "Entrar a Secret Delibird")}
     <p style="font-size:12px;color:#6b7280;word-break:break-all">O pega esta dirección en tu navegador:<br>${url}</p>`,
  );
  const text = `Tu enlace de acceso a Secret Delibird (vence en ${minutos} minutos, un solo uso):\n\n${url}\n`;
  return { subject: "Tu acceso a Secret Delibird", html, text };
}

export function plantillaInvitacion(opciones: {
  evento: string;
  anfitrion: string;
  url: string;
  fecha: string | null;
  lugar: string | null;
  presupuesto: string | null;
  mensaje: string | null;
}) {
  const datos = [
    opciones.fecha ? `<li><strong>Cuándo:</strong> ${opciones.fecha}</li>` : "",
    opciones.lugar ? `<li><strong>Dónde:</strong> ${opciones.lugar}</li>` : "",
    opciones.presupuesto
      ? `<li><strong>Presupuesto sugerido:</strong> ${opciones.presupuesto}</li>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const html = cascaron(
    `Te invitaron a ${opciones.evento}`,
    `<p>${opciones.anfitrion} te invitó a su intercambio de regalos.</p>
     ${datos ? `<ul style="padding-left:18px;line-height:1.7">${datos}</ul>` : ""}
     ${opciones.mensaje ? `<p style="background:${CREMA};padding:12px;border-radius:12px">${opciones.mensaje}</p>` : ""}
     <p>Entra para armar tu lista de deseos: pega links de lo que te gustaría y quien te regale va a ver las fotos.</p>
     ${botón(opciones.url, "Armar mi lista de deseos")}
     <p style="font-size:12px;color:#6b7280">El enlace es tuyo y vence en un rato. Si caduca, pide otro desde la página.</p>`,
  );

  const text = `${opciones.anfitrion} te invitó a "${opciones.evento}" en Secret Delibird.
${opciones.fecha ? `Cuándo: ${opciones.fecha}\n` : ""}${opciones.lugar ? `Dónde: ${opciones.lugar}\n` : ""}${opciones.presupuesto ? `Presupuesto: ${opciones.presupuesto}\n` : ""}
Entra aquí para armar tu lista de deseos:
${opciones.url}
`;

  return { subject: `Te invitaron a ${opciones.evento}`, html, text };
}
