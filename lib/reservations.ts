import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { NeonDbError } from "@neondatabase/serverless";
import { db } from "./db";

export function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function newCode() {
  return randomBytes(32).toString("base64url");
}

/** Antall reservasjoner per ønske. Brukes BARE av gjestesidene. */
export async function getCounts(): Promise<Record<string, number>> {
  const rows = (await db().query(
    "select item_id, count(*)::int as n from reservations group by item_id",
  )) as { item_id: string; n: number }[];
  return Object.fromEntries(rows.map((r) => [r.item_id, r.n]));
}

/** Setter inn en reservasjon. Returnerer false hvis et vanlig ønske allerede er tatt. */
export async function insertReservation(itemId: string, exclusive: boolean, tokenHash: string) {
  try {
    await db().query(
      "insert into reservations (item_id, exclusive, token_hash) values ($1, $2, $3)",
      [itemId, exclusive, tokenHash],
    );
    return true;
  } catch (err) {
    // 23505 = unique_violation på reservations_exclusive_once
    if (err instanceof NeonDbError && err.code === "23505") return false;
    throw err;
  }
}

/** Sletter reservasjonen som hører til koden. Returnerer antall slettede rader. */
export async function deleteReservation(itemId: string, tokenHash: string) {
  const rows = (await db().query(
    "delete from reservations where item_id = $1 and token_hash = $2 returning id",
    [itemId, tokenHash],
  )) as unknown[];
  return rows.length;
}
