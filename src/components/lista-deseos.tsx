"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImageOff, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import {
  editarDeseoAccion,
  eliminarDeseoAccion,
  reordenarDeseosAccion,
} from "@/actions/wishlist";
import { CampoFoto } from "@/components/campo-foto";
import { Boton } from "@/components/ui/boton";
import { BotonEnvio } from "@/components/ui/boton-envio";
import { AreaTexto, Campo, Entrada, claseInput } from "@/components/ui/campo";
import { Insignia } from "@/components/ui/insignia";
import { cn, precioVisible } from "@/lib/utils";

export type Deseo = {
  id: string;
  title: string;
  note: string | null;
  price: string | null;
  url: string | null;
  siteName: string | null;
  imageUrl: string | null;
  priority: number;
};

const GANAS: Record<number, { texto: string; tono: "listo" | "info" | "espera" }> = {
  1: { texto: "Me encantaría", tono: "listo" },
  2: { texto: "Me gusta", tono: "info" },
  3: { texto: "Tal vez", tono: "espera" },
};

export function ListaDeseos({
  participantId,
  deseos,
}: {
  participantId: string;
  deseos: Deseo[];
}) {
  // Guardamos solo el orden que eligio la persona; los datos vienen del
  // servidor. Asi, si se agrega o se borra un regalo, no hay que sincronizar
  // nada: lo nuevo se acomoda al final y lo borrado desaparece solo.
  const [idsOrdenados, setIdsOrdenados] = useState<string[] | null>(null);
  const [, guardarOrden] = useTransition();

  const orden = useMemo(() => {
    if (!idsOrdenados) return deseos;
    const porId = new Map(deseos.map((d) => [d.id, d]));
    const conocidos = idsOrdenados
      .map((id) => porId.get(id))
      .filter((d): d is Deseo => Boolean(d));
    const recienLlegados = deseos.filter((d) => !idsOrdenados.includes(d.id));
    return [...conocidos, ...recienLlegados];
  }, [deseos, idsOrdenados]);

  const sensores = useSensors(
    // Un toque corto es un clic; para arrastrar hay que moverse o mantener.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function alSoltar(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over || active.id === over.id) return;

    const desde = orden.findIndex((d) => d.id === active.id);
    const hasta = orden.findIndex((d) => d.id === over.id);
    if (desde < 0 || hasta < 0) return;

    const nuevo = arrayMove(orden, desde, hasta);
    setIdsOrdenados(nuevo.map((d) => d.id));

    guardarOrden(async () => {
      await reordenarDeseosAccion({
        participantId,
        ids: nuevo.map((d) => d.id),
      });
    });
  }

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCenter}
      onDragEnd={alSoltar}
    >
      <SortableContext
        items={orden.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-3 p-5">
          {orden.map((deseo) => (
            <Tarjeta
              key={deseo.id}
              deseo={deseo}
              participantId={participantId}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function Tarjeta({
  deseo,
  participantId,
}: {
  deseo: Deseo;
  participantId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deseo.id });

  // Mientras editas, el asa de arrastrar estorba y la miniatura se come el
  // ancho: en el telefono el formulario se quedaba en una tira de 200 px.
  const [editando, setEditando] = useState(false);

  const ganas = GANAS[deseo.priority] ?? GANAS[2];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex gap-3 rounded-2xl border-[3px] border-tinta bg-crema p-3 ${
        isDragging ? "z-10 opacity-80 shadow-dura" : ""
      }`}
    >
      {editando ? null : (
        <button
          type="button"
          className="-ml-1 touch-none self-stretch rounded-xl px-1 text-gris transition hover:bg-amarillo-claro hover:text-tinta"
          title="Arrastra para cambiarlo de lugar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5" />
          <span className="sr-only">Mover</span>
        </button>
      )}

      {deseo.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={deseo.imageUrl}
          alt=""
          loading="lazy"
          className={cn(
            "size-24 shrink-0 rounded-xl border-2 border-tinta bg-blanco object-contain",
            editando && "hidden sm:block",
          )}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          className={cn(
            "grid size-24 shrink-0 place-items-center rounded-xl border-2 border-tinta bg-blanco text-gris",
            editando && "hidden sm:grid",
          )}
        >
          <ImageOff className="size-6" />
        </span>
      )}

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-extrabold leading-tight">
            {deseo.title}
          </h3>
          <form action={eliminarDeseoAccion}>
            <input type="hidden" name="participantId" value={participantId} />
            <input type="hidden" name="itemId" value={deseo.id} />
            <Boton
              type="submit"
              variante="peligro"
              tamano="sm"
              title="Quitar de mi lista"
              className="px-2 py-1"
            >
              <Trash2 className="size-3.5" />
            </Boton>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Insignia tono={ganas.tono}>{ganas.texto}</Insignia>
          {deseo.price ? (
            <span className="text-sm font-extrabold text-rojo">
              {precioVisible(deseo.price)}
            </span>
          ) : null}
        </div>

        {deseo.note ? (
          <p className="text-sm font-semibold text-gris">{deseo.note}</p>
        ) : null}

        {deseo.url ? (
          <a
            href={deseo.url}
            target="_blank"
            rel="noreferrer nofollow"
            className="block truncate text-xs font-bold text-azul underline underline-offset-2"
          >
            {deseo.siteName ?? deseo.url}
          </a>
        ) : null}

        <details className="pt-1" onToggle={(e) => setEditando(e.currentTarget.open)}>
          <summary className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-azul">
            <Pencil className="size-3" />
            Editar
          </summary>

          <form
            action={editarDeseoAccion}
            className="mt-3 space-y-3 rounded-2xl border-2 border-tinta bg-blanco p-3"
          >
            <input type="hidden" name="participantId" value={participantId} />
            <input type="hidden" name="itemId" value={deseo.id} />

            <Campo etiqueta="Qué es" htmlFor={`titulo-${deseo.id}`}>
              <Entrada
                id={`titulo-${deseo.id}`}
                name="title"
                defaultValue={deseo.title}
                required
                maxLength={160}
              />
            </Campo>

            <div className="grid gap-3 sm:grid-cols-2">
              <Campo etiqueta="Precio" htmlFor={`precio-${deseo.id}`}>
                <Entrada
                  id={`precio-${deseo.id}`}
                  name="price"
                  defaultValue={deseo.price ?? ""}
                  maxLength={40}
                />
              </Campo>
              <Campo etiqueta="Ganas" htmlFor={`ganas-${deseo.id}`}>
                <select
                  id={`ganas-${deseo.id}`}
                  name="priority"
                  defaultValue={String(deseo.priority)}
                  className={claseInput}
                >
                  <option value="1">Me encantaría</option>
                  <option value="2">Me gusta</option>
                  <option value="3">Tal vez</option>
                </select>
              </Campo>
            </div>

            <Campo etiqueta="Nota" htmlFor={`nota-${deseo.id}`}>
              <AreaTexto
                id={`nota-${deseo.id}`}
                name="note"
                defaultValue={deseo.note ?? ""}
                maxLength={500}
              />
            </Campo>

            <Campo etiqueta="Foto">
              <CampoFoto />
            </Campo>

            <Campo
              etiqueta="O pega la dirección de una imagen"
              htmlFor={`foto-${deseo.id}`}
            >
              <Entrada
                id={`foto-${deseo.id}`}
                name="imageUrl"
                type="url"
                placeholder="https://.../foto.jpg"
              />
            </Campo>

            <BotonEnvio variante="secundario" tamano="sm" cargando="Guardando...">
              Guardar cambios
            </BotonEnvio>
          </form>
        </details>
      </div>
    </li>
  );
}
