import { Fragment } from "react";

import { partirTextoRico, type Trozo } from "@/lib/texto-rico";

/**
 * Pinta los textos legales que se escriben desde `/admin`.
 *
 * El formato lo entiende `src/lib/texto-rico.ts`, que es puro y tiene pruebas.
 * Aquí solo se convierte en elementos: **nunca** se arma HTML a partir del
 * texto. Son páginas públicas alimentadas por un campo de texto, y aunque hoy
 * solo el admin escriba ahí, `dangerouslySetInnerHTML` es una puerta que no
 * hace falta abrir.
 */
export function TextoLegal({ texto }: { texto: string }) {
  const bloques = partirTextoRico(texto);

  return (
    <div className="space-y-4">
      {bloques.map((bloque, i) => {
        if (bloque.tipo === "titulo") {
          const Etiqueta = bloque.nivel === 2 ? "h2" : "h3";
          return (
            <Etiqueta
              key={i}
              className={
                bloque.nivel === 2
                  ? "pt-2 font-display text-xl font-extrabold"
                  : "pt-1 font-display text-base font-extrabold"
              }
            >
              <Trozos trozos={bloque.trozos} />
            </Etiqueta>
          );
        }

        if (bloque.tipo === "lista") {
          return (
            <ul key={i} className="list-disc space-y-1.5 ps-5">
              {bloque.puntos.map((punto, j) => (
                <li key={j} className="leading-relaxed">
                  <Trozos trozos={punto} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="leading-relaxed">
            <Trozos trozos={bloque.trozos} />
          </p>
        );
      })}
    </div>
  );
}

function Trozos({ trozos }: { trozos: Trozo[] }) {
  return trozos.map((trozo, i) => {
    if (trozo.tipo === "negritas") {
      return (
        <strong key={i} className="font-extrabold">
          {trozo.texto}
        </strong>
      );
    }

    if (trozo.tipo === "cursivas") {
      return <em key={i}>{trozo.texto}</em>;
    }

    if (trozo.tipo === "enlace") {
      return (
        <a
          key={i}
          href={trozo.url}
          target="_blank"
          rel="noreferrer nofollow"
          className="font-bold text-azul underline-offset-2 hover:underline"
        >
          {trozo.texto}
        </a>
      );
    }

    return <Fragment key={i}>{trozo.texto}</Fragment>;
  });
}
