# Secret Delibird

Intercambio de regalos (amigo secreto) con temática Pokémon y navideña: eventos
propios, invitados por correo, listas de deseos con foto y —en la fase 2— sorteo
con reglas de verdad.

Si vienes a programarlo (o eres un asistente), empieza por
[CLAUDE.md](CLAUDE.md): ahí está cómo se trabaja aquí y las trampas que ya
costaron tiempo.

## Estado

| Fase | Qué incluye | Estado |
| --- | --- | --- |
| 1 | Acceso por magic link, eventos, invitados, correos de invitación, listas de deseos con preview de links, avatar a elegir (entrenador o cualquier Pokémon) | ✅ listo |
| 2 | Reglas del sorteo (exclusiones, listas blancas, asignaciones fijas), sorteo con diagnóstico, correos de "ya salió" y "movieron su lista", botón de revelar con bitácora | ✅ listo |
| 3 | Marcar regalos comprados (invisible para el dueño), editar lo que ya pediste, sacar y meter gente al sorteo, páginas de 404, error y carga | ✅ listo |
| 4 | Cartas de un solo sentido para tu persona del intercambio, con aviso por correo | ✅ listo |

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
- **Plunk** para el correo, con **Resend** de respaldo (se cambia con una
  variable de entorno, sin tocar código)
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

Sin `PLUNK_API_KEY` ni `RESEND_API_KEY` no se manda ningún correo: se imprime
en la consola del servidor y, en `npm run dev`, el magic link también aparece en
pantalla. En local se dejan vacías a propósito, para que una prueba no le llegue
a un invitado de verdad.

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
| `PLUNK_API_KEY` | Vacío en local. En producción, la llave `sk_...` de Plunk |
| `RESEND_API_KEY` | Solo si te regresas a Resend: si hay llave de Plunk, gana Plunk |
| `EMAIL_FROM` | `Secret Delibird <delibird@tudominio.com>` |
| `APP_URL` | La URL pública. Es la base de los magic links |
| `ADMIN_EMAILS` | Correos (separados por coma) que pueden entrar a `/admin`. Vacía, nadie entra |

## Desplegar (Vercel + Neon + Plunk)

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

### 2. Plunk (el correo)

