"use server";

// Bare for /andreas: en totalsum, hentet først når Andreas trykker på knappen.
// Returnerer aldri hvilke ønsker som er tatt, og ingen tall per kategori.

import { countTaken } from "@/lib/reservations";
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
