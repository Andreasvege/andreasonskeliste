"use server";

import { refresh } from "next/cache";
import { findWishIn, getWishList } from "@/lib/wishes";
import { deleteReservation, hashCode, insertReservation, newCode } from "@/lib/reservations";

export type ReserveResult =
  | { ok: true; code: string }
  | { ok: false; reason: "taken" | "unknown" | "error" };

export type UnreserveResult = { ok: boolean };

// Ingen logging av hvem som reserverer: vi tar bare imot ønske-id (og angre-kode).

export async function reserve(itemId: unknown): Promise<ReserveResult> {
  const wish = typeof itemId === "string" ? findWishIn(await getWishList(), itemId) : undefined;
  if (!wish) return { ok: false, reason: "unknown" };

  const code = newCode();
  try {
    const inserted = await insertReservation(wish.id, !wish.multi, hashCode(code));
    // Uansett utfall: send oppdaterte tall tilbake i samme rundtur.
    refresh();
    return inserted ? { ok: true, code } : { ok: false, reason: "taken" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function unreserve(itemId: unknown, code: unknown): Promise<UnreserveResult> {
  if (typeof itemId !== "string" || typeof code !== "string" || code.length > 100) {
    return { ok: false };
  }
  try {
    await deleteReservation(itemId, hashCode(code));
    refresh();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
