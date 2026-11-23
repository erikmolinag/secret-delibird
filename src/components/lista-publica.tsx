import { ExternalLink, ImageOff } from "lucide-react";

import { clasesBoton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import type { DeseoPublico } from "@/lib/datos";
import { precioVisible } from "@/lib/utils";

const GANAS: Record<number, { texto: string; tono: "listo" | "info" | "espera" }> = {
  1: { texto: "Me encantaría", tono: "listo" },
  2: { texto: "Me gusta", tono: "info" },
  3: { texto: "Tal vez", tono: "espera" },
};

/**
 * La lista de alguien más, de solo lectura: se ve en la lista de invitados y en
 * el panel de admin.
 *
 * A propósito **no dice si ya le compraron algo**. Eso vive en `reservations` y
 * solo lo ve quien regala: si saliera aquí, el dueño de la lista se enteraría de
 * su propia sorpresa, y con un par de miradas se podría adivinar quién le regala
 * a quién.
 */
export function ListaPublica({
  deseos,
  vacia = "Todavía no pide nada.",
}: {
  deseos: DeseoPublico[];
  vacia?: string;
}) {
  if (!deseos.length) {
    return <p className="text-sm font-semibold text-gris">{vacia}</p>;
  }

  return (
    <ul className="space-y-2">
      {deseos.map((deseo) => {
        const ganas = GANAS[deseo.priority] ?? GANAS[2];

        return (
          <li
            key={deseo.id}
            className="flex gap-3 rounded-2xl border-2 border-tinta bg-crema p-2.5"
          >
            {deseo.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={deseo.imageUrl}
                alt=""
                loading="lazy"
                className="size-14 shrink-0 rounded-xl border-2 border-tinta bg-blanco object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="grid size-14 shrink-0 place-items-center rounded-xl border-2 border-tinta bg-blanco text-gris">
                <ImageOff className="size-4" />
              </span>
            )}

            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="font-display text-sm font-extrabold leading-tight">
                {deseo.title}
              </h4>

              <div className="flex flex-wrap items-center gap-2">
                <Insignia tono={ganas.tono}>{ganas.texto}</Insignia>
                {deseo.price ? (
                  <span className="text-sm font-extrabold text-rojo">
                    {precioVisible(deseo.price)}
                  </span>
                ) : null}
              </div>

              {deseo.note ? (
                <p className="text-xs font-semibold text-gris">{deseo.note}</p>
              ) : null}

              {deseo.url ? (
                <a
                  href={deseo.url}
                  target="_blank"
                  rel="noreferrer nofollow"
                  title={deseo.siteName ?? deseo.url}
                  className={clasesBoton("fantasma", "sm")}
                >
                  <ExternalLink className="size-3.5" />
                  Ver artículo
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
