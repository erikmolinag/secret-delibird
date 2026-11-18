import { defineConfig } from "drizzle-kit";

// Si ya viene DATABASE_URL del entorno (producción, o una corrida puntual
// contra otra base) manda esa. El .env.local es solo la comodidad de local.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // sin archivo: las variables tienen que venir del entorno
  }
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
