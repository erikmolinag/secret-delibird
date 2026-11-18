# Secret Delibird

Intercambio de regalos (amigo secreto) con temática Pokémon y navideña: eventos
propios, invitados por correo, listas de deseos con foto y —en la fase 2— sorteo
con reglas de verdad.

## Estado

| Fase | Qué incluye | Estado |
| --- | --- | --- |
| 1 | Acceso por magic link, eventos, invitados, correos de invitación, listas de deseos con preview de links, avatar a elegir (entrenador o cualquier Pokémon) | ✅ listo |
| 2 | Reglas del sorteo (exclusiones, listas blancas, pins), sorteo, correo de "ya te tocó", aviso de lista actualizada | ⏳ pendiente |
| 3 | Tema a fondo, apartar regalos sin que el dueño lo vea, pulido | ⏳ pendiente |

Las tablas de la fase 2 (`rules`, `assignments`, `reservations`, `reveal_log`) ya
existen en la base de datos.

## Stack

- **Next.js 16** (App Router, Cache Components) + TypeScript
- **Tailwind v4** — el tema vive en `src/app/globals.css`
- **Postgres** con **Drizzle ORM** (local en Docker, en producción Neon)
- **Magic links** propios (`jose` + tokens de un solo uso en la base)
- **Resend** para el correo
- **PokéAPI** para los sprites y la lista de la Pokédex (sin API key)
- **Pokémon Showdown** para los sprites de entrenador

## Diseño

El tema es "papel de Pokémon con adornos navideños": fondo crema con textura de
puntos, contornos gruesos de tinta azul marino (`--color-tinta`), sombras duras
sin blur y los colores del logo (amarillo `#FFCB05`, azul `#2A75BB`) con el rojo
de pokébola y un verde de pino.

- Los colores y las sombras viven en el `@theme` de `src/app/globals.css`.
- Ahí también están las utilidades propias: `franja-pokebola`, `raya-caramelo`
  y `texto-logo` (relleno amarillo con contorno azul, como el logotipo).
- Los adornos (pokébola, acebo, bastón, estrella) son SVG en
  `src/components/adornos.tsx`, no imágenes.
- Sin modo oscuro a propósito: un solo tema, claro.

## Arrancar en local

Necesitas Node 24+ y Docker.

```bash
docker compose up -d        # Postgres en localhost:5433
npm install
npm run db:push             # crea las tablas
npm run dev                 # http://localhost:3000
```

Sin `RESEND_API_KEY` no se manda ningún correo: el magic link se imprime en la
consola del servidor y, en `npm run dev`, también aparece en pantalla.

Para probar como en producción (los server actions se portan distinto):

```bash
npm run build && npm start
```

## Variables de entorno

Copia `.env.example` a `.env.local`:

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | Postgres. Local: `postgres://delibird:delibird@localhost:5433/secret_delibird` |
| `AUTH_SECRET` | Firma la cookie de sesión. `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `RESEND_API_KEY` | Vacío en local. En producción, la key de Resend |
| `EMAIL_FROM` | `Secret Delibird <delibird@tudominio.com>` |
| `APP_URL` | La URL pública. Es la base de los magic links |

## Desplegar (Vercel + Neon + Resend)

1. **Neon**: crea un proyecto y copia la connection string (la pooled) a `DATABASE_URL`.
2. **Vercel**: importa el repo, pega las cuatro variables y despliega.
3. **Migraciones**: `npm run db:push` apuntando a Neon, o `npm run db:generate` +
   `npm run db:migrate` si prefieres migraciones versionadas.
4. **Resend**: verifica el dominio (te da registros SPF y DKIM para el DNS) y usa
   `delibird@tudominio.com` en `EMAIL_FROM`. Mientras tanto sirve
   `onboarding@resend.dev`, pero cae en spam más fácil.
5. **Dominio**: apúntalo a Vercel y pon `APP_URL=https://tudominio.com`.

Todo esto cabe en los planes gratis de Vercel, Neon y Resend para un evento
familiar. Lo único que cuesta es el dominio.

## Cómo está armado

```
src/
  actions/     server actions (auth, eventos, wishlist)
  app/         rutas: landing, login, /eventos, /eventos/[id], /e/[id]
  components/  UI con tema propio (sin librería de componentes)
  db/          esquema de Drizzle y cliente
  lib/         auth, magic links, correo, scraping de links, Pokémon, queries
```

Detalles que no se ven pero importan:

- Las páginas por usuario llevan `export const instant = false` y los server
  actions terminan en `refresh()`: con Cache Components, `revalidatePath` no
  basta para que la vista se actualice sola.
- `src/lib/og.ts` resuelve el DNS del link antes de abrirlo y rechaza IPs
  privadas: cualquier invitado puede pegar una URL y el servidor la visita (SSRF).
- Las imágenes de las listas se muestran con `<img>` y no con `next/image`: son
  de dominios arbitrarios y así no se gasta la cuota de optimización de Vercel.
- Los avatares Pokémon se reparten sin repetir dentro del mismo evento, con un
  PRNG sembrado con el id del evento (mismo evento, mismo reparto).

## Nota

Los sprites son de [PokéAPI](https://pokeapi.co). Proyecto personal, sin
afiliación con Nintendo, Creatures ni Game Freak.
