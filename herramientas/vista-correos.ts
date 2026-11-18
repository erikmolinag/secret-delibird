/**
 * Escribe los cuatro correos a .correos/ para abrirlos en el navegador.
 * Se corre con `npm run mail:preview`, que necesita --conditions=react-server
 * porque mail.ts importa "server-only".
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  plantillaInvitacion,
  plantillaListaActualizada,
  plantillaMagicLink,
  plantillaSorteo,
} from "../src/lib/mail.ts";

// Dentro de public/ para poder abrirlos con el servidor de desarrollo.
const SALIDA = "public/correos";
const URL_FALSA = "http://localhost:3000/auth/verify?token=ejemplo-de-token";

const correos = {
  "1-acceso": plantillaMagicLink(URL_FALSA, 20),
  "2-invitacion": plantillaInvitacion({
    evento: "Posada de la familia Molina",
    anfitrion: "Erik",
    url: URL_FALSA,
    fecha: "miércoles, 24 de diciembre de 2025 · 8:00 p.m.",
    inicio: new Date("2025-12-25T02:00:00.000Z"),
    lugar: "Casa de la abuela, Coyoacán",
    lugarUrl: null,
    presupuesto: "$700",
    mensaje: "Traigan postre. El intercambio es después de la cena.",
  }),
  "3-sorteo": plantillaSorteo({
    evento: "Posada de la familia Molina",
    url: URL_FALSA,
    fecha: "miércoles, 24 de diciembre de 2025 · 8:00 p.m.",
    inicio: new Date("2025-12-25T02:00:00.000Z"),
    lugar: "Casa de la abuela, Coyoacán",
    lugarUrl: null,
    presupuesto: "$700",
  }),
  "4-lista-actualizada": plantillaListaActualizada({
    evento: "Posada de la familia Molina",
    url: URL_FALSA,
  }),
};

mkdirSync(SALIDA, { recursive: true });

for (const [nombre, correo] of Object.entries(correos)) {
  writeFileSync(join(SALIDA, `${nombre}.html`), correo.html, "utf8");
  writeFileSync(
    join(SALIDA, `${nombre}.txt`),
    `Asunto: ${correo.subject}\n\n${correo.text}`,
    "utf8",
  );
  console.log(`${nombre}  ·  ${correo.subject}`);
}

console.log(`\nListos en http://localhost:3000/correos/ (y en ${SALIDA}/)`);
