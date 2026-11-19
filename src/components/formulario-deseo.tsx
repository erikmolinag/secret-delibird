"use client";

import { ImageOff, Link2, Loader2, Plus } from "lucide-react";
import { useState } from "react";

import { agregarDeseoAccion, previsualizarLinkAccion } from "@/actions/wishlist";
import { CampoFoto } from "@/components/campo-foto";
import { Boton } from "@/components/ui/boton";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { AreaTexto, Campo, Entrada, claseInput } from "@/components/ui/campo";
import type { Preview } from "@/lib/og";

const VACIO: Preview = { title: null, imageUrl: null, siteName: null, price: null };

export function FormularioDeseo({ participantId }: { participantId: string }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [cargando, setCargando] = useState(false);
  const [intentado, setIntentado] = useState(false);
  // Sube de uno en cada alta: le sirve de llave al campo de foto para que
  // vuelva a nacer vacío. Si no, la miniatura del regalo anterior se quedaba
  // pegada y se subía otra vez con el siguiente.
  const [altas, setAltas] = useState(0);

  async function traerDatos() {
    const limpio = url.trim();
    if (!limpio) return;
    setCargando(true);
    try {
      const resultado = await previsualizarLinkAccion(limpio);
      setPreview(resultado ?? VACIO);
    } finally {
      setIntentado(true);
      setCargando(false);
    }
  }

  const sinImagen = intentado && !preview?.imageUrl;
  const llave = preview?.title ?? (intentado ? "sin-datos" : "vacio");

  return (
    <form
      action={async (datos: FormData) => {
        await agregarDeseoAccion(datos);
        setUrl("");
        setPreview(null);
        setIntentado(false);
        setAltas((n) => n + 1);
      }}
      className="space-y-5"
    >
      <input type="hidden" name="participantId" value={participantId} />
      <input type="hidden" name="siteName" value={preview?.siteName ?? ""} />
      <input type="hidden" name="scrapedImageUrl" value={preview?.imageUrl ?? ""} />

      <Campo
        etiqueta="Link del regalo"
        htmlFor="url"
        pista="Pega el link y aprieta 'Traer datos' para que aparezca la foto."
      >
        <div className="flex gap-2">
          <Entrada
            id="url"
            name="url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
          <Boton
            type="button"
            variante="fantasma"
            onClick={traerDatos}
            disabled={cargando || !url.trim()}
            className="shrink-0"
          >
            {cargando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Link2 className="size-4" />
            )}
            Traer datos
          </Boton>
        </div>
      </Campo>

      {intentado ? (
        <div className="flex items-center gap-4 rounded-2xl border-[3px] border-tinta bg-crema p-3">
          {preview?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.imageUrl}
              alt=""
              className="size-20 shrink-0 rounded-xl bg-white object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="grid size-20 shrink-0 place-items-center rounded-xl border-2 border-tinta bg-blanco text-gris">
              <ImageOff className="size-6" />
            </span>
          )}
          <p className="text-sm text-gris">
            {preview?.imageUrl
              ? `Imagen encontrada${preview.siteName ? ` en ${preview.siteName}` : ""}.`
              : "Esa página no dejó leer su imagen. Pega abajo la dirección de una foto o sube el link de la imagen que quieras."}
          </p>
        </div>
      ) : null}

      <Campo etiqueta="Qué es" htmlFor="title">
        <Entrada
          id="title"
          name="title"
          key={`titulo-${llave}`}
          defaultValue={preview?.title ?? ""}
          required
          maxLength={160}
          placeholder="Taza de Snorlax"
        />
      </Campo>

      <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
        <Campo etiqueta="Precio aproximado" htmlFor="price" pista="Opcional.">
          <Entrada
            id="price"
            name="price"
            key={`precio-${llave}`}
            defaultValue={preview?.price ?? ""}
            maxLength={40}
            placeholder="450 MXN"
          />
        </Campo>

        <Campo etiqueta="Qué tantas ganas" htmlFor="priority">
          <select
            id="priority"
            name="priority"
            defaultValue="2"
            className={claseInput}
          >
            <option value="1">Me encantaría</option>
            <option value="2">Me gusta</option>
            <option value="3">Tal vez</option>
          </select>
        </Campo>
      </div>

      <Campo
        etiqueta="Nota para quien te regale"
        htmlFor="note"
        pista="Talla, color, sabor, lo que sirva."
      >
        <AreaTexto id="note" name="note" maxLength={500} />
      </Campo>

      <Campo etiqueta="O sube una foto tuya">
        <CampoFoto key={`foto-${altas}`} />
      </Campo>

      <details className="rounded-2xl border-[3px] border-tinta px-4 py-3" open={sinImagen}>
        <summary className="cursor-pointer text-sm font-bold text-azul">
          Pegar la dirección de una imagen
        </summary>
        <div className="pt-3">
          <Campo
            etiqueta="Direccion de la imagen"
            htmlFor="imageUrl"
            pista="Clic derecho sobre la foto en la tienda, 'copiar dirección de imagen'."
          >
            <Entrada
              id="imageUrl"
              name="imageUrl"
              type="url"
              placeholder="https://.../foto.jpg"
            />
          </Campo>
        </div>
      </details>

      <BotonEnvio className="w-full" cargando="Guardando...">
        <Plus className="size-4" />
        Agregar a mi lista
      </BotonEnvio>
    </form>
  );
}
