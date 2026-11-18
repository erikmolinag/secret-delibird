"use client";

import { ImageUp, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { Boton } from "@/components/ui/boton";

const LADO_MAXIMO = 520;
const CALIDAD = 0.82;

/**
 * Encoge la foto aquí mismo, en el navegador, antes de mandarla: lo que viaja
 * es una miniatura de medio kilo, no los 4 MB que saca la cámara. El archivo
 * original nunca sale del teléfono.
 */
async function hacerMiniatura(archivo: File) {
  const mapa = await createImageBitmap(archivo);

  const escala = Math.min(1, LADO_MAXIMO / Math.max(mapa.width, mapa.height));
  const ancho = Math.round(mapa.width * escala);
  const alto = Math.round(mapa.height * escala);

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;

  const pincel = lienzo.getContext("2d");
  if (!pincel) throw new Error("sin canvas");
  pincel.drawImage(mapa, 0, 0, ancho, alto);
  mapa.close();

  // WebP pesa bastante menos; si el navegador no lo soporta, cae a JPEG.
  const webp = lienzo.toDataURL("image/webp", CALIDAD);
  const datos = webp.startsWith("data:image/webp")
    ? webp
    : lienzo.toDataURL("image/jpeg", CALIDAD);

  return { datos, ancho, alto };
}

export function CampoFoto({
  name = "fotoSubida",
  inicial,
}: {
  name?: string;
  inicial?: string | null;
}) {
  const [vista, setVista] = useState<string | null>(inicial ?? null);
  const [datos, setDatos] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  async function alElegir(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    setTrabajando(true);
    try {
      const miniatura = await hacerMiniatura(archivo);
      setDatos(miniatura.datos);
      setVista(miniatura.datos);
    } catch {
      setError("No pude leer esa imagen. Intenta con otra.");
    } finally {
      setTrabajando(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={datos} />

      <div className="flex flex-wrap items-center gap-3">
        {vista ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vista}
            alt=""
            className="size-24 rounded-xl border-2 border-tinta bg-blanco object-contain"
          />
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Boton
            type="button"
            variante="fantasma"
            tamano="sm"
            disabled={trabajando}
            onClick={() => entrada.current?.click()}
          >
            {trabajando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImageUp className="size-4" />
            )}
            {vista ? "Cambiar foto" : "Subir foto"}
          </Boton>

          {vista ? (
            <Boton
              type="button"
              variante="peligro"
              tamano="sm"
              onClick={() => {
                setVista(null);
                setDatos("");
              }}
            >
              <X className="size-4" />
              Quitar
            </Boton>
          ) : null}
        </div>
      </div>

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => alElegir(e.target.files?.[0])}
      />

      {error ? <p className="text-xs font-bold text-rojo">{error}</p> : null}
      <p className="text-xs text-gris">
        Se guarda una miniatura: la foto original no se sube a ningún lado.
      </p>
    </div>
  );
}
