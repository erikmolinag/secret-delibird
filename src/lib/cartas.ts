/**
 * Lo que saben de las cartas tanto el servidor como el navegador. Vive aparte
 * porque un archivo "use server" solo puede exportar funciones asíncronas, y el
 * formulario necesita este número para el contador.
 */

/** Una carta, no un testamento. Caben unas 200 palabras. */
export const LARGO_MAXIMO = 1200;
