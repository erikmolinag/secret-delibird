import { urlEntrenador } from "@/lib/avatares";
import { nombrePokemon, spritePokemon } from "@/lib/pokemon";
import { cn } from "@/lib/utils";

const medidas = {
  sm: { caja: "size-11", insignia: "size-6", borde: "border-2" },
  md: { caja: "size-14", insignia: "size-7", borde: "border-2" },
  lg: { caja: "size-20", insignia: "size-9", borde: "border-[3px]" },
  xl: { caja: "size-28", insignia: "size-12", borde: "border-[3px]" },
} as const;

export type PersonaConAvatar = {
  /** El Pokémon de ESTE intercambio. */
  pokemonId: number;
  avatarNombre: string | null;
  /** El entrenador del perfil, si esa persona ya tiene cuenta. */
  trainerKey?: string | null;
};

/**
 * La cara de alguien: su entrenador con el Pokémon de este evento al lado.
 * Si todavía no ha entrado y no tiene perfil, se ve solo el Pokémon.
 */
export function Avatar({
  persona,
  tamano = "md",
  className,
}: {
  persona: PersonaConAvatar;
  tamano?: keyof typeof medidas;
  className?: string;
}) {
  const medida = medidas[tamano];
  const pokemon = persona.avatarNombre ?? nombrePokemon(persona.pokemonId);

  if (!persona.trainerKey) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-tinta bg-blanco shadow-dura-sm",
          medida.caja,
          className,
        )}
        title={pokemon}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spritePokemon(persona.pokemonId)}
          alt={pokemon}
          loading="lazy"
          className="size-[86%] object-contain [image-rendering:pixelated]"
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  return (
    <span className={cn("relative inline-block shrink-0", medida.caja, className)}>
      <span
        className={cn(
          "grid size-full place-items-center overflow-hidden rounded-full border-[3px] border-tinta bg-blanco shadow-dura-sm",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urlEntrenador(persona.trainerKey)}
          alt=""
          loading="lazy"
          className="size-[88%] object-contain [image-rendering:pixelated]"
          referrerPolicy="no-referrer"
        />
      </span>

      <span
        className={cn(
          "absolute -bottom-1 -right-1 grid place-items-center overflow-hidden rounded-full border-tinta bg-crema-2",
          medida.insignia,
          medida.borde,
        )}
        title={pokemon}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spritePokemon(persona.pokemonId)}
          alt={pokemon}
          loading="lazy"
          className="size-[92%] object-contain [image-rendering:pixelated]"
          referrerPolicy="no-referrer"
        />
      </span>
    </span>
  );
}

/** Solo el entrenador, para el perfil y el encabezado. */
export function AvatarEntrenador({
  trainerKey,
  tamano = "md",
  className,
}: {
  trainerKey: string | null;
  tamano?: keyof typeof medidas;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-tinta bg-blanco shadow-dura-sm",
        medidas[tamano].caja,
        className,
      )}
    >
      {trainerKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlEntrenador(trainerKey)}
          alt=""
          loading="lazy"
          className="size-[88%] object-contain [image-rendering:pixelated]"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="font-display text-xl font-extrabold text-gris">?</span>
      )}
    </span>
  );
}
