"use client";

import { Bold, Heading, Italic, Link2, List } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { AreaTexto } from "@/components/ui/campo";

/**
 * Un campo de texto con cuatro botones de formato.
 *
 * No es un editor visual: lo que se guarda sigue siendo texto plano con sus
 * marcas (`**negritas**`, `## título`), que es lo que entiende
 * `src/lib/texto-rico.ts`. Los botones nada más escriben las marcas por ti,
 * para no tener que aprenderse la sintaxis ni acordarse de ella cada diciembre.
 */
export function EditorTexto({
  id,
  name,
  valor,
  alCambiar,
  filas = 14,
}: {
  id: string;
  name: string;
  valor: string;
  alCambiar: (nuevo: string) => void;
  filas?: number;
}) {
  const campo = useRef<HTMLTextAreaElement>(null);
  const pendiente = useRef<[number, number] | null>(null);

  /**
   * Devolver el cursor va aquí y no junto al cambio: mientras React no repinte,
   * el textarea todavía trae el texto viejo, y al repintarlo la selección se va
   * al final. Un `requestAnimationFrame` llegaba antes que el repintado; un
   * efecto corre después, que es cuando sirve.
   */
  useEffect(() => {
    const rango = pendiente.current;
    const el = campo.current;
    if (!rango || !el) return;

    pendiente.current = null;
    el.focus();
    el.setSelectionRange(rango[0], rango[1]);
  });

  /** Cambia el texto y apunta a dónde debe quedar el cursor después. */
  function aplicar(nuevo: string, inicio: number, fin: number) {
    pendiente.current = [inicio, fin];
    alCambiar(nuevo);
  }

  function envolver(marca: string, ejemplo: string) {
    const el = campo.current;
    if (!el) return;

    const { selectionStart: a, selectionEnd: b } = el;
    const dentro = valor.slice(a, b) || ejemplo;

    aplicar(
      valor.slice(0, a) + marca + dentro + marca + valor.slice(b),
      a + marca.length,
      a + marca.length + dentro.length,
    );
  }

  function enlazar() {
    const el = campo.current;
    if (!el) return;

    const { selectionStart: a, selectionEnd: b } = el;
    const dentro = valor.slice(a, b) || "texto del enlace";
    const url = "https://";

    // El cursor queda al final de https://, listo para escribir la dirección.
    const cursor = a + 1 + dentro.length + 2 + url.length;
    aplicar(
      `${valor.slice(0, a)}[${dentro}](${url})${valor.slice(b)}`,
      cursor,
      cursor,
    );
  }

  /** Mete (o quita) una marca al principio de la línea donde está el cursor. */
  function prefijar(marca: string) {
    const el = campo.current;
    if (!el) return;

    const a = el.selectionStart;
    const inicio = valor.lastIndexOf("\n", a - 1) + 1;
    const resto = valor.slice(inicio);

    if (resto.startsWith(marca)) {
      const cursor = Math.max(inicio, a - marca.length);
      aplicar(valor.slice(0, inicio) + resto.slice(marca.length), cursor, cursor);
      return;
    }

    aplicar(valor.slice(0, inicio) + marca + resto, a + marca.length, a + marca.length);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        <Boton titulo="Negritas" alPicar={() => envolver("**", "negritas")}>
          <Bold className="size-4" />
        </Boton>
        <Boton titulo="Cursivas" alPicar={() => envolver("*", "cursivas")}>
          <Italic className="size-4" />
        </Boton>
        <Boton titulo="Título" alPicar={() => prefijar("## ")}>
          <Heading className="size-4" />
        </Boton>
        <Boton titulo="Viñeta" alPicar={() => prefijar("- ")}>
          <List className="size-4" />
        </Boton>
        <Boton titulo="Enlace" alPicar={enlazar}>
          <Link2 className="size-4" />
        </Boton>
      </div>

      <AreaTexto
        ref={campo}
        id={id}
        name={name}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        rows={filas}
        spellCheck={false}
        className="font-mono text-sm"
      />
    </div>
  );
}

/** `type="button"` a propósito: dentro de un formulario, lo demás lo manda. */
function Boton({
  titulo,
  alPicar,
  children,
}: {
  titulo: string;
  alPicar: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={alPicar}
      title={titulo}
      aria-label={titulo}
      className="rounded-lg border-2 border-tinta bg-blanco px-2.5 py-1 transition hover:bg-amarillo-claro active:translate-y-px"
    >
      {children}
    </button>
  );
}
