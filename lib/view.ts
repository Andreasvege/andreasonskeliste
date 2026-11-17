import type { Category, Wish, WishList } from "./schema";

export type Mode = "guest" | "owner";

/** Antall reservasjoner per ønske-id. `null` = ukjent (owner, eller ikke lastet ennå). */
export type Counts = Record<string, number> | null;

const MONTHS = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

/** Dagens dato i Europe/Oslo som "YYYY-MM-DD". */
export function osloToday(now = new Date()): string {
  // en-CA gir ISO-format (YYYY-MM-DD)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** "2026-11-30" → "30. nov" */
export function fmtDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${parseInt(d, 10)}. ${MONTHS[parseInt(m, 10) - 1]}`;
}

/** Tilbudet er aktivt når until >= i dag. Uten kjent dato vises ingen tilbud. */
export function activeSale(it: Wish, today: string | null) {
  if (!it.sale || !today) return null;
  return it.sale.until >= today ? it.sale : null;
}

export function countFor(it: Wish, counts: Counts): number {
  return counts?.[it.id] ?? 0;
}

/** Et vanlig ønske er tatt når noen har reservert det. Multi-ønsker er aldri «tatt». */
export function isTaken(it: Wish, counts: Counts): boolean {
  return !it.multi && countFor(it, counts) > 0;
}

function plural(n: number) {
  return `${n} ${n === 1 ? "ønske" : "ønsker"}`;
}

/** Gjester med kjente tall ser «ledige»; owner og ukjente tall ser bare antall. */
function showsFree(mode: Mode, counts: Counts) {
  return mode === "guest" && counts !== null;
}

export function categoryMeta(cat: Category, mode: Mode, counts: Counts, today: string | null): string {
  const n = cat.items.length;
  const hideTaken = showsFree(mode, counts);
  const free = cat.items.filter((it) => !isTaken(it, counts)).length;
  // Tilbud på ønsker som allerede er tatt telles ikke for gjester.
  const sales = cat.items.filter(
    (it) => activeSale(it, today) && (!hideTaken || !isTaken(it, counts)),
  ).length;
  let s = hideTaken ? `${plural(n)} · ${free} ledige` : plural(n);
  if (sales > 0) s += ` · ${sales} på tilbud`;
  return s;
}

export function listSummary(list: WishList, mode: Mode, counts: Counts): string {
  const items = list.categories.flatMap((c) => c.items);
  const base = `${list.categories.length} kategorier · ${plural(items.length)}`;
  if (!showsFree(mode, counts)) return base;
  const free = items.filter((it) => !isTaken(it, counts)).length;
  return `${base} · ${free} ledige`;
}

/** Størrelser som faktisk er fylt inn: "overdel M · sko 44". Tom streng hvis ingen. */
export function sizesLine(sizes: Record<string, string>): string {
  return Object.entries(sizes)
    .filter(([, v]) => v.trim() && !v.includes("[fyll inn]"))
    .map(([k, v]) => `${k} ${v}`)
    .join(" · ");
}

/** "/" for gjester, "/andreas" for owner. */
export function basePath(mode: Mode) {
  return mode === "owner" ? "/andreas" : "";
}
