"use server";

import { and, count, eq, gte, isNull } from "drizzle-orm";
import { refresh } from "next/cache";

import { db, schema } from "@/db";
import { requerirUsuario } from "@/lib/auth";
import { aQuienLeRegala, participanteDelUsuario } from "@/lib/datos";
import { crearMagicLink } from "@/lib/magic-link";
import { LARGO_MAXIMO } from "@/lib/cartas";
import { enviarCorreo, plantillaCarta } from "@/lib/mail";

const MINUTO = 60_000;
/** Dos cartas seguidas casi siempre son un doble clic. */
const ESPERA_MS = MINUTO;
/** Por día: cada carta puede ser un correo, y los correos se pagan. */
const TOPE_DIA = 8;

export type EstadoCarta = {
  ok?: boolean;
  error?: string;
  /** Cuántas van en esta sesión. Le sirve al formulario para empezar en blanco. */
  enviadas?: number;
};

function texto(datos: FormData, campo: string) {
  const valor = datos.get(campo);
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

/**
 * Manda una carta a la persona que te tocó en el sorteo. Es de ida nomás: quien
 * la recibe no sabe de quién es ni puede contestar, porque contestar sería
 * decirle a su Santa secreto que ya sabe quién es.
 *
 * Solo se le puede escribir a quien te tocó: el destinatario no viene del
 * formulario, se saca de la asignación. Así no hay forma de escribirle a otra
 * persona cambiando un campo escondido.
 */
export async function enviarCartaAccion(
  previo: EstadoCarta,
  datos: FormData,
): Promise<EstadoCarta> {
  const usuario = await requerirUsuario();

  // Cualquier "no se pudo" conserva la cuenta de enviadas: esa cuenta es la que
  // vuelve a montar la hoja en blanco, y si se perdiera, el texto que la persona
  // acaba de escribir se borraría justo cuando le decimos que no salió.
  const falla = (error: string): EstadoCarta => ({ error, enviadas: previo.enviadas });

  const participantId = texto(datos, "participantId");
  if (!participantId) return falla("Falta de dónde sale la carta.");

  const mio = await participanteDelUsuario(participantId, usuario);
  if (!mio) return falla("Esa no es tu ficha del intercambio.");

  const asignado = await aQuienLeRegala(participantId);
  if (!asignado) {
    return falla("Todavía no hay sorteo, así que no hay a quién escribirle.");
  }

  const cuerpo = texto(datos, "body");
  if (!cuerpo) return falla("La carta viene vacía.");
  if (cuerpo.length > LARGO_MAXIMO) {
    return falla(`La carta no puede pasar de ${LARGO_MAXIMO} caracteres.`);
  }

  const limite = await revisarLimite(participantId);
  if (limite) return falla(limite);

  // Antes de guardar: si ya tiene una carta sin abrir, ya le avisamos y no hace
  // falta otro correo. Cuando entre se va a encontrar las dos.
  const yaLeAvisamos = await tieneSinLeer(asignado.receptor.id);

  await db.insert(schema.letters).values({
    eventId: mio.evento.id,
    fromParticipantId: participantId,
    toParticipantId: asignado.receptor.id,
    body: cuerpo,
  });

  if (!yaLeAvisamos) {
    const url = await crearMagicLink(
      asignado.receptor.email,
      `/e/${asignado.receptor.id}`,
    );
    await enviarCorreo({
      to: asignado.receptor.email,
      ...plantillaCarta({ evento: mio.evento.name, url }),
    });
  }

  refresh();
  return { ok: true, enviadas: (previo.enviadas ?? 0) + 1 };
}

/** null si puede mandar; si no, el motivo ya escrito para enseñarlo. */
async function revisarLimite(participantId: string) {
  const ahora = Date.now();

  const [reciente] = await db
    .select({ creada: schema.letters.createdAt })
    .from(schema.letters)
    .where(
      and(
        eq(schema.letters.fromParticipantId, participantId),
        gte(schema.letters.createdAt, new Date(ahora - ESPERA_MS)),
      ),
    )
    .limit(1);

  if (reciente) {
    const segundos = Math.max(
      1,
      Math.ceil((ESPERA_MS - (ahora - reciente.creada.getTime())) / 1000),
    );
    return `Delibird apenas salió con la anterior. Espera ${segundos} segundo${segundos === 1 ? "" : "s"}.`;
  }

  const [hoy] = await db
    .select({ cuantas: count() })
    .from(schema.letters)
    .where(
      and(
        eq(schema.letters.fromParticipantId, participantId),
        gte(schema.letters.createdAt, new Date(ahora - 24 * 60 * MINUTO)),
      ),
    );

  if (Number(hoy?.cuantas ?? 0) >= TOPE_DIA) {
    return `Ya mandaste ${TOPE_DIA} cartas hoy. Guarda algo para mañana.`;
  }

  return null;
}

async function tieneSinLeer(participantId: string) {
  const [fila] = await db
    .select({ cuantas: count() })
    .from(schema.letters)
    .where(
      and(
        eq(schema.letters.toParticipantId, participantId),
        isNull(schema.letters.readAt),
      ),
    );
  return Number(fila?.cuantas ?? 0) > 0;
}

/**
 * Marca como leídas las cartas que le llegaron a esta persona. Lo dispara la
 * pantalla al abrirse, y a propósito no refresca: así las que llegaron nuevas
 * se quedan señaladas mientras las lees, y ya la próxima vez salen normales.
 */
export async function marcarCartasLeidasAccion(participantId: string) {
  const usuario = await requerirUsuario();

  const mio = await participanteDelUsuario(participantId, usuario);
  if (!mio) return;

  await db
    .update(schema.letters)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.letters.toParticipantId, participantId),
        isNull(schema.letters.readAt),
      ),
    );
}
