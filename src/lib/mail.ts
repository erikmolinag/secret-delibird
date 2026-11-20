import "server-only";

import { Resend } from "resend";

import { enlaceCalendario, enlaceMapa } from "./enlaces.ts";

type Correo = { to: string; subject: string; html: string; text: string };
type Resultado = { enviado: true } | { enviado: false; motivo: string };

/**
 * La API de Plunk. La v1 vieja (api.useplunk.com) contesta 410: se movieron a
 * next-api. Con PLUNK_API_URL se puede apuntar a otro lado sin tocar código.
 */
const PLUNK_URL =
  process.env.PLUNK_API_URL || "https://next-api.useplunk.com/v1/send";

/** Cuánto esperamos a que conteste el proveedor antes de rendirnos. */
const ESPERA_MS = 15_000;

/** Parte "Secret Delibird <delibird@algo.com>" en nombre y dirección. */
function partirRemitente(remitente: string) {
  const con = remitente.match(/^(.*?)<([^>]+)>$/);
  if (con) return { nombre: con[1].trim() || null, direccion: con[2].trim() };
  return { nombre: null, direccion: remitente.trim() };
}

/**
 * Manda el correo. Usa Plunk si hay PLUNK_API_KEY y si no cae a Resend: así se
 * puede cambiar de proveedor —o regresarse— nomás moviendo variables en Vercel,
 * sin volver a desplegar. Sin ninguna de las dos llaves, que es como corre en
 * desarrollo, lo escribe en la consola y avisa que no se envió.
 */
export async function enviarCorreo(correo: Correo): Promise<Resultado> {
  const plunk = process.env.PLUNK_API_KEY;
  const resend = process.env.RESEND_API_KEY;
  const remitente = process.env.EMAIL_FROM?.trim() || null;

  if (!plunk && !resend) {
    console.log(`
=== CORREO (modo desarrollo, sin llave de correo) ===
Para:   ${correo.to}
Asunto: ${correo.subject}

${correo.text}
===
`);
    return { enviado: false, motivo: "sin-api-key" };
  }

  if (plunk) return conPlunk(plunk, remitente, correo);
  return conResend(resend as string, remitente, correo);
}

async function conPlunk(
  llave: string,
  remitente: string | null,
  correo: Correo,
): Promise<Resultado> {
  // Plunk manda un solo cuerpo (HTML): no tiene campo aparte para el texto.
  const cuerpo: Record<string, unknown> = {
    to: correo.to,
    subject: correo.subject,
    body: correo.html,
    // Transaccional: esto no mete a nadie a las listas de marketing.
    subscribed: false,
  };

  // Sin EMAIL_FROM, Plunk usa el remitente que tenga configurado el proyecto.
  if (remitente) {
    const { nombre, direccion } = partirRemitente(remitente);
    cuerpo.from = direccion;
    if (nombre) cuerpo.name = nombre;
  }

  try {
    const respuesta = await fetch(PLUNK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(ESPERA_MS),
    });

    if (respuesta.ok) return { enviado: true };

    // Los errores vienen como { error: { message, code } }; si no, el texto.
    const crudo = await respuesta.text();
    let motivo = String(respuesta.status);
    try {
      const json = JSON.parse(crudo) as {
        error?: { message?: string; code?: string };
      };
      motivo = json.error?.message ?? json.error?.code ?? motivo;
    } catch {
      motivo = crudo.slice(0, 200) || motivo;
    }

    console.error("Plunk fallo:", respuesta.status, motivo);
    return { enviado: false, motivo };
  } catch (e) {
    console.error("Plunk fallo:", e);
    return { enviado: false, motivo: "excepcion" };
  }
}

