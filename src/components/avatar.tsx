import { nombreAvatar, urlAvatar, type TipoAvatar } from "@/lib/avatares";
import { cn } from "@/lib/utils";

const medidas = {
  sm: "size-11",
  md: "size-14",
  lg: "size-20",
  xl: "size-28",
} as const;

export type PersonaConAvatar = {
  avatarKind: TipoAvatar;
  pokemonId: number;
  trainerKey: string | null;
  avatarNombre: string | null;
};

export function Avatar({
  persona,
  tamano = "md",
  className,
}: {
  persona: PersonaConAvatar;
  tamano?: keyof typeof medidas;
  className?: string;
}) {
  const nombre = nombreAvatar(persona);

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-tinta bg-blanco shadow-dura-sm",
        medidas[tamano],
        className,
      )}
      title={nombre}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urlAvatar(persona)}
        alt={nombre}
        loading="lazy"
        className="size-[86%] object-contain [image-rendering:pixelated]"
        referrerPolicy="no-referrer"
      />
    </span>
  );
}
