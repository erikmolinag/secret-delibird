import type { Metadata } from "next";

import { PaginaLegal } from "@/components/pagina-legal";
import { avisoDePrivacidad } from "@/lib/legales";

/**
 * Lee el texto guardado en cada visita, para que un cambio desde el panel se
 * vea de inmediato y no cuando le toque revalidar.
 */
export const instant = false;

export const metadata: Metadata = { title: "Aviso de privacidad" };

export default async function Privacidad() {
  const contenido = await avisoDePrivacidad();

  return <PaginaLegal titulo="Aviso de privacidad" contenido={contenido} />;
}
