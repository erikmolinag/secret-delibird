import { urlEntrenador } from "@/lib/avatares";
import { nombrePokemon, spritePokemon } from "@/lib/pokemon";
import { cn } from "@/lib/utils";

const medidas = {
  xs: "size-11",
  sm: "size-16",
  md: "size-20",
  lg: "size-24",
  xl: "size-28",
} as const;

export type PersonaConAvatar = {
  /** El Pokémon de ESTE intercambio. */
  pokemonId: number;
  avatarNombre: string | null;
  /** El entrenador del perfil, si esa persona ya tiene cuenta. */
  trainerKey?: string | null;
};

const circulo =
  "grid shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-tinta shadow-dura-sm";

const sprite = "size-[88%] object-contain [image-rendering:pixelated]";

/**
 * La cara de alguien: su entrenador y el Pokémon de este evento, del mismo
 * tamaño y uno junto al otro. Quien todavía no ha entrado no tiene perfil, así
 * que se ve solo su Pokémon.
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

  const circuloPokemon = (
    <span className={cn(circulo, "bg-crema-2", medida)} title={pokemon}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={spritePokemon(persona.pokemonId)}
        alt={pokemon}
        loading="lazy"
        className={sprite}
        referrerPolicy="no-referrer"
      />
    </span>
  );

  if (!persona.trainerKey) {
    return <span className={cn("inline-flex", className)}>{circuloPokemon}</span>;
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      <span className={cn(circulo, "bg-blanco", medida)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urlEntrenador(persona.trainerKey)}
          alt=""
          loading="lazy"
          className={sprite}
          referrerPolicy="no-referrer"
        />
      </span>
      {/* Se encima tantito para que se lean como pareja, no como dos cosas */}
      <span className="-ml-2">{circuloPokemon}</span>
    </span>
  );
}

/** Solo el entrenador, para el perfil. */
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
    <span className={cn(circulo, "bg-blanco", medidas[tamano], className)}>
      {trainerKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlEntrenador(trainerKey)}
          alt=""
          loading="lazy"
          className={sprite}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="font-display text-xl font-extrabold text-gris">?</span>
      )}
    </span>
  );
}
