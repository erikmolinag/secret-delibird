import type { Metadata } from "next";

import { PaginaLegal } from "@/components/pagina-legal";
import { terminos } from "@/lib/legales";

/**
 * Lee el texto guardado en cada visita, para que un cambio desde el panel se
 * vea de inmediato y no cuando le toque revalidar.
 */
export const instant = false;

export const metadata: Metadata = { title: "Términos de uso" };

export default async function Terminos() {
  const contenido = await terminos();

  return <PaginaLegal titulo="Términos de uso" contenido={contenido} />;
}
