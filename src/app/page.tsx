import { Gift, ListChecks, Mail, Shuffle } from "lucide-react";

import { BotonLink } from "@/components/ui/boton";
import { Tarjeta, TarjetaCuerpo } from "@/components/ui/tarjeta";
import { DELIBIRD_ID, artePokemon, spritePokemon } from "@/lib/pokemon";

const CARACTERISTICAS = [
  {
    icono: Shuffle,
    titulo: "Sorteo con reglas",
    texto:
      "Excluye parejas, limita a quién le puede tocar cada quien y fija los casos especiales. El sorteo respeta todo o te dice por qué no se puede.",
    pokemon: 215,
  },
  {
    icono: ListChecks,
    titulo: "Listas con foto",
    texto:
      "Pega el link de lo que quieres y aparece la imagen del producto. Quien te regala ve exactamente qué pedir, sin adivinar.",
    pokemon: 582,
  },
  {
    icono: Mail,
    titulo: "Sin contraseñas",
    texto:
      "Cada invitado entra con un enlace que le llega por correo. Nadie se registra, nadie olvida su contraseña.",
    pokemon: 613,
  },
];

const PASOS = [
  "Creas el evento con fecha, lugar y presupuesto.",
  "Agregas los correos de los invitados y les llega su invitación.",
  "Cada quien arma su lista de deseos pegando links.",
  "Corres el sorteo y a cada uno le llega a quién le toca regalar.",
];

export default function Inicio() {
  return (
    <div className="space-y-20">
      <section className="relative grid items-center gap-8 pt-6 md:grid-cols-[1.15fr_1fr]">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-dorado/40 bg-dorado/10 px-3 py-1 text-sm font-bold text-dorado">
            <Gift className="size-4" />
            Intercambio de regalos, versión Pokémon
          </p>

          <h1 className="text-balance text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
            El <span className="text-rojo">amigo secreto</span> que reparte{" "}
            <span className="text-dorado">Delibird</span>
          </h1>

          <p className="max-w-xl text-lg text-humo">
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
          <div className="absolute inset-0 -z-10 rounded-full bg-rojo/20 blur-3xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artePokemon(DELIBIRD_ID)}
            alt="Delibird cargando su saco de regalos"
            className="mx-auto w-full drop-shadow-[0_25px_45px_rgba(0,0,0,0.65)]"
          />
          <div className="mt-2 text-center text-sm font-bold text-hielo">
            Delibird reparte lo que le encargues
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {CARACTERISTICAS.map((item) => (
          <Tarjeta key={item.titulo} className="relative overflow-hidden">
            <TarjetaCuerpo className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={spritePokemon(item.pokemon)}
                alt=""
                aria-hidden
                className="absolute -right-3 -top-3 size-24 opacity-15 [image-rendering:pixelated]"
              />
              <item.icono className="size-7 text-dorado" />
              <h2 className="text-xl font-bold">{item.titulo}</h2>
              <p className="text-sm leading-relaxed text-humo">{item.texto}</p>
            </TarjetaCuerpo>
          </Tarjeta>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-3xl font-extrabold">Cómo funciona</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, i) => (
            <li
              key={paso}
              className="rounded-3xl border border-noche-borde/70 bg-noche-suave/60 p-5"
            >
              <span className="mb-3 grid size-9 place-items-center rounded-full bg-rojo font-display font-extrabold text-nieve">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-humo">{paso}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
