"use client";

import { useId, useRef, useState, useTransition } from "react";
import { deleteWish, saveWish, type WishInput } from "@/app/edit-actions";
import type { Wish } from "@/lib/schema";

type CategoryOption = { slug: string; name: string };

function emptyInput(): WishInput {
  return { name: "", note: "", hand: "", multi: false, star: false, links: [], sale: { price: "", was: "", until: "" } };
}

function toInput(w: Wish): WishInput {
  return {
    name: w.name,
    note: w.note ?? "",
    hand: w.hand ?? "",
    multi: !!w.multi,
    star: !!w.star,
    links: w.links?.map((l) => ({ ...l })) ?? [],
    sale: { price: w.sale?.price ?? "", was: w.sale?.was ?? "", until: w.sale?.until ?? "" },
  };
}

/* ---------- Knapper som åpner modalen ---------- */

export function EditWishButton(props: { wish: Wish; categorySlug: string; categories: CategoryOption[] }) {
  return <WishDialog {...props} title="Rediger ønske" />;
}

export function NewWishButton(props: { categorySlug: string; categories: CategoryOption[] }) {
  return <WishDialog {...props} title="Nytt ønske" />;
}

/* ---------- Selve modalen ---------- */

function WishDialog({
  wish,
  categorySlug,
  categories,
  title,
}: {
  wish?: Wish;
  categorySlug: string;
  categories: CategoryOption[];
  title: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const [form, setForm] = useState<WishInput>(emptyInput);
  const [cat, setCat] = useState(categorySlug);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  // Les inn ferske verdier hver gang modalen åpnes.
  const open = () => {
    setForm(wish ? toInput(wish) : emptyInput());
    setCat(categorySlug);
    setError(null);
    setConfirmDelete(false);
    ref.current?.showModal();
  };
  const close = () => ref.current?.close();

  const set = <K extends keyof WishInput>(key: K, value: WishInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setLink = (i: number, key: "label" | "url", value: string) =>
    set("links", form.links.map((l, j) => (j === i ? { ...l, [key]: value } : l)));
  const setSale = (key: keyof WishInput["sale"], value: string) => set("sale", { ...form.sale, [key]: value });

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) close();
      else setError(res.error ?? "Noe gikk galt");
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => saveWish({ id: wish?.id, categorySlug: cat, wish: form }));
  };

  const f = (name: string) => `${uid}-${name}`;

  return (
    <>
      {wish ? (
        <button type="button" className="btn-icon" onClick={open} aria-label={`Rediger «${wish.name}»`}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h4L19 9l-4-4L4 16z" />
            <path d="M13.5 6.5l4 4" />
          </svg>
        </button>
      ) : (
        <button type="button" className="btn-new" onClick={open}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nytt ønske
        </button>
      )}
      <dialog ref={ref} className="modal" aria-labelledby={f("title")}>
        <form onSubmit={onSubmit} className="modal-form">
          <div className="modal-head">
            <h2 id={f("title")}>{title}</h2>
            <button type="button" className="btn-icon" onClick={close} aria-label="Lukk">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="field">
            <label htmlFor={f("name")}>Navn</label>
            <input id={f("name")} value={form.name} onChange={(e) => set("name", e.target.value)} required autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor={f("note")}>Undertekst</label>
            <input id={f("note")} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="F.eks. merke, modell eller størrelse" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor={f("hand")}>Håndskrevet notat</label>
            <input id={f("hand")} className="hand-input" value={form.hand} onChange={(e) => set("hand", e.target.value)} placeholder="valgfritt" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor={f("cat")}>Kategori</label>
            <select id={f("cat")} value={cat} onChange={(e) => setCat(e.target.value)}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="checks">
            <label>
              <input type="checkbox" checked={form.star} onChange={(e) => set("star", e.target.checked)} />
              Mest ønsket
            </label>
            <label>
              <input type="checkbox" checked={form.multi} onChange={(e) => set("multi", e.target.checked)} />
              Flere kan gi denne
            </label>
          </div>

          <fieldset className="group-fields">
            <legend>Lenker</legend>
            {form.links.map((l, i) => (
              <div key={i} className="link-row">
                <input aria-label={`Lenketekst ${i + 1}`} value={l.label} onChange={(e) => setLink(i, "label", e.target.value)} placeholder="Se hos Komplett" />
                <input aria-label={`Adresse ${i + 1}`} value={l.url} onChange={(e) => setLink(i, "url", e.target.value)} placeholder="https://…" inputMode="url" />
                <button type="button" className="btn-icon" onClick={() => set("links", form.links.filter((_, j) => j !== i))} aria-label={`Fjern lenke ${i + 1}`}>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            ))}
            {form.links.length < 5 && (
              <button type="button" className="btn-text" onClick={() => set("links", [...form.links, { label: "", url: "" }])}>
                + Legg til lenke
              </button>
            )}
          </fieldset>

          <fieldset className="group-fields">
            <legend>Tilbud (valgfritt)</legend>
            <div className="sale-row">
              <div className="field">
                <label htmlFor={f("price")}>Pris</label>
                <input id={f("price")} value={form.sale.price} onChange={(e) => setSale("price", e.target.value)} placeholder="449 kr" />
              </div>
              <div className="field">
                <label htmlFor={f("was")}>Før</label>
                <input id={f("was")} value={form.sale.was} onChange={(e) => setSale("was", e.target.value)} placeholder="549 kr" />
              </div>
              <div className="field">
                <label htmlFor={f("until")}>Til og med</label>
                <input id={f("until")} type="date" value={form.sale.until} onChange={(e) => setSale("until", e.target.value)} />
              </div>
            </div>
          </fieldset>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            {wish &&
              (confirmDelete ? (
                <span className="confirm">
                  Slette?
                  <button type="button" className="btn-danger" disabled={pending} onClick={() => run(() => deleteWish(wish.id))}>
                    Ja, slett
                  </button>
                  <button type="button" className="btn-text" onClick={() => setConfirmDelete(false)}>
                    Nei
                  </button>
                </span>
              ) : (
                <button type="button" className="btn-text btn-delete" onClick={() => setConfirmDelete(true)}>
                  Slett ønsket
                </button>
              ))}
            <span className="spacer" />
            <button type="button" className="pill-outline" onClick={close}>
              Avbryt
            </button>
            <button type="submit" className="btn-take" disabled={pending} aria-busy={pending}>
              {pending ? "Lagrer…" : "Lagre"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
