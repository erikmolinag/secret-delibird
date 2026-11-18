/**
 * Enlaces que se arman solos a partir de los datos del evento: el mapa y el
 * "agregar al calendario". Sin dependencias, para poder usarlos igual en las
 * páginas y en los correos.
 */

const TRES_HORAS = 3 * 60 * 60 * 1000;

function esUrl(valor: string) {
  return /^https?:\/\//i.test(valor.trim());
}

/**
 * Si el organizador pegó una liga (Google Maps, Waze, lo que sea) se usa esa.
 * Si solo puso el nombre del lugar, se arma una búsqueda en Google Maps.
 */
export function enlaceMapa(lugar: string | null, lugarUrl: string | null) {
  if (lugarUrl && esUrl(lugarUrl)) return lugarUrl.trim();
  if (!lugar?.trim()) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lugar.trim())}`;
}

/** Formato de fecha que pide Google Calendar: 20261224T200000Z */
function aFormatoCalendario(fecha: Date) {
  return fecha.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Liga para agregar el evento a Google Calendar. Si no hay fecha no hay liga:
 * un evento sin hora no se puede agendar.
 */
export function enlaceCalendario(opciones: {
  titulo: string;
  inicio: Date | null;
  horas?: number;
  lugar?: string | null;
  detalles?: string | null;
}) {
  if (!opciones.inicio) return null;

  const fin = new Date(opciones.inicio.getTime() + (opciones.horas ?? 3) * 3_600_000);
  const parametros = new URLSearchParams({
    action: "TEMPLATE",
    text: opciones.titulo,
    dates: `${aFormatoCalendario(opciones.inicio)}/${aFormatoCalendario(fin)}`,
  });

  if (opciones.lugar?.trim()) parametros.set("location", opciones.lugar.trim());
  if (opciones.detalles?.trim()) parametros.set("details", opciones.detalles.trim());

  return `https://calendar.google.com/calendar/render?${parametros.toString()}`;
}

export const DURACION_PREDETERMINADA_MS = TRES_HORAS;
