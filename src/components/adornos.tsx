/** Adornos dibujados a mano (SVG): contorno de tinta y colores planos. */

const TINTA = "#16304b";

export function Pokebola({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <circle cx="32" cy="32" r="28" fill="#ffffff" stroke={TINTA} strokeWidth="4" />
      <path d="M4 32a28 28 0 0 1 56 0Z" fill="#ee1515" stroke={TINTA} strokeWidth="4" />
      <path d="M4 32h56" stroke={TINTA} strokeWidth="5" />
      <circle cx="32" cy="32" r="9" fill="#ffffff" stroke={TINTA} strokeWidth="4" />
      <circle cx="32" cy="32" r="3.5" fill={TINTA} />
    </svg>
  );
}

export function Acebo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <g stroke={TINTA} strokeWidth="3">
        <ellipse
          cx="22"
          cy="28"
          rx="16"
          ry="9"
          fill="#1f8a4c"
          transform="rotate(-25 22 28)"
        />
        <ellipse
          cx="42"
          cy="28"
          rx="16"
          ry="9"
          fill="#1f8a4c"
          transform="rotate(25 42 28)"
        />
      </g>
      <g fill="#ee1515" stroke={TINTA} strokeWidth="3">
        <circle cx="32" cy="40" r="5.5" />
        <circle cx="24" cy="47" r="5.5" />
        <circle cx="40" cy="47" r="5.5" />
      </g>
    </svg>
  );
}

export function Baston({ className }: { className?: string }) {
  const trazo = "M22 58V28a11 11 0 0 1 22 0v4";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <path
        d={trazo}
        fill="none"
        stroke={TINTA}
        strokeWidth="17"
        strokeLinecap="round"
      />
      <path
        d={trazo}
        fill="none"
        stroke="#ffffff"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d={trazo}
        fill="none"
        stroke="#ee1515"
        strokeWidth="12"
        strokeDasharray="8 9"
      />
    </svg>
  );
}

export function Estrella({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <path
        d="M32 5l8 17 19 2.5-14 13 3.7 18.5L32 47l-16.7 9 3.7-18.5-14-13L24 22z"
        fill="#ffcb05"
        stroke={TINTA}
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Tira de pokebola: el detalle que separa el encabezado del contenido. */
export function FranjaPokebola({ className }: { className?: string }) {
  return <div aria-hidden className={`franja-pokebola h-3 ${className ?? ""}`} />;
}

/** Guirnalda de caramelo para cortar secciones. */
export function RayaCaramelo({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`raya-caramelo h-2.5 rounded-full border-2 border-tinta ${className ?? ""}`}
    />
  );
}
