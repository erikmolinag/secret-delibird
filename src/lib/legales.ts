import "server-only";

import { cache } from "react";

import { leerAjusteConFecha } from "@/lib/ajustes";

export const CLAVE_PRIVACIDAD = "aviso_privacidad";
export const CLAVE_TERMINOS = "terminos";

/**
 * Los textos legales viven en `settings` y se editan desde `/admin`. Aquí
 * están los de arranque: así las páginas dicen algo desde el primer día, en vez
 * de enseñar una hoja en blanco a quien venga a leer qué hacemos con su correo.
 *
 * Son un punto de partida genérico y honesto sobre lo que la app hace de
 * verdad. No son asesoría legal: si el intercambio deja de ser entre conocidos,
 * vale la pena que alguien que sepa los revise.
 *
 * Formato: `## ` para un título, `- ` para una viñeta, línea en blanco para
 * separar párrafos. No se interpreta HTML.
 */
export const PRIVACIDAD_POR_OMISION = `Secret Delibird es un proyecto personal para organizar intercambios de regalos. Este aviso explica qué datos guardamos, para qué, y cómo los borras.

## Qué guardamos

- Tu correo electrónico. Es con lo que entras: no hay contraseñas.
- El nombre con el que quieres que te vean y el entrenador que elegiste.
- Lo que escribes dentro de un intercambio: tu lista de deseos, las fotos que subes, las cartas que mandas y las notas de tus regalos.
- Una huella técnica de tu conexión cuando pides un enlace de acceso, para frenar a quien quiera usar la pantalla de entrada para mandar correos a terceros. No guardamos tu dirección IP: guardamos un valor derivado del que no se puede volver atrás, y se borra junto con el enlace.

## Para qué lo usamos

Para que puedas entrar, para organizar el intercambio y para avisarte por correo de lo que pasa en él: que te invitaron, que ya salió el sorteo, que tu amigo secreto movió su lista, que te llegó una carta.

No vendemos tus datos, no los compartimos con anunciantes y no te mandamos publicidad.

## Quién más los toca

Para que esto funcione usamos servicios de terceros, y tus datos pasan por ellos:

- El alojamiento del sitio y la base de datos.
- El servicio que entrega los correos.
- Las imágenes de Pokémon, que se piden a servicios públicos de la comunidad.

Cada uno tiene sus propias políticas y solo recibe lo necesario para su parte.

## Galletas (cookies)

Una sola, la de tu sesión, para no pedirte el enlace cada vez que abres la app. No usamos cookies de publicidad ni de seguimiento.

## Cuánto tiempo

Mientras tengas cuenta. Los enlaces de acceso se borran solos poco después de vencer.

## Cómo borras todo

Entra a tu perfil y usa "Borrar mi cuenta". Eso borra tu cuenta y te saca de los intercambios en los que estés, con tu lista, tus cartas y tus fotos. No se puede deshacer.

Si organizas un intercambio, primero tendrás que borrarlo: si no, se iría con tu cuenta el intercambio de los demás.

## Cambios

Si esto cambia, la fecha de abajo cambia con ello.`;

export const TERMINOS_POR_OMISION = `Secret Delibird es un proyecto personal y gratuito para organizar intercambios de regalos. Al usarlo, aceptas lo siguiente.

## El servicio

Se ofrece tal cual, sin garantía de que esté siempre disponible ni libre de errores. Es un proyecto personal, no una empresa: puede cambiar o dejar de existir.

Guarda lo que te importe por tu cuenta. No prometemos respaldos.

## Tu cuenta

Entras con tu correo, sin contraseña. Quien tenga acceso a tu buzón puede entrar a tu cuenta, así que cuídalo. Los enlaces que mandamos dentro de un correo duran treinta días y sirven varias veces: si reenvías uno, le estás dando entrada a tu cuenta a quien lo reciba.

Usa tu propio correo. Poner el de alguien más para que le lleguen enlaces que no pidió no está permitido.

## Lo que subes

Lo que escribes y las fotos que subes siguen siendo tuyas. Nos das permiso de mostrarlas dentro de tu intercambio, que es lo que hace falta para que la app sirva.

No subas nada ilegal, ofensivo ni que no tengas derecho a usar. Podemos quitar contenido o cerrar una cuenta que abuse del servicio, sin aviso.

## Los invitados que agregas

Si organizas un intercambio, tú agregas los correos de tus invitados y tú decides cuándo se les avisa. Hazlo solo con gente que espera que la invites.

## Enlaces de Amazon

Los enlaces de Amazon que aparecen en las listas pueden llevar un código de afiliado. Si alguien compra por ahí, el sitio puede recibir una comisión de Amazon, sin ningún costo extra para quien compra. El precio es el mismo que verías sin el código.

## Pokémon

Este es un proyecto de fans, sin afiliación, patrocinio ni aval de Nintendo, Creatures Inc., Game Freak ni The Pokémon Company. Los nombres e imágenes de Pokémon pertenecen a sus dueños.

## Responsabilidad

No nos hacemos responsables de regalos que no llegaron, sorpresas arruinadas, correos que acabaron en spam ni de lo que pase dentro de tu intercambio. Esto organiza la logística; lo demás es entre ustedes.

## Cambios

Si esto cambia, la fecha de abajo cambia con ello.`;

export type TextoLegalGuardado = {
  texto: string;
  /** Null mientras nadie lo haya editado desde el panel. */
  actualizado: Date | null;
  /** Si lo que se está viendo es el de arranque o uno escrito a mano. */
  propio: boolean;
};

/** El texto que toca enseñar: el guardado en el panel, o el de arranque. */
async function leerLegal(
  clave: string,
  porOmision: string,
): Promise<TextoLegalGuardado> {
  const guardado = await leerAjusteConFecha(clave);

  if (!guardado) return { texto: porOmision, actualizado: null, propio: false };
  return { texto: guardado.valor, actualizado: guardado.actualizado, propio: true };
}

export const avisoDePrivacidad = cache(() =>
  leerLegal(CLAVE_PRIVACIDAD, PRIVACIDAD_POR_OMISION),
);

export const terminos = cache(() => leerLegal(CLAVE_TERMINOS, TERMINOS_POR_OMISION));
