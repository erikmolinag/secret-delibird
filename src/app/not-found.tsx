import { BotonLink } from "@/components/ui/boton";
import { spritePokemon } from "@/lib/pokemon";

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-md space-y-5 py-10 text-center">
      <span className="mx-auto grid size-32 place-items-center rounded-full border-[3px] border-tinta bg-blanco shadow-dura">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={spritePokemon(54)}
          alt=""
          aria-hidden
          className="size-[80%] object-contain [image-rendering:pixelated]"
          referrerPolicy="no-referrer"
        />
      </span>

      <h1 className="text-3xl font-extrabold">Aquí no hay nada</h1>

      <p className="font-semibold text-gris">
        O la dirección está mal, o este evento no es tuyo. Cada quien ve
        únicamente los eventos en los que está.
      </p>

      <BotonLink href="/eventos">Ir a mis eventos</BotonLink>
    </div>
  );
}
