"use server";

// Bare for /andreas, og bare når Andreas selv trykker på en knapp:
// - getTakenSummary: én totalsum, aldri hvilke ønsker som er tatt eller tall per kategori.
// - checkWishTaken: status for ett enkelt ønske, fra «Sjekk om det er reservert» i editoren.

import { countForItem, countTaken } from "@/lib/reservations";
import { getWishList } from "@/lib/wishes";

export type TakenSummary = { ok: true; taken: number; total: number } | { ok: false };

export async function getTakenSummary(): Promise<TakenSummary> {
  try {
    const list = await getWishList();
    const items = list.categories.flatMap((c) => c.items);
    // Reservasjoner på slettede ønsker telles ikke, fordi vi bare spør om ønsker som finnes.
    const taken = await countTaken(items.filter((it) => !it.multi).map((it) => it.id));
    return { ok: true, taken, total: items.length };
  } catch {
    return { ok: false };
  }
}

export type WishTakenStatus = { ok: true; multi: boolean; count: number } | { ok: false };

export async function checkWishTaken(itemId: string): Promise<WishTakenStatus> {
  try {
    const list = await getWishList();
    const wish = list.categories.flatMap((c) => c.items).find((it) => it.id === itemId);
    if (!wish) return { ok: false };
    return { ok: true, multi: !!wish.multi, count: await countForItem(wish.id) };
  } catch {
    return { ok: false };
  }
}
