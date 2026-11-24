# Para quien venga a programar esto

Notas para el siguiente asistente (o para mí dentro de tres meses). El
[README](README.md) cuenta **qué es** el proyecto y **cómo desplegarlo**; esto
cuenta **cómo se trabaja aquí** y qué trampas ya costaron tiempo.

Si solo vas a leer una sección, que sea
[Antes de subir nada](#antes-de-subir-nada).

---

## Lo básico

- **Sitio:** https://delibird.app · **Repo:** `erikmolinag/secret-delibird`
- **Rama única:** `main`. Un push a `main` dispara el despliegue en Vercel.
- **No hay `gh` instalado.** Para hablar con GitHub, `curl` a su API. El repo es
  público, así que leer no necesita llave.
- **Base:** Postgres. Local en Docker (`localhost:5433`), producción en Neon.
- **Correo:** Plunk. En local **no hay llaves a propósito**, para que una prueba
  no le llegue a un invitado de verdad: el correo se imprime en la consola.

## Cómo se escribe aquí

- **Todo en español**: identificadores, comentarios, textos de pantalla y
  mensajes de commit. `enviarCartaAccion`, no `sendLetterAction`.
- Los **comentarios explican el porqué**, no el qué. Si el código ya dice lo que
  hace, el comentario sobra; lo que no se ve es la razón, y ésa sí se escribe.
- Los **mensajes de commit van en español y sin acentos** (así está todo el
  historial). Primera línea corta en infinitivo o imperativo, y abajo el porqué
  y lo que se probó. Terminan con la línea `Co-Authored-By:` que pida el entorno.
- **Sin librería de componentes.** La UI se arma con los primitivos de
  `src/components/ui/` (`Tarjeta`, `Campo`, `Boton`, `Insignia`) y el tema de
  `src/app/globals.css`. Antes de inventar un estilo, busca si ya existe.
- **Sin modo oscuro.** Un solo tema, claro.

## Antes de subir nada

```bash
npx tsc --noEmit     # tipos
npm run lint         # eslint (incluye las reglas de react-hooks)
npm test             # 11 pruebas del motor del sorteo
npm run build        # Turbopack
```

Y para verlo de verdad, **`npm run build && npm start`**, no `npm run dev`: el
panel del navegador no hidrata bien con el dev server, y los server actions se
portan distinto. Hay un `.claude/launch.json` listo para que `preview_start` lo
levante.

### El orden importa: primero la migración, luego el push

**El build de Vercel no corre migraciones.** Si subes código que lee una tabla o
columna nueva antes de crearla en Neon, la página truena para todos. El orden es:

1. Editas `src/db/schema.ts`.
2. `npm run db:generate` escribe el SQL en `drizzle/`. **Ese archivo se commitea.**
   Sale con un nombre aleatorio (`0006_mean_naoko.sql`): renómbralo a algo que se
   entienda (`0006_cartas.sql`) y cambia también el `tag` en
   `drizzle/meta/_journal.json`.
3. Lo aplicas en **local**.
4. Lo aplicas en **Neon** (con la cadena **directa**, la que no dice `-pooler`;
   el pooler se atraganta con algunos DDL):
   ```bash
   DATABASE_URL="<cadena directa de Neon>" npm run db:migrate
   ```
5. **Ahora sí** `git push`.

La cadena de Neon **nunca se escribe en un archivo**: va en la misma línea del
comando y ya. Las llaves de producción viven en Vercel, no en el repo.

Correr una migración contra producción es una acción que el entorno puede
bloquear. Si pasa, no le des la vuelta: pídele a Erik que la corra él o que te
autorice.

### Verificar que el despliegue salió

```bash
curl -s https://api.github.com/repos/erikmolinag/secret-delibird/commits/<sha>/status
```

Devuelve `pending` mientras Vercel construye y `success` cuando terminó. Tarda
entre uno y dos minutos. No lo des por hecho: ese `state` es la única prueba.

## Trampas que ya costaron tiempo

### Next 16 con Cache Components

- Las páginas que dependen de la sesión llevan `export const instant = false`, y
  los server actions terminan en `refresh()` (de `next/cache`). `revalidatePath`
  **no** basta para que la vista se actualice sola.
- **No metas un `loading.tsx` global.** El contenido dinámico llega en trozos que
  React inserta con `$RS`; con un `loading` de por medio el reemplazo truena
  (`Cannot read properties of null (reading parentNode)`) y la página se queda
  colgada en "Un momento..." para siempre. El servidor responde bien: el que
  falla es el navegador.
- Por lo mismo, **el streaming mueve los nodos del DOM**. Un `ref` tomado antes
  del reemplazo apunta a un nodo que ya no está en la página. Si necesitas
  alcanzar un elemento después, búscalo con `document.querySelector` (hay un
  caso así en `src/components/selector-entrenador.tsx`).

### React 19

- **Al terminar un server action, React vacía los campos del formulario que no
  controla.** Si un envío puede fallar (un límite, una validación) y no quieres
  que la persona pierda lo que escribió, el campo tiene que ser controlado
  (`value` + `onChange`). Pasó con las cartas: el límite las rechazaba y de paso
  te borraba el texto.
- Para vaciar un formulario **después de un envío bueno**, cambia la `key` del
  subcomponente en vez de limpiarlo desde un `useEffect`: la regla
  `react-hooks/set-state-in-effect` rebota lo segundo. El patrón está en
  `src/components/formulario-carta.tsx`.
- Un archivo `"use server"` **solo puede exportar funciones asíncronas**. Las
  constantes que también necesita el navegador van a su propio módulo en
  `src/lib/` (ejemplo: `src/lib/cartas.ts`).

### Al probar en el navegador

- **Mide el DOM en vez de confiar en la captura.** El bug de "no se guarda el
  entrenador" no era de guardado: el botón quedaba 463 px abajo del borde en una
  pantalla de 375. Eso se ve con `javascript_tool` y `getBoundingClientRect()`,
  no mirando una imagen.
- Las capturas del panel vienen escaladas, así que **no sirven para juzgar la
  nitidez de una imagen**. Para eso, recorta y amplía el archivo con `sharp`
  (está en `node_modules`) y míralo aparte.
- `scrollIntoView({ behavior: "smooth" })` no hace nada en ese panel. Usa el
  salto instantáneo.
- Para escribir en un campo, `form_input` con el `ref` es más confiable que
  hacer clic por coordenadas: la página se reacomoda mientras carga.

### Scripts de un solo uso

- Si el script necesita un paquete del proyecto (`pg`, `sharp`), **tiene que
  vivir dentro de la carpeta del proyecto** o Node no lo resuelve. Escríbelo,
  córrelo y bórralo en el mismo comando.
- Para hablar con la base local sin exponer la cadena:
  ```js
  import { readFileSync } from "node:fs";
  import pg from "pg";
  const url = readFileSync(".env.local", "utf8")
    .match(/^DATABASE_URL\s*=\s*"?([^"\n\r]+)"?/m)[1];
  const c = new pg.Client({ connectionString: url });
  ```
- **Cuidado al generar código desde la terminal.** `perl -0pi` con `\Q...\E` se
  come los `\n`, y un template literal de Node dentro de un heredoc de bash
  desescapa dos veces (`\\s` acaba siendo `s`). Ya dejó regexes rotas en el
  repo. Usa la herramienta de escritura de archivos, o scripts con cadenas
  normales y expresiones sin diagonales invertidas.

## Lo que nunca debe filtrarse

Esto es un amigo secreto: medio producto es guardar secretos. Antes de tocar una
consulta, pregúntate qué deja ver.

- **Quién le regala a quién.** Solo lo ve el organizador con el botón de revelar,
  y queda registrado en `reveal_log`. No sale en `/admin` ni en ninguna lista.
- **"Ya lo compré"** vive en `reservations`, y la consulta de tu propia lista ni
  siquiera toca esa tabla: no hay forma de que se te escape por pantalla. Las
  listas de deseos sí son públicas dentro del evento (se ven desde la lista de
  invitados y desde el panel de admin), pero quien las pinta ahí es
  `ListaPublica`, que a propósito no sabe nada de compras.
- **Quién te escribió una carta.** `letters` guarda el remitente (hace falta para
  los límites y para que quien escribe vea lo que mandó), pero la consulta del
  buzón **no lo pide**. Lo que no se trae no se filtra por accidente.
- **El destinatario de una carta no viene del formulario**: sale de la asignación
  del sorteo, en el servidor. Así no hay campo escondido que cambiar.
- **`/admin`** responde 404 a quien no esté en `ADMIN_EMAILS`, no "prohibido":
  para los demás no existe.
- **`src/lib/og.ts`** resuelve el DNS antes de abrir un link y rechaza IPs
  privadas, revisando **cada salto** de redirección. Cualquier invitado puede
  pegar una URL y el servidor la visita: eso es SSRF si no se cuida.

## Ajustes del sitio

Lo que pone quien administra y vale para todo el sitio vive en la tabla
`settings` (clave y valor) y se edita desde `/admin`. Hoy solo está el código
de afiliado de Amazon (`amazon_tag`). Para agregar otro no hace falta migrar:
se usa `leerAjuste` / `guardarAjuste` de `src/lib/ajustes.ts`.

Los enlaces de Amazon se marcan **al leerlos** (en `listaDeDeseos` y
`listasDelEvento`), no al guardarlos. Así la dirección que pegó cada quien se
queda intacta y un cambio de código se nota en todos los enlaces de inmediato.
`src/lib/amazon.ts` es puro —entra una cadena, sale otra— y tiene sus pruebas
en `pruebas/amazon.test.ts`.

## El correo

- `src/lib/mail.ts` intenta con **Plunk** y, si Plunk no está, **se cae solo a
  Resend**. No reintenta cuando el que falla dice que el correo va mal armado
  (`400`, `422`): el otro contestaría lo mismo. Las pruebas están en
  `pruebas/correo.test.ts`, con los dos proveedores de mentiras en localhost
  (`PLUNK_API_URL` y `RESEND_BASE_URL`, que su SDK respeta).
- **Cada proveedor manda desde su dominio verificado** y rechaza el remitente
  del otro: Plunk `delibird.app`, Resend `email.delibird.app`. De ahí
  `EMAIL_FROM_PLUNK` y `EMAIL_FROM_RESEND`; `EMAIL_FROM` es la de los dos
  cuando no traen la suya. Si pones una sola, el respaldo falla justo cuando se
  necesita.
- El 23 de noviembre de 2026 Plunk contestó `500` a todo lo autenticado —hasta
  su propio login— con la página de estado en verde. Nadie podía entrar a la
  app, porque entrar *es* un correo. Por eso existe la caída automática: no
  confíes en un solo proveedor para el acceso.
- La dirección vieja de Plunk (`api.useplunk.com`) contesta **410**. La buena es
  `https://next-api.useplunk.com/v1/send`, que es la que trae el código; se puede
  apuntar a otra con `PLUNK_API_URL`.
- **Todo texto que escribió una persona pasa por `escapar()`** antes de entrar al
  HTML del correo. Un evento llamado `Posada <b>` dejaba el correo chueco.
- El dibujo del encabezado se sirve desde el sitio con la dirección escrita
  completa (`https://delibird.app/delibird-correo.png`) y no con `urlBase()`:
  ésa apunta a `localhost` cuando el correo se arma desde la máquina, y la vista
  previa saldría sin imagen.
- `npm run mail:preview` escribe los correos en `public/correos/` (ignorado por
  git) para abrirlos en el navegador.
- Para probar un envío de verdad sin molestar a nadie, Resend tiene
  `delivered@resend.dev`.

## Dónde está cada cosa

```
src/
  actions/     server actions: auth, eventos, sorteo, wishlist, regalos,
               perfil, cartas, admin
  app/         landing, login, /perfil, /eventos, /eventos/[id] (organizador),
               /e/[id] (lo que ve cada invitado), /admin
  components/  UI propia; los primitivos en components/ui/
  db/          esquema de Drizzle y cliente
  lib/         auth, magic links, correo, scraping de links (og.ts), sorteo,
               avatares, Pokémon, consultas (datos.ts), límites
drizzle/       el SQL versionado. Se commitea.
pruebas/       las pruebas del motor del sorteo (node --test)
herramientas/  la vista previa de correos
```

Dos páginas distintas para el mismo evento: **`/eventos/[id]`** es la del
organizador (invitados, reglas, sortear, revelar) y **`/e/[id]`** es la de cada
invitado (su Pokémon, a quién le toca, su lista, su buzón). Es fácil confundirse.

La identidad va en dos niveles: el **perfil** (nombre y sprite de entrenador)
vive en `users` y es el mismo en todos los intercambios; el **Pokémon** vive en
`participants` y es de cada evento.

## Datos para probar en local

La base local trae un evento ya sorteado con cinco personas. Para encontrar tu
ficha y a quién le toca:

```sql
select id, name, status from events order by created_at desc;

select g.id as quien_da, g.name, r.id as quien_recibe, r.name
from assignments a
join participants g on g.id = a.giver_id
join participants r on r.id = a.receiver_id;
```

Con el id de un participante entras directo a `/e/<id>` (la sesión local ya está
iniciada). Si metiste datos de prueba, **bórralos al terminar**.

## Hilos abiertos

- **"Santa secreto" contra "amigo secreto".** Erik cambió los textos de las
  cartas a "tu amigo secreto", pero quedaron dos lugares con el vocabulario
  viejo: la firma de cada carta en el buzón (`src/app/e/[id]/page.tsx`) y el
  correo de aviso (`plantillaCarta` en `src/lib/mail.ts`). Está pendiente su
  decisión.
- **Recordatorios antes del evento**: quedaron fuera a propósito. Si se piden,
  necesitan un cron (Vercel Cron) y una columna para no mandarlos dos veces.
- **Tiendas que no se dejan raspar.** Sanborns contesta 403 y El Palacio de
  Hierro reconoce que no es un navegador de verdad (es la huella de la conexión,
  no las cabeceras). No se arregla sin un navegador headless; para esos casos
  quedan subir la foto o pegar la dirección de la imagen.

## Cómo le gusta trabajar a Erik

- Pide los cambios en lotes y en español, a veces a media tarea: si llega uno
  nuevo mientras trabajas, entra en el mismo lote.
- Quiere **que se verifique**, no que se prometa. "Ya quedó" sin una prueba no
  vale; si algo no se pudo probar, se dice cuál y por qué.
- Cuando algo es visual y nuevo, prefiere **verlo en local antes de subirlo**.
  Para un ajuste pequeño de algo que ya existe, no hace falta preguntar.
- Si una decisión de diseño se toma sin que la pidiera (quitar una sombra,
  escoger anónimo), hay que **decírselo explícitamente** para que pueda
  revertirla. Una vez pidió de vuelta una sombra que yo había quitado.
