import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import Link from "next/link";
import { Encabezado } from "@/components/encabezado";
import { Nieve } from "@/components/nieve";
import { spritePokemon } from "@/lib/pokemon";

import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Secret Delibird · intercambio de regalos",
    template: "%s · Secret Delibird",
  },
  description:
    "Organiza tu intercambio de regalos con temática Pokémon: eventos, sorteo con reglas y listas de deseos con fotos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${baloo.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Nieve />
        <Encabezado />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>

        <footer className="mt-8 border-t-[3px] border-tinta bg-blanco px-4 py-5 text-center text-xs text-gris">
          Sprites de{" "}
          <a
            href="https://pokeapi.co"
            className="font-bold text-azul underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            PokéAPI
          </a>{" "}
          y{" "}
          <a
            href="https://play.pokemonshowdown.com"
            className="font-bold text-azul underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Pokémon Showdown
          </a>
          . Proyecto personal, sin afiliación con Nintendo, Creatures ni Game Freak.
          <span className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link
              href="/privacidad"
              className="font-bold text-azul underline-offset-2 hover:underline"
            >
              Aviso de privacidad
            </Link>
            <Link
              href="/terminos"
              className="font-bold text-azul underline-offset-2 hover:underline"
            >
              Términos de uso
            </Link>
          </span>
          <span className="mt-1.5 flex items-center justify-center gap-1.5">
            Desarrollado por{" "}
            <a
              href="https://erikmolina.com"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-azul underline-offset-2 hover:underline"
            >
              erks
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={spritePokemon(94)}
              alt=""
              aria-hidden
              className="size-7 object-contain [image-rendering:pixelated]"
              referrerPolicy="no-referrer"
            />
          </span>
        </footer>
      </body>
    </html>
  );
}
