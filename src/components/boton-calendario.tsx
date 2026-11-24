import { CalendarPlus } from "lucide-react";

import { clasesBoton } from "@/components/ui/boton";
import { enlaceCalendario } from "@/lib/enlaces";
import { cn } from "@/lib/utils";

type Evento = {
  name: string;
  eventDate: Date | null;
  place: string | null;
  message: string | null;
};

/**
 * "Agregar a Google Calendar", con la misma liga que ya iba en el correo.
 *
 * En la página del invitado esto existía, pero escondido: la fecha era el
 * enlace y la única pista vivía en un `title`, que en el teléfono no se ve
 * nunca. Parecía texto. Ahora es un botón y se dice lo que hace.
 *
 * Sin fecha no hay botón: un evento sin hora no se puede agendar.
 */
export function BotonCalendario({
  evento,
  className,
}: {
  evento: Evento;
  className?: string;
}) {
  const url = enlaceCalendario({
    titulo: evento.name,
    inicio: evento.eventDate,
    lugar: evento.place,
    detalles: evento.message,
  });

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(clasesBoton("fantasma", "sm"), className)}
    >
      <CalendarPlus className="size-4 text-azul" />
      Agregar a Google Calendar
    </a>
  );
}
