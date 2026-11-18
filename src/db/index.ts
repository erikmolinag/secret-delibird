import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

const connectionString = process.env.DATABASE_URL;
const isLocal =
  !!connectionString &&
  (connectionString.includes("localhost") || connectionString.includes("127.0.0.1"));

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    max: 5,
    // Neon exige TLS; el Postgres local de Docker no lo tiene.
    // Pedimos la verificación del certificado aquí y no con sslmode en la URL:
    // en pg 9 'require' va a pasar a significar "cifra pero no verifiques", y
    // esta opción explícita le gana a lo que diga la cadena de conexión.
    ssl: isLocal ? false : { rejectUnauthorized: true },
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
