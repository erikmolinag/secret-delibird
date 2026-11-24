import { TextoLegal } from "@/components/texto-legal";
import { Tarjeta, TarjetaCuerpo } from "@/components/ui/tarjeta";
import type { TextoLegalGuardado } from "@/lib/legales";
import { formatearFecha } from "@/lib/utils";

/**
 * El molde de las dos páginas legales. Son públicas a propósito: alguien que
 * todavía no entra tiene derecho a leer qué va a pasar con su correo antes de
 * dárnoslo.
 */
export function PaginaLegal({
  titulo,
  contenido,
}: {
  titulo: string;
  contenido: TextoLegalGuardado;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-extrabold">{titulo}</h1>

      <Tarjeta>
        <TarjetaCuerpo>
          <TextoLegal texto={contenido.texto} />

          <p className="mt-8 border-t-2 border-dashed border-gris/40 pt-4 text-sm text-gris">
            {contenido.actualizado
              ? `Actualizado el ${formatearFecha(contenido.actualizado)}.`
              : "Esta es la versión de arranque; todavía no se ha editado."}
          </p>
        </TarjetaCuerpo>
      </Tarjeta>
    </div>
  );
}
