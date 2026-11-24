/**
 * Pinta los textos legales que se escriben desde `/admin`.
 *
 * Entiende lo mínimo para que un aviso se lea bien: `## ` es un título, `- ` es
 * una viñeta, y una línea en blanco separa párrafos. Nada más.
 *
 * **No interpreta HTML a propósito.** El texto lo escribe el admin, pero un
 * campo que acepta HTML en una página pública es una puerta que no hace falta
 * abrir: React pinta todo como texto y ya.
 */
export function TextoLegal({ texto }: { texto: string }) {
  const bloques = texto
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {bloques.map((bloque, i) => {
        if (bloque.startsWith("## ")) {
          return (
            <h2 key={i} className="pt-2 font-display text-xl font-extrabold">
              {bloque.slice(3).trim()}
            </h2>
          );
        }

        const lineas = bloque.split("\n").map((l) => l.trim());

        if (lineas.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 ps-5">
              {lineas.map((linea, j) => (
                <li key={j} className="leading-relaxed">
                  {linea.slice(2)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="leading-relaxed">
            {lineas.join(" ")}
          </p>
        );
      })}
    </div>
  );
}
