import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const fechaLarga = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const fechaCorta = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
});

const horaCorta = new Intl.DateTimeFormat("es-MX", {
  hour: "numeric",
  minute: "2-digit",
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

/** Convierte "<input type=datetime-local>" a Date, o null si viene vacio. */
export function parsearFechaLocal(valor: FormDataEntryValue | null) {
  if (typeof valor !== "string" || !valor.trim()) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Para los <input type=datetime-local> precargados. */
export function aValorInputFecha(fecha: Date | null) {
  if (!fecha) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(
    fecha.getDate(),
  )}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
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
