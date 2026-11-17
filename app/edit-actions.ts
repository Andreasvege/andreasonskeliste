"use server";

// Redigering fra /andreas. Bevisst uten innlogging (bare for familien).
// Leser og skriver aldri reservasjoner.

import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { z } from "zod";
import type { Wish } from "@/lib/schema";
import { readWishListFresh, WISHLIST_TAG, writeWishList } from "@/lib/wishes";

export type EditResult = { ok: true } | { ok: false; error: string };

/** Det modalen sender inn. Tomme felt fjernes før lagring. */
export type WishInput = {
  name: string;
  note: string;
  hand: string;
  multi: boolean;
  star: boolean;
  links: { label: string; url: string }[];
  sale: { price: string; was: string; until: string };
};

const MAX = 300;

function clean(input: WishInput, id: string): Wish {
  const t = (s: unknown) => (typeof s === "string" ? s.trim().slice(0, MAX) : "");
  const withProtocol = (url: string) => (url && !/^https?:\/\//i.test(url) ? `https://${url}` : url);

  const links = (Array.isArray(input.links) ? input.links : [])
    .slice(0, 5)
    .map((l) => ({ label: t(l?.label), url: withProtocol(t(l?.url)) }))
    .filter((l) => l.label || l.url)
    .map((l) => ({ label: l.label || "Se produktet", url: l.url }));

  const sale = { price: t(input.sale?.price), was: t(input.sale?.was), until: t(input.sale?.until) };
  const hasSale = sale.price || sale.was || sale.until;

  const wish: Wish = { id, name: t(input.name) };
  if (t(input.note)) wish.note = t(input.note);
  if (t(input.hand)) wish.hand = t(input.hand);
  if (input.multi === true) wish.multi = true;
  if (input.star === true) wish.star = true;
  if (links.length) wish.links = links;
  if (hasSale) wish.sale = sale;
  return wish;
}

/**
 * "Tynn lue (ull)" → "tynn-lue-ull-k3f9". Det tilfeldige tillegget gjør at en
 * id aldri gjenbrukes: et slettet ønske kan ha reservasjoner liggende igjen,
 * og et nytt ønske med samme navn skal ikke arve dem.
 */
function newId(name: string, taken: Set<string>) {
  const base =
    name
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "onske";
  let id: string;
  do {
    id = `${base}-${randomBytes(3).toString("hex").slice(0, 4)}`;
  } while (taken.has(id));
  return id;
}

function errorMessage(err: unknown) {
  if (err instanceof z.ZodError) return err.issues[0]?.message ?? "Ugyldige verdier";
  return "Noe gikk galt. Prøv igjen.";
}

/** Lagrer et nytt eller endret ønske. `id` mangler for nye ønsker. */
export async function saveWish(args: { id?: string; categorySlug: string; wish: WishInput }): Promise<EditResult> {
  try {
    const list = await readWishListFresh();
    const target = list.categories.find((c) => c.slug === args.categorySlug);
    if (!target) return { ok: false, error: "Fant ikke kategorien" };

    let id: string;
    let insertAt = target.items.length;
    if (args.id) {
      // Endre: behold id-en (den kobler ønsket til reservasjoner) og plassen i lista.
      const from = list.categories.find((c) => c.items.some((it) => it.id === args.id));
      if (!from) return { ok: false, error: "Ønsket finnes ikke lenger" };
      const idx = from.items.findIndex((it) => it.id === args.id);
      from.items.splice(idx, 1);
      if (from === target) insertAt = idx;
      id = args.id;
    } else {
      id = newId(String(args.wish?.name ?? ""), new Set(list.categories.flatMap((c) => c.items.map((it) => it.id))));
    }

    target.items.splice(insertAt, 0, clean(args.wish, id));
    await writeWishList(list);
    updateTag(WISHLIST_TAG);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/**
 * Sletter et ønske fra lista. Eventuelle reservasjoner blir liggende urørt i
 * databasen (vi ser aldri på dem her), de vises bare ikke lenger.
 */
export async function deleteWish(id: string): Promise<EditResult> {
  try {
    const list = await readWishListFresh();
    const cat = list.categories.find((c) => c.items.some((it) => it.id === id));
    if (!cat) return { ok: true };
    if (cat.items.length === 1) {
      return { ok: false, error: "En kategori må ha minst ett ønske" };
    }
    cat.items = cat.items.filter((it) => it.id !== id);
    await writeWishList(list);
    updateTag(WISHLIST_TAG);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