El correo sale por [Plunk](https://useplunk.com). Se paga por correo mandado
(unos 0.001 USD cada uno) y **no tiene tope diario**, que es justo lo que no
servía del plan gratis de Resend: 100 al día se acaban en una sola tanda de
invitaciones.

Lo que hay que hacer en su panel:

1. Verificar el dominio desde donde van a salir los correos. Aquí se manda
   desde el dominio pelón (`delibird@delibird.app`), así que los registros de
   Plunk van en la raíz. La alternativa prudente es verificar un subdominio
   (`email.tudominio.com`), para que un correo marcado como spam no arrastre la
   reputación del dominio principal; si lo haces así, **`EMAIL_FROM` tiene que
   ser una dirección de ese subdominio**.
2. Prender el plan de paga, o los correos salen con la marca de Plunk al pie.
3. Crear una llave secreta (empieza con `sk_`) y ponerla en `PLUNK_API_KEY`.

Los registros de Resend viven bajo `email.delibird.app` (su SPF está en
`send.email.delibird.app`), así que no chocan con los de la raíz: se pueden
tener los dos proveedores verificados al mismo tiempo, que es lo que hace real
el regreso a Resend.

Una advertencia de la raíz: `delibird.app` no tiene MX, o sea que a nadie le
llega lo que conteste a esa dirección. Si alguien le pica a "responder", su
correo se pierde. Se arregla poniendo un MX o mandando un `reply` en el envío.

Ojo con la dirección de la API: la vieja (`api.useplunk.com`) ya contesta `410
Gone`. La buena es `https://next-api.useplunk.com/v1/send`, que es la que trae
el código por omisión; si algún día la vuelven a mover, se cambia con
`PLUNK_API_URL` sin tocar el código ni volver a desplegar.

**Para regresarse a Resend** basta con quitar `PLUNK_API_KEY` y dejar
`RESEND_API_KEY` en Vercel: `src/lib/mail.ts` usa Plunk si hay llave de Plunk y
si no cae a Resend. No hace falta redesplegar, nomás volver a correr el deploy
para que tome las variables.

Aunque ya no haya tope diario, la pantalla de entrada conserva sus topes
(`src/lib/limite-acceso.ts`): un enlace por minuto y cinco por hora por correo
(eso sale de `login_tokens`, que ya guarda un renglón por enlace) y diez por
hora por IP. Ya no es por la cuota sino por la cuenta: cada enlace que alguien
pide se paga, y sin topes cualquiera puede inflarla o llenarle el buzón a quien
se le antoje. Si el proveedor falla (dominio, cuota, red) la pantalla lo dice,
en vez de mandar a la gente a revisar un buzón donde no va a llegar nada.

Para ver si los registros de DNS ya están publicados sin esperar a que el panel
refresque:

```bash
node -e "const d=require('node:dns').promises;d.setServers(['1.1.1.1']);d.resolveTxt('_dkim.tudominio.com').then(r=>console.log(r.flat().join('')))"
```

### 3. Vercel (la app)

Importa el repo, deja el preset de Next.js y pon las seis variables en
Production y Preview:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | la cadena **pooled** de Neon |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `PLUNK_API_KEY` | la llave secreta `sk_...` de Plunk |
| `EMAIL_FROM` | `Secret Delibird <delibird@tudominio.com>` |
| `APP_URL` | `https://tudominio.com` |
| `ADMIN_EMAILS` | tu correo, el mismo con el que entras |

Cambiar una variable no afecta al sitio hasta que vuelves a desplegar.

### 4. El dominio

Cómpralo donde quieras, agrégalo en Settings → Domains y pon los registros que
Vercel te dé (normalmente un `A` de `@` y un `CNAME` de `www`). Después cambia
`APP_URL` al dominio final y redespliega: esa variable es la base de todos los
magic links, así que si apunta al lugar equivocado los correos llevan a la nada.
Si se te olvida ponerla, la app usa el dominio que Vercel le asigna en lugar de
`localhost`, pero es un parche, no el plan.

Vercel y Neon caben en sus planes gratis para un evento familiar (Vercel Hobby
es solo para uso no comercial). Lo que cuesta es el dominio y el correo: Plunk
se paga por correo mandado, que fue el trato a cambio de quitarse el tope diario
de Resend.

## Cómo está armado

```
src/
  actions/     server actions: auth, eventos, sorteo, wishlist, regalos,
               perfil, cartas, admin
  app/         landing, login, /perfil, /eventos, /eventos/[id] (organizador),
               /e/[id] (lo que ve cada invitado), /admin
  components/  UI con tema propio (sin librería de componentes)
  db/          esquema de Drizzle y cliente
  lib/         auth, magic links, correo, scraping de links, sorteo, avatares,
               Pokémon, consultas, límites
```

Dos páginas distintas para el mismo evento: `/eventos/[id]` es la del
organizador (invitados, reglas, sortear, revelar) y `/e/[id]` es la de cada
invitado (su Pokémon, a quién le toca, su lista, su buzón).

Detalles que no se ven pero importan:

- Las páginas por usuario llevan `export const instant = false` y los server
  actions terminan en `refresh()`: con Cache Components, `revalidatePath` no
  basta para que la vista se actualice sola.
- **No metas un `loading.tsx` global.** Con Cache Components el contenido
  dinámico llega en trozos que React inserta con `$RS`; si hay un `loading` de
  por medio, en páginas con varios trozos el reemplazo truena
  (`Cannot read properties of null (reading parentNode)`) y la página se queda
  colgada en "Un momento..." para siempre. El servidor responde bien: el que
  falla es el navegador. Pasó con el panel de admin.
- `src/lib/og.ts` resuelve el DNS del link antes de abrirlo y rechaza IPs
  privadas: cualquier invitado puede pegar una URL y el servidor la visita (SSRF).
- Las imágenes de las listas se muestran con `<img>` y no con `next/image`: son
  de dominios arbitrarios y así no se gasta la cuota de optimización de Vercel.
- La identidad va en dos niveles: el **perfil** (nombre y sprite de entrenador)
  vive en `users` y es el mismo en todos los intercambios; el **Pokémon** vive en
  `participants` y es de cada evento. Donde se pinta a alguien sale su entrenador
  con el Pokémon de ese evento en una insignia al lado. Quien todavía no ha
  entrado no tiene entrenador, así que sale solo su Pokémon.
- Los Pokémon se reparten de entrada sin repetir dentro del mismo evento, con un
  PRNG sembrado con el id del evento (mismo evento, mismo reparto).
- Las **cartas** (`letters`) van en un solo sentido: le escribes a quien te
  tocó y ya. Quien la recibe no puede contestar, porque contestar sería decirle
  a su Santa secreto que ya sabe quién es, así que la carta le llega anónima.
  El remitente sí se guarda —hace falta para cobrar el límite y para que quien
  escribe vea lo que mandó— pero la consulta del buzón ni siquiera lo pide. El
  destinatario tampoco viene del formulario: sale de la asignación, así que no
  hay campo escondido que cambiar para escribirle a quien no te tocó. Límites:
  una carta por minuto y ocho al día por persona, y el aviso por correo no sale
  si ya tiene una sin abrir (ya le avisamos, y al entrar se las encuentra
  todas). El correo no lleva el texto ni dice de quién es.
- **Los enlaces de Amazon salen con el código de afiliado de la casa**, si hay
  uno puesto en `/admin`. Se limpian primero (incluido el código de quien haya
  copiado el enlace) y se marcan al mostrarlos, no al guardarlos: la dirección
  que pegó cada quien se conserva, y cambiar el código cambia todos los enlaces
  de golpe. La lógica vive en `src/lib/amazon.ts` y tiene pruebas.
- **Las listas de deseos son públicas dentro del evento**: cualquiera las ve
  desde la lista de invitados, y el panel de admin las ve todas. Lo que no sale
  ahí es quién ya compró qué; eso sí es del sorteo.
- "Ya lo compré" vive en `reservations` y solo lo lee quien regala: la consulta
  de tu propia lista ni siquiera toca esa tabla, así que no hay forma de que se
  te escape por pantalla. Al volver a sortear se borran, porque eran del reparto
  anterior.
- `/admin` es de solo lectura: usuarios, intercambios y sus invitados, para
  quien esté en `ADMIN_EMAILS`. A los demás les responde 404, como si no
  existiera. No enseña quién le regala a quién; eso sigue siendo solo del botón
  de revelar del organizador, que deja registro. Se llega desde el perfil.

## Nota

Los sprites son de [PokéAPI](https://pokeapi.co). Proyecto personal, sin
afiliación con Nintendo, Creatures ni Game Freak.
