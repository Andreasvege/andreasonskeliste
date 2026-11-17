// Kjør: npm run db:migrate  (leser DATABASE_URL fra .env.local)
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Mangler DATABASE_URL");
  process.exit(1);
}
const sql = neon(url);
const statements = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8")
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql.query(stmt);
  console.log("✓", stmt.split("\n")[0]);
}

// Fyll lista fra data/wishes.json første gang (rører ikke en eksisterende liste).
const seed = readFileSync(new URL("../data/wishes.json", import.meta.url), "utf8");
const res = await sql.query(
  "insert into wishlist (id, data) values (1, $1) on conflict (id) do nothing returning id",
  [JSON.stringify(JSON.parse(seed))],
);
console.log(res.length ? "✓ fylte wishlist fra data/wishes.json" : "• wishlist finnes allerede, ikke endret");

// json bevarer rekkefølgen på nøkler (f.eks. størrelser); jsonb sorterer dem.
const [{ data_type }] = await sql.query(
  "select data_type from information_schema.columns where table_name = 'wishlist' and column_name = 'data'",
);
if (data_type === "jsonb") {
  await sql.query("alter table wishlist alter column data type json using data::json");
  console.log("✓ wishlist.data: jsonb → json");
}
