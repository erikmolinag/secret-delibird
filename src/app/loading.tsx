import { Pokebola } from "@/components/adornos";

export default function Cargando() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 py-20"
    >
      <Pokebola className="size-14 animate-spin [animation-duration:1.4s]" />
      <p className="font-display font-extrabold text-gris">Un momento...</p>
    </div>
  );
}
