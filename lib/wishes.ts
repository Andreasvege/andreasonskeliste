import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import raw from "@/data/wishes.json";
import { db } from "./db";
import { WishListSchema, type WishList } from "./schema";

export * from "./schema";

/** Startverdi: brukes til å fylle databasen første gang, og valideres ved bygging. */
export const seedWishList: WishList = WishListSchema.parse(raw);

export const WISHLIST_TAG = "wishlist";

async function readWishList(): Promise<WishList> {
  const rows = (await db().query("select data from wishlist where id = 1")) as { data: unknown }[];
  return rows.length ? WishListSchema.parse(rows[0].data) : seedWishList;
}

/** Fersk lesing uten cache, til redigering. */
export const readWishListFresh = readWishList;

/** Ønskelista fra databasen. Cachet til den endres (updateTag i redigerings-actions). */
export async function getWishList(): Promise<WishList> {
  "use cache";
  cacheLife("max");
  cacheTag(WISHLIST_TAG);
  return readWishList();
}

/** Validerer og lagrer hele lista. Kaster ZodError hvis den er ugyldig. */
export async function writeWishList(list: WishList): Promise<WishList> {
  const valid = WishListSchema.parse(list);
  await db().query(
    `insert into wishlist (id, data, updated_at) values (1, $1, now())
     on conflict (id) do update set data = excluded.data, updated_at = now()`,
    [JSON.stringify(valid)],
  );
  return valid;
}
