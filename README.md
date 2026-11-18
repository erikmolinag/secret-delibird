# Secret Delibird

Intercambio de regalos (amigo secreto) con temática Pokémon y navideña: eventos
propios, invitados por correo, listas de deseos con foto y —en la fase 2— sorteo
con reglas de verdad.

## Estado

| Fase | Qué incluye | Estado |
| --- | --- | --- |
| 1 | Acceso por magic link, eventos, invitados, correos de invitación, listas de deseos con preview de links, avatar a elegir (entrenador o cualquier Pokémon) | ✅ listo |
| 2 | Reglas del sorteo (exclusiones, listas blancas, asignaciones fijas), sorteo con diagnóstico, correos de "ya salió" y "movieron su lista", botón de revelar con bitácora | ✅ listo |
| 3 | Marcar regalos comprados (invisible para el dueño), editar lo que ya pediste, sacar y meter gente al sorteo, páginas de 404, error y carga | ✅ listo |

Los recordatorios por correo antes del evento quedaron fuera a propósito: de los
cuatro avisos posibles elegiste tres, y ese no estaba. Si lo quieres después,
necesita un cron (Vercel Cron, gratis) y una columna para no mandarlo dos veces.

## El sorteo

El motor vive en [`src/lib/sorteo.ts`](src/lib/sorteo.ts) y no toca la base de
datos: entran jugadores y reglas, sale una asignación o una explicación.

Es un emparejamiento perfecto en un grafo bipartito (quien da → quien recibe):

1. **Dominios.** Para cada persona se arma el conjunto de a quién puede
   regalarle: todos menos ella, menos sus exclusiones, y si tiene lista blanca,
   solo los de su lista. Las asignaciones fijas dejan un dominio de uno y borran
   a esa persona del dominio de los demás.
2. **¿Se puede?** Emparejamiento máximo con el algoritmo de Kuhn. Si no alcanza
   para todos, se busca el grupo que rompe la condición de Hall y se dice con
   nombres: *"Ana, Luis y Jorge (3 personas) solo pueden regalarle a María y
   Pedro (2). No alcanza"*. Eso es lo que muestra el panel de reglas en vivo.
3. **Reparto.** Backtracking aleatorizado con MRV (primero quien tenga menos
   opciones), que además respeta "evitar parejas mutuas", algo que el
   emparejamiento solo no puede garantizar.

60 personas con 15 parejas excluidas se resuelven en unos 20 ms.

```bash
npm test             # 11 pruebas del motor, con node --test
npm run mail:preview # escribe los 4 correos en public/correos/ para verlos
```

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
npm run db:migrate          # crea las tablas desde drizzle/
npm run dev                 # http://localhost:3000
```

Sin `RESEND_API_KEY` no se manda ningún correo: el magic link se imprime en la
consola del servidor y, en `npm run dev`, también aparece en pantalla.

Para probar como en producción (los server actions se portan distinto):

```bash
npm run build && npm start
```

## Cambiar el esquema

1. Edita `src/db/schema.ts`.
2. `npm run db:generate` escribe el SQL nuevo en `drizzle/`. **Ese archivo se
   commitea**: es lo que se va a correr en producción.
3. `npm run db:migrate` lo aplica en local; el mismo comando con la `DATABASE_URL`
   de Neon lo aplica en producción.

`npm run db:push` sigue existiendo para iterar rápido en local (sincroniza sin
generar archivos), pero deja la base fuera del registro de migraciones. Si la
usaste y quieres volver al carril, `docker compose down -v && docker compose up -d`
y luego `npm run db:migrate`.

`drizzle.config.ts` respeta la `DATABASE_URL` que ya venga del entorno y solo lee
`.env.local` cuando no hay ninguna, para que una corrida apuntando a otra base no
se quede hablando con la de local.

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

### 1. Neon (la base)

Crea un proyecto con Postgres 17 en la región más cercana a la de Vercel
(`us-east-1` si dejas el default `iad1`). Neon te da **dos** cadenas y la
diferencia importa:

- La **pooled** (dice `-pooler` en el host) va en `DATABASE_URL`. Es la que
  aguanta muchas conexiones cortas, que es justo lo que hace serverless.
- La **directa** (sin `-pooler`) es para correr migraciones: el pooler trabaja
  en modo transacción y se atraganta con algunos DDL.

```bash
DATABASE_URL="postgres://...neon.tech/neondb?sslmode=require" npm run db:migrate
```

El SQL versionado vive en `drizzle/` y se aplica en orden; Drizzle lleva la
cuenta en su propia tabla, así que correrlo dos veces no hace nada. Si prefieres
que Vercel lo corra en cada despliegue, cambia el script `build` a
`drizzle-kit migrate && next build`, a cambio de que un error de migración tumbe
el despliegue.

En el plan gratis la base se duerme a los cinco minutos sin uso: la primera
visita después de un rato tarda un segundo más.

### 2. Resend (el correo)

Crea una API key con permiso solo de envío. Mientras no verifiques un dominio
puedes usar `onboarding@resend.dev`, **pero Resend solo deja mandar a tu propio
correo**: los invitados no van a recibir nada hasta que el dominio esté
verificado. Para verificarlo, Resend te da tres registros de DNS (MX y SPF en el
subdominio `send`, y el DKIM en `resend._domainkey`) que van en la misma zona
donde apuntes el dominio a Vercel.

### 3. Vercel (la app)

Importa el repo, deja el preset de Next.js y pon las cinco variables en
Production y Preview:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | la cadena **pooled** de Neon |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `RESEND_API_KEY` | la key `re_...` |
| `EMAIL_FROM` | `Secret Delibird <delibird@tudominio.com>` |
| `APP_URL` | `https://tudominio.com` |

Cambiar una variable no afecta al sitio hasta que vuelves a desplegar.

### 4. El dominio

Cómpralo donde quieras, agrégalo en Settings → Domains y pon los registros que
Vercel te dé (normalmente un `A` de `@` y un `CNAME` de `www`). Después cambia
`APP_URL` al dominio final y redespliega: esa variable es la base de todos los
magic links, así que si apunta al lugar equivocado los correos llevan a la nada.
Si se te olvida ponerla, la app usa el dominio que Vercel le asigna en lugar de
`localhost`, pero es un parche, no el plan.

Todo esto cabe en los planes gratis de Vercel, Neon y Resend para un evento
familiar (Vercel Hobby es solo para uso no comercial). Lo único que cuesta es el
dominio.

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
- "Ya lo compré" vive en `reservations` y solo lo lee quien regala: la consulta
  de tu propia lista ni siquiera toca esa tabla, así que no hay forma de que se
  te escape por pantalla. Al volver a sortear se borran, porque eran del reparto
  anterior.

## Nota

Los sprites son de [PokéAPI](https://pokeapi.co). Proyecto personal, sin
afiliación con Nintendo, Creatures ni Game Freak.
