import "server-only";
import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

/** Lat initialisering, så bygget ikke krever DATABASE_URL. */
export function db() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL mangler");
    client = neon(url);
  }
  return client;
}