async function conResend(
  llave: string,
  remitente: string | null,
  correo: Correo,
): Promise<Resultado> {
  try {
    const cliente = new Resend(llave);
    const { error } = await cliente.emails.send({
      from: remitente ?? "Secret Delibird <onboarding@resend.dev>",
      to: correo.to,
      subject: correo.subject,
      html: correo.html,
      text: correo.text,
    });
    if (error) {
      console.error("Resend fallo:", error);
      return { enviado: false, motivo: error.message };
    }
    return { enviado: true };
  } catch (e) {
    console.error("Resend fallo:", e);
    return { enviado: false, motivo: "excepcion" };
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
const AZUL = "#2a75bb";

/**
 * El dibujo del encabezado. Se sirve desde el sitio y no desde GitHub, y con la
 * dirección escrita completa a propósito: `urlBase()` apunta a localhost cuando
 * el correo se arma desde la máquina, y la vista previa saldría sin imagen.
 *
 * El archivo ya viene recortado, puesto sobre el crema del encabezado (hay
 * clientes que pintan de negro la transparencia) y al doble del tamaño en que
 * se muestra, para que no se vea borroso en pantallas retina.
 */
const DELIBIRD = "https://delibird.app/delibird-correo.png";

/**
 * Todo lo que escribió una persona (nombre del evento, recado, lugar) pasa por
 * aquí antes de entrar al HTML del correo. Sin esto, un evento llamado
 * "Posada <b>" deja el correo chueco, y un nombre con comillas se sale del
 * atributo href y puede meter cualquier cosa.
 */
function escapar(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cascaron(titulo: string, cuerpo: string) {
  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px 12px;background:${CREMA};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${TINTA}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:3px solid ${TINTA};border-radius:20px;overflow:hidden">
    <tr><td align="center" style="background:${CREMA};padding:18px 20px 10px">
      <img src="${DELIBIRD}" width="166" height="150" alt="Delibird" style="display:block;border:0">
    </td></tr>
    <tr><td style="height:3px;background:${TINTA};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="background:${TINTA};padding:14px 20px;font-size:19px;font-weight:800">
      <span style="color:#ffffff">Secret </span><span style="color:${AMARILLO}">Delibird</span>
    </td></tr>
    <tr><td style="height:7px;background:${ROJO};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="height:3px;background:${TINTA};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:22px 20px 26px">
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
  return `<a href="${url}" style="background:${ROJO};color:#ffffff;text-decoration:none;padding:13px 24px;border:3px solid ${TINTA};border-radius:999px;font-weight:800;display:inline-block;margin:0 8px 10px 0">${texto}</a>`;
}

/** Botón secundario: mismo peso visual, menos grito. */
function botonSuave(url: string, texto: string) {
  return `<a href="${url}" style="background:#ffffff;color:${TINTA};text-decoration:none;padding:13px 24px;border:3px solid ${TINTA};border-radius:999px;font-weight:800;display:inline-block;margin:0 8px 10px 0">${texto}</a>`;
}

function botones(...html: string[]) {
  return `<p style="margin:22px 0 12px">${html.filter(Boolean).join("")}</p>`;
}

export function plantillaMagicLink(url: string, minutos: number) {
  const html = cascaron(
    "Tu acceso llegó volando",
    `<p>Delibird te trae tu enlace de acceso. Vence en ${minutos} minutos y solo sirve una vez.</p>
     ${botones(boton(url, "Entrar a Secret Delibird"))}
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
  inicio: Date | null;
  lugar: string | null;
  lugarUrl: string | null;
  presupuesto: string | null;
  mensaje: string | null;
}) {
  const mapa = enlaceMapa(opciones.lugar, opciones.lugarUrl);
  const calendario = enlaceCalendario({
    titulo: opciones.evento,
    inicio: opciones.inicio,
    lugar: opciones.lugar,
    detalles: [opciones.mensaje, `Tu lista de deseos: ${opciones.url}`]
      .filter(Boolean)
      .join("\n\n"),
  });

  // Todo lo que escribió quien organiza entra escapado; las ligas también, que
  // una comilla en el href se sale del atributo.
  const lugar = opciones.lugar ? escapar(opciones.lugar) : null;
  const lugarHtml = lugar
    ? mapa
      ? `<a href="${escapar(mapa)}" style="color:${AZUL};font-weight:700">${lugar}</a>`
      : lugar
    : null;

  const datos = [
    opciones.fecha ? `<li><strong>Cuándo:</strong> ${escapar(opciones.fecha)}</li>` : "",
    lugarHtml ? `<li><strong>Dónde:</strong> ${lugarHtml}</li>` : "",
    opciones.presupuesto
      ? `<li><strong>Presupuesto sugerido:</strong> ${escapar(opciones.presupuesto)}</li>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const html = cascaron(
    `Te invitaron a ${escapar(opciones.evento)}`,
    `<p>${escapar(opciones.anfitrion)} te invitó a su intercambio de regalos.</p>
     ${datos ? `<ul style="padding-left:18px;line-height:1.7">${datos}</ul>` : ""}
     ${opciones.mensaje ? `<p style="background:${AMARILLO_CLARO};border:2px solid ${TINTA};padding:12px 14px;border-radius:14px">${escapar(opciones.mensaje)}</p>` : ""}
     <p>Entra para armar tu lista de deseos: pega links de lo que te gustaría y quien te regale va a ver las fotos.</p>
     ${botones(
       boton(opciones.url, "Armar mi lista de deseos"),
       calendario ? botonSuave(calendario, "Agregar al calendario") : "",
     )}
     <p style="font-size:12px;color:${GRIS}">El enlace es tuyo y vence en un rato. Si caduca, pide otro desde la página.</p>`,
  );

  const text = `${opciones.anfitrion} te invitó a "${opciones.evento}" en Secret Delibird.
${opciones.fecha ? `Cuándo: ${opciones.fecha}\n` : ""}${opciones.lugar ? `Dónde: ${opciones.lugar}\n` : ""}${mapa ? `Cómo llegar: ${mapa}\n` : ""}${opciones.presupuesto ? `Presupuesto: ${opciones.presupuesto}\n` : ""}${calendario ? `Agregar al calendario: ${calendario}\n` : ""}
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
  inicio: Date | null;
  lugar: string | null;
  lugarUrl: string | null;
  /** Solo para quien nunca recibio invitacion: este es su primer correo. */
  mensaje?: string | null;
}) {
  const mapa = enlaceMapa(opciones.lugar, opciones.lugarUrl);
  const calendario = enlaceCalendario({
    titulo: opciones.evento,
    inicio: opciones.inicio,
    lugar: opciones.lugar,
    detalles: `A quién te tocó: ${opciones.url}`,
  });

  const html = cascaron(
    "Ya salió el sorteo",
    `<p>Delibird ya repartió los nombres de <strong>${escapar(opciones.evento)}</strong>.</p>
     ${opciones.mensaje ? `<p style="background:${AMARILLO_CLARO};border:2px solid ${TINTA};padding:12px 14px;border-radius:14px">${escapar(opciones.mensaje)}</p>` : ""}
     <p>Entra para ver a quién te tocó regalarle y qué trae en su lista de deseos. No te decimos aquí quién es, por si alguien va leyendo sobre tu hombro.</p>
     ${opciones.fecha ? `<p><strong>El intercambio es:</strong> ${escapar(opciones.fecha)}</p>` : ""}
     ${opciones.lugar ? `<p><strong>Dónde:</strong> ${mapa ? `<a href="${escapar(mapa)}" style="color:${AZUL};font-weight:700">${escapar(opciones.lugar)}</a>` : escapar(opciones.lugar)}</p>` : ""}
     ${opciones.presupuesto ? `<p><strong>Presupuesto sugerido:</strong> ${escapar(opciones.presupuesto)}</p>` : ""}
     ${botones(
       boton(opciones.url, "Ver a quién me tocó"),
       calendario ? botonSuave(calendario, "Agregar al calendario") : "",
     )}`,
  );

  const text = `Ya salió el sorteo de "${opciones.evento}".
${opciones.mensaje ? `
${opciones.mensaje}
` : ""}
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
    `<p>A quien le regalas en <strong>${escapar(opciones.evento)}</strong> acaba de actualizar su lista de deseos.</p>
     <p>Buen momento para echarle un ojo antes de comprar.</p>
     ${botones(boton(opciones.url, "Ver su lista"))}`,
  );

  const text = `A quien le regalas en "${opciones.evento}" actualizó su lista de deseos.

Échale un ojo aquí:
${opciones.url}
`;

  return { subject: `Actualizaron la lista en ${opciones.evento}`, html, text };
}

/**
 * El aviso de que te llegó una carta. A propósito NO trae el texto: la idea es
 * que entres a leerla, y así tampoco queda la carta dando vueltas en un buzón
 * que puede andar abierto en cualquier pantalla. Tampoco dice de quién es.
 */
export function plantillaCarta(opciones: { evento: string; url: string }) {
  const evento = escapar(opciones.evento);

  const html = cascaron(
    "Tienes una carta",
    `<p>Alguien te escribió en <strong>${evento}</strong>.</p>
     <p>No te decimos quién: es tu Santa secreto. Entra a leerla.</p>
     ${botones(boton(opciones.url, "Leer mi carta"))}
     <p style="font-size:12px;color:${GRIS}">No se puede contestar. Si quieres escribir tú, es a quien te tocó regalarle.</p>`,
  );

  const text = `Alguien te escribió una carta en "${opciones.evento}". No te decimos quién: es tu Santa secreto.

Entra a leerla:
${opciones.url}
`;

  return { subject: `Tienes una carta en ${opciones.evento}`, html, text };
}
