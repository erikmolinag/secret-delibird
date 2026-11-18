import { nombrePokemon, spritePokemon } from "@/lib/pokemon";
import { cn } from "@/lib/utils";

const medidas = {
  sm: "size-10",
  md: "size-14",
  lg: "size-20",
  xl: "size-28",
} as const;

export function AvatarPokemon({
  pokemonId,
  tamano = "md",
  className,
}: {
  pokemonId: number;
  tamano?: keyof typeof medidas;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-noche-borde bg-noche/80 shadow-brillo",
        medidas[tamano],
        className,
      )}
      title={nombrePokemon(pokemonId)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={spritePokemon(pokemonId)}
        alt={nombrePokemon(pokemonId)}
        loading="lazy"
        className="size-[85%] object-contain [image-rendering:pixelated]"
        referrerPolicy="no-referrer"
      />
    </span>
  );
}
