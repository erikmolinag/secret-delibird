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

// Los mismos colores que la app (ver globals.css). Aquí van a mano porque un
// correo no carga hojas de estilo: todo tiene que ir en línea.
const TINTA = "#16304b";
const ROJO = "#ee1515";
const AMARILLO = "#ffcb05";
const AMARILLO_CLARO = "#ffeeab";
const CREMA = "#fff6e6";
const GRIS = "#5b7390";

const DELIBIRD =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/225.png";

function cascaron(titulo: string, cuerpo: string) {
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px 12px;background:${CREMA};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${TINTA}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:3px solid ${TINTA};border-radius:20px;overflow:hidden">
    <tr><td style="background:${TINTA};padding:14px 20px;font-size:19px;font-weight:800">
      <span style="color:#ffffff">Secret </span><span style="color:${AMARILLO}">Delibird</span>
    </td></tr>
    <tr><td style="height:7px;background:${ROJO};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="height:3px;background:${TINTA};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:22px 20px 26px">
      <img src="${DELIBIRD}" width="96" height="96" alt="" style="display:block;margin:0 0 6px">
      <h1 style="margin:0 0 14px;font-size:23px;line-height:1.2;color:${TINTA}">${titulo}</h1>
      ${cuerpo}
    </td></tr>
    <tr><td style="padding:14px 20px;background:${CREMA};border-top:3px solid ${TINTA};font-size:12px;color:${GRIS}">
      Intercambio de regalos estilo Pokémon. Si no esperabas este correo, ignóralo.
    </td></tr>
  </table>
</body></html>`;
}

function boton(url: string, texto: string) {
  return `<p style="margin:24px 0"><a href="${url}" style="background:${ROJO};color:#ffffff;text-decoration:none;padding:13px 24px;border:3px solid ${TINTA};border-radius:999px;font-weight:800;display:inline-block">${texto}</a></p>`;
}

export function plantillaMagicLink(url: string, minutos: number) {
  const html = cascaron(
    "Tu acceso llegó volando",
    `<p>Delibird te trae tu enlace de acceso. Vence en ${minutos} minutos y solo sirve una vez.</p>
     ${boton(url, "Entrar a Secret Delibird")}
     <p style="font-size:12px;color:${GRIS};word-break:break-all">O pega esta dirección en tu navegador:<br>${url}</p>`,
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
     ${opciones.mensaje ? `<p style="background:${AMARILLO_CLARO};border:2px solid ${TINTA};padding:12px 14px;border-radius:14px">${opciones.mensaje}</p>` : ""}
     <p>Entra para armar tu lista de deseos: pega links de lo que te gustaría y quien te regale va a ver las fotos.</p>
     ${boton(opciones.url, "Armar mi lista de deseos")}
     <p style="font-size:12px;color:${GRIS}">El enlace es tuyo y vence en un rato. Si caduca, pide otro desde la página.</p>`,
  );

  const text = `${opciones.anfitrion} te invitó a "${opciones.evento}" en Secret Delibird.
${opciones.fecha ? `Cuándo: ${opciones.fecha}\n` : ""}${opciones.lugar ? `Dónde: ${opciones.lugar}\n` : ""}${opciones.presupuesto ? `Presupuesto: ${opciones.presupuesto}\n` : ""}
Entra aquí para armar tu lista de deseos:
${opciones.url}
`;

  return { subject: `Te invitaron a ${opciones.evento}`, html, text };
}

export function plantillaSorteo(opciones: {
  evento: string;
  url: string;
  presupuesto: string | null;
  fecha: string | null;
}) {
  const html = cascaron(
    "Ya salió el sorteo",
    `<p>Delibird ya repartió los nombres de <strong>${opciones.evento}</strong>.</p>
     <p>Entra para ver a quién te tocó regalarle y qué trae en su lista de deseos. No te decimos aquí quién es, por si alguien va leyendo sobre tu hombro.</p>
     ${opciones.fecha ? `<p><strong>El intercambio es:</strong> ${opciones.fecha}</p>` : ""}
     ${opciones.presupuesto ? `<p><strong>Presupuesto sugerido:</strong> ${opciones.presupuesto}</p>` : ""}
     ${boton(opciones.url, "Ver a quién me tocó")}`,
  );

  const text = `Ya salió el sorteo de "${opciones.evento}".

Entra para ver a quién te tocó regalarle:
${opciones.url}
`;

  return { subject: `Ya salió el sorteo de ${opciones.evento}`, html, text };
}

export function plantillaListaActualizada(opciones: {
  evento: string;
  url: string;
}) {
  const html = cascaron(
    "Tu persona movió su lista",
    `<p>A quien le regalas en <strong>${opciones.evento}</strong> acaba de actualizar su lista de deseos.</p>
     <p>Buen momento para echarle un ojo antes de comprar.</p>
     ${boton(opciones.url, "Ver su lista")}`,
  );

  const text = `A quien le regalas en "${opciones.evento}" actualizó su lista de deseos.

Échale un ojo aquí:
${opciones.url}
`;

  return { subject: `Actualizaron la lista en ${opciones.evento}`, html, text };
}
