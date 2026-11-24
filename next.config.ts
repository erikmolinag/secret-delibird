import type { NextConfig } from "next";

/**
 * Las cabeceras baratas: ninguna necesita afinarse y ninguna rompe nada de lo
 * que la app usa (ni cámara, ni micrófono, ni ubicación, y no se embebe a sí
 * misma en ningún lado).
 *
 * Falta la cara: una Content-Security-Policy. Esa sí hay que medirla, porque
 * tiene que dejar pasar el script de Turnstile, sus marcos, las fuentes de
 * Google y los sprites de Pokémon, y mal puesta deja la app en blanco.
 */
const CABECERAS = [
  // Que el navegador no adivine el tipo de un archivo. Las fotos se sirven
  // desde nuestro dominio: si una se sirviera como HTML, sería nuestro HTML.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al salir del sitio, solo el dominio, nunca la ruta. Las rutas de aquí
  // traen ids de evento y de invitado.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nadie nos mete en un marco: sin esto se puede montar un clic falso encima.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Un año de HTTPS obligatorio. Sin includeSubDomains: los subdominios de
  // aquí son para el correo y no sirven páginas.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [{ source: "/:path*", headers: CABECERAS }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
