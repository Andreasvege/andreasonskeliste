"use server";

// Redigering fra /andreas. Bevisst uten innlogging (bare for familien).
// Leser og skriver aldri reservasjoner.

import { randomBytes } from "node:crypto";
import { updateTag } from "next/cache";
import { z } from "zod";
import type { Category, Wish } from "@/lib/schema";
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

/** "Løping (om vinteren)" → "loping-om-vinteren" */
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * "Tynn lue (ull)" → "tynn-lue-ull-k3f9". Det tilfeldige tillegget gjør at en
 * id aldri gjenbrukes: et slettet ønske kan ha reservasjoner liggende igjen,
 * og et nytt ønske med samme navn skal ikke arve dem.
 */
function newId(name: string, taken: Set<string>) {
  const base = slugify(name) || "onske";
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
    cat.items = cat.items.filter((it) => it.id !== id);
    await writeWishList(list);
    updateTag(WISHLIST_TAG);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/* ---------------- Kategorier ---------------- */

export type CategoryInput = { name: string; icon: Category["icon"]; position: number };

/**
 * Lagrer en ny eller endret kategori. Adressen (slug) settes én gang og
 * endres ikke ved nytt navn, så delte lenker fortsetter å virke.
 */
export async function saveCategory(args: { slug?: string; category: CategoryInput }): Promise<EditResult> {
  try {
    const list = await readWishListFresh();
    const name = typeof args.category?.name === "string" ? args.category.name.trim().slice(0, 80) : "";
    const icon = args.category?.icon;

    let cat: Category;
    if (args.slug) {
      const idx = list.categories.findIndex((c) => c.slug === args.slug);
      if (idx < 0) return { ok: false, error: "Kategorien finnes ikke lenger" };
      [cat] = list.categories.splice(idx, 1);
      cat.name = name;
      cat.icon = icon;
    } else {
      const taken = new Set(list.categories.map((c) => c.slug));
      const base = slugify(name) || "kategori";
      let slug = base;
      for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
      cat = { slug, name, icon, items: [] };
    }

    const pos = Number.isInteger(args.category?.position) ? args.category.position : list.categories.length;
    list.categories.splice(Math.max(0, Math.min(pos, list.categories.length)), 0, cat);
    await writeWishList(list);
    updateTag(WISHLIST_TAG);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

/** Sletter kategorien med alle ønskene i den. Reservasjoner blir liggende urørt. */
export async function deleteCategory(slug: string): Promise<EditResult> {
  try {
    const list = await readWishListFresh();
    if (!list.categories.some((c) => c.slug === slug)) return { ok: true };
    list.categories = list.categories.filter((c) => c.slug !== slug);
    await writeWishList(list);
    updateTag(WISHLIST_TAG);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
