/**
 * El poquito de formato que entienden los textos del panel (aviso de
 * privacidad y términos).
 *
 * Es puro: entra una cadena y salen bloques. No arma HTML ni toca React, para
 * poder probarlo sin levantar nada, y sobre todo porque quien pinta esto no
 * debe recibir HTML nunca: son páginas públicas alimentadas por un campo de
 * texto, y `dangerouslySetInnerHTML` ahí es una puerta que no hace falta abrir.
 *
 * Lo que entiende:
 *   ## Título          (y ### para uno más chico)
 *   - viñeta
 *   **negritas**, *cursivas*, [texto](https://enlace)
 *   línea en blanco = párrafo nuevo
 */

export type Trozo =
  | { tipo: "texto"; texto: string }
  | { tipo: "negritas"; texto: string }
  | { tipo: "cursivas"; texto: string }
  | { tipo: "enlace"; texto: string; url: string };

export type Bloque =
  | { tipo: "titulo"; nivel: 2 | 3; trozos: Trozo[] }
  | { tipo: "parrafo"; trozos: Trozo[] }
  | { tipo: "lista"; puntos: Trozo[][] };

/**
 * Los `textarea` mandan los saltos de línea como `\r\n`, no como `\n`. Sin esto
 * la separación de párrafos no encuentra dos saltos seguidos —hay un `\r` en
 * medio— y el documento entero se vuelve un solo bloque. Pasó en producción: el
 * texto que no se tocaba se guardaba sin formato al guardar el otro.
 */
export function normalizarSaltos(texto: string) {
  return texto.replace(/\r\n?/g, "\n");
}

/** Solo enlaces de web. Un `javascript:` en una página pública, no. */
function urlSegura(url: string) {
  try {
    const liga = new URL(url);
    return liga.protocol === "http:" || liga.protocol === "https:";
  } catch {
    return false;
  }
}

const INLINE =
  /\*\*([^*]+)\*\*|\*([^*\n]+)\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/** Parte una línea en sus trozos con formato. Lo que no casa, queda como texto. */
export function partirInline(linea: string): Trozo[] {
  const trozos: Trozo[] = [];
  let desde = 0;

  for (const con of linea.matchAll(INLINE)) {
    const inicio = con.index;

    if (inicio > desde) {
      trozos.push({ tipo: "texto", texto: linea.slice(desde, inicio) });
    }

    const [entero, negritas, cursivas, textoEnlace, url] = con;

    if (negritas !== undefined) {
      trozos.push({ tipo: "negritas", texto: negritas });
    } else if (cursivas !== undefined) {
      trozos.push({ tipo: "cursivas", texto: cursivas });
    } else if (textoEnlace !== undefined && urlSegura(url)) {
      trozos.push({ tipo: "enlace", texto: textoEnlace, url });
    } else {
      // Un enlace con una dirección que no nos gusta se queda como estaba.
      trozos.push({ tipo: "texto", texto: entero });
    }

    desde = inicio + entero.length;
  }

  if (desde < linea.length) {
    trozos.push({ tipo: "texto", texto: linea.slice(desde) });
  }

  return trozos;
}

export function partirTextoRico(texto: string): Bloque[] {
  return normalizarSaltos(texto)
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((bloque): Bloque => {
      if (bloque.startsWith("### ")) {
        return { tipo: "titulo", nivel: 3, trozos: partirInline(bloque.slice(4).trim()) };
      }

      if (bloque.startsWith("## ")) {
        return { tipo: "titulo", nivel: 2, trozos: partirInline(bloque.slice(3).trim()) };
      }

      const lineas = bloque.split("\n").map((l) => l.trim());

      if (lineas.every((l) => l.startsWith("- "))) {
        return {
          tipo: "lista",
          puntos: lineas.map((l) => partirInline(l.slice(2))),
        };
      }

      // Un párrafo partido en varias líneas se vuelve a juntar: los saltos
      // sueltos son de quien escribió, no del texto.
      return { tipo: "parrafo", trozos: partirInline(lineas.join(" ")) };
    });
}
