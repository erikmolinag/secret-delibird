import { Gift, ListChecks, Mail, Shuffle } from "lucide-react";

import { Acebo, Baston, Estrella, Pokebola, RayaCaramelo } from "@/components/adornos";
import { BotonLink } from "@/components/ui/boton";
import { Tarjeta, TarjetaCuerpo } from "@/components/ui/tarjeta";
import { DELIBIRD_ID, artePokemon, spritePokemon } from "@/lib/pokemon";

const CARACTERISTICAS = [
  {
    icono: Shuffle,
    color: "bg-rojo",
    titulo: "Sorteo con reglas",
    texto:
      "Excluye parejas, limita a quién le puede tocar cada quien y fija los casos especiales. El sorteo respeta todo o te dice por qué no se puede.",
    pokemon: 215,
  },
  {
    icono: ListChecks,
    color: "bg-verde",
    titulo: "Listas con foto",
    texto:
      "Pega el link de lo que quieres y aparece la imagen del producto. Quien te regala ve exactamente qué pedir, sin adivinar.",
    pokemon: 582,
  },
  {
    icono: Mail,
    color: "bg-azul",
    titulo: "Sin contraseñas",
    texto:
      "Cada invitado entra con un enlace que le llega por correo. Nadie se registra, nadie olvida su contraseña.",
    pokemon: 613,
  },
];

const PASOS = [
  "Creas el evento con fecha, lugar y presupuesto.",
  "Agregas los correos de los invitados y les llega su invitación.",
  "Cada quien elige su sprite y arma su lista de deseos.",
  "Corres el sorteo y a cada uno le llega a quién le toca regalar.",
];

export default function Inicio() {
  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 pt-2 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border-[3px] border-tinta bg-amarillo px-4 py-1.5 text-sm font-extrabold text-tinta shadow-dura-sm">
            <Gift className="size-4" />
            Intercambio de regalos, versión Pokémon
          </p>

          <h1 className="text-balance text-4xl font-extrabold leading-[1.1] sm:text-5xl md:text-6xl">
            El amigo secreto que reparte{" "}
            <span className="texto-logo whitespace-nowrap">Delibird</span>
          </h1>

          <p className="max-w-xl text-lg font-semibold text-gris">
            Organiza tu intercambio navideño sin cadenas de WhatsApp ni papelitos
            en una bolsa. Sorteo con reglas de verdad, listas de deseos con foto y
            un enlace por invitado.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <BotonLink href="/eventos/nuevo" tamano="lg">
              Crear mi intercambio
            </BotonLink>
            <BotonLink href="/eventos" variante="fantasma" tamano="lg">
              Ver mis eventos
            </BotonLink>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <Acebo className="absolute -left-2 -top-4 z-10 size-16 -rotate-12" />
          <Estrella className="absolute -right-1 top-6 z-10 size-10 rotate-12" />
          <Baston className="absolute -bottom-6 -left-5 z-10 size-16 -rotate-[18deg]" />

          <div className="rounded-[2rem] border-[3px] border-tinta bg-blanco p-5 shadow-dura">
            <div className="grid place-items-center rounded-3xl border-[3px] border-tinta bg-crema-2 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artePokemon(DELIBIRD_ID)}
                alt="Delibird cargando su saco de regalos"
                className="w-full max-w-64"
              />
            </div>
            <p className="mt-3 text-center font-display text-lg font-extrabold">
              Delibird reparte lo que le encargues
            </p>
          </div>
        </div>
      </section>

      <RayaCaramelo />

      <section className="grid gap-5 md:grid-cols-3">
        {CARACTERISTICAS.map((item) => (
          <Tarjeta key={item.titulo} className="relative">
            <TarjetaCuerpo className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={spritePokemon(item.pokemon)}
                alt=""
                aria-hidden
                className="absolute -right-2 -top-2 size-24 opacity-20 [image-rendering:pixelated]"
              />
              <span
                className={`grid size-12 place-items-center rounded-2xl border-[3px] border-tinta text-blanco shadow-dura-sm ${item.color}`}
              >
                <item.icono className="size-6" />
              </span>
              <h2 className="text-xl font-extrabold">{item.titulo}</h2>
              <p className="text-sm font-semibold leading-relaxed text-gris">
                {item.texto}
              </p>
            </TarjetaCuerpo>
          </Tarjeta>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="flex items-center justify-center gap-3 text-center text-3xl font-extrabold">
          <Pokebola className="size-8" />
          Cómo funciona
        </h2>

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, i) => (
            <li
              key={paso}
              className="rounded-3xl border-[3px] border-tinta bg-blanco p-5 shadow-dura"
            >
              <span className="mb-3 grid size-10 place-items-center rounded-full border-[3px] border-tinta bg-rojo font-display text-lg font-extrabold text-blanco">
                {i + 1}
              </span>
              <p className="text-sm font-semibold leading-relaxed text-gris">{paso}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
