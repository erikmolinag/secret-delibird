import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Las fechas se guardan y se pintan como **hora de pared**: "la posada es a
 * las 8" quiere decir las 8 donde va a ser la posada, no un instante absoluto.
 *
 * El `<input type=datetime-local>` manda "2026-12-13T20:00", sin zona, y
 * `new Date` lo interpreta en la zona de quien corre: en tu máquina es la de
 * México y en Vercel es UTC. Eso hacía que el mismo texto guardara dos cosas
 * distintas según dónde se creara el evento.
 *
 * La regla es: **todo se guarda y se lee en UTC**, así que los componentes UTC
 * de la fecha son siempre la hora que escribió quien organiza, corra donde
 * corra. Por eso estos formateadores llevan `timeZone` fijo; sin eso, la misma
 * fecha se vería distinta en tu laptop que en producción.
 */
const ZONA = "UTC";

const fechaLarga = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: ZONA,
});

const fechaCorta = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: ZONA,
});

const horaCorta = new Intl.DateTimeFormat("es-MX", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: ZONA,
});

export function formatearFecha(fecha: Date | null | undefined, conHora = true) {
  if (!fecha) return null;
  const dia = fechaLarga.format(fecha);
  if (!conHora) return dia;
  return `${dia} · ${horaCorta.format(fecha)}`;
}

export function formatearFechaCorta(fecha: Date | null | undefined) {
  if (!fecha) return null;
  return fechaCorta.format(fecha);
}

export function formatearPresupuesto(monto: number | null, moneda: string) {
  if (monto == null) return null;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda || "MXN",
    maximumFractionDigits: 0,
  }).format(monto);
}

/**
 * Convierte "<input type=datetime-local>" a Date, o null si viene vacio.
 *
 * Se le pega la `Z` a propósito: el texto viene sin zona, y sin esto `new Date`
 * lo leería en la zona de quien corre —México en tu laptop, UTC en Vercel— y el
 * mismo "20:00" quedaría guardado como dos instantes distintos.
 */
export function parsearFechaLocal(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string" || !valor.trim()) return null;

  const texto = valor.trim();
  const fecha = new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(texto) ? texto : `${texto}Z`);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Para los <input type=datetime-local> precargados. Lee los componentes UTC,
 * que son los que guardan la hora que se escribió.
 */
export function aValorInputFecha(fecha: Date | null) {
  if (!fecha) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getUTCFullYear()}-${pad(fecha.getUTCMonth() + 1)}-${pad(
    fecha.getUTCDate(),
  )}T${pad(fecha.getUTCHours())}:${pad(fecha.getUTCMinutes())}`;
}

export function normalizarEmail(valor: unknown) {
  return String(valor ?? "")
    .trim()
    .toLowerCase();
}

/** Saca "Erik" de "Erik Molina <erik@correo.com>" o de "erik@correo.com". */
export function nombreDesdeEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

/**
 * El nombre que se muestra de alguien dentro de un evento: manda el de su
 * perfil (lo eligió esa persona) y, si todavía no tiene cuenta, el que le puso
 * quien organiza al invitarlo.
 */
export function nombreVisible(persona: {
  name: string;
  nombrePerfil?: string | null;
}) {
  return persona.nombrePerfil?.trim() || persona.name;
}

/**
 * El precio de un regalo lo escribe cada quien a mano ("450", "450 MXN",
 * "$450"), así que al mostrarlo le ponemos el signo si no lo trae.
 */
export function precioVisible(precio: string | null | undefined) {
  const limpio = precio?.trim();
  if (!limpio) return null;
  // Si ya trae signo, o empieza con un codigo tipo "MXN 300", se deja igual.
  const yaTrae = /^([$€£]|[A-Za-z]{3}[^A-Za-z])/.test(limpio);
  return yaTrae ? limpio : "$" + limpio;
}
