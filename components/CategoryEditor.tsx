"use client";

import { useId, useRef, useState, useTransition } from "react";
import { deleteCategory, saveCategory, type CategoryInput } from "@/app/edit-actions";
import { CATEGORY_ICONS, type Category } from "@/lib/schema";
import { CategoryIcon } from "./icons";

const ICON_NAMES: Record<Category["icon"], string> = {
  gift: "Gave",
  run: "Løping",
  kitchen: "Kaffe",
  tech: "Tech",
  music: "Musikk",
  travel: "Reise",
};

/** Det modalen trenger å vite om kategoriene (rekkefølge og navn). */
type CategorySummary = { slug: string; name: string; icon: Category["icon"]; count: number };

export function CategoryDialog({ category, all }: { category?: CategorySummary; all: CategorySummary[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const isNew = !category;
  const currentIndex = category ? all.findIndex((c) => c.slug === category.slug) : all.length;

  const [form, setForm] = useState<CategoryInput>({ name: "", icon: "gift", position: currentIndex });
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  // Plasseringer: «Først», «Etter X» … (uten kategorien selv).
  const others = all.filter((c) => c.slug !== category?.slug);

  const open = () => {
    setForm({ name: category?.name ?? "", icon: category?.icon ?? "gift", position: isNew ? others.length : currentIndex });
    setError(null);
    setConfirmDelete(false);
    ref.current?.showModal();
  };
  const close = () => ref.current?.close();

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) close();
      else setError(res.error ?? "Noe gikk galt");
    });
  };

  const f = (name: string) => `${uid}-${name}`;
  const count = category?.count ?? 0;

  return (
    <>
      {category ? (
        <button type="button" className="btn-icon" onClick={open} aria-label={`Rediger kategorien «${category.name}»`}>
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
          Ny kategori
        </button>
      )}

      <dialog ref={ref} className="modal" aria-labelledby={f("title")}>
        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveCategory({ slug: category?.slug, category: form }));
          }}
        >
          <div className="modal-head">
            <h2 id={f("title")}>{isNew ? "Ny kategori" : "Rediger kategori"}</h2>
            <button type="button" className="btn-icon" onClick={close} aria-label="Lukk">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="field">
            <label htmlFor={f("name")}>Navn</label>
            <input id={f("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="off" />
          </div>

          <fieldset className="group-fields">
            <legend>Ikon</legend>
            <div className="icon-picker">
              {CATEGORY_ICONS.map((icon) => (
                <label key={icon} className="icon-choice">
                  <input type="radio" name={f("icon")} value={icon} checked={form.icon === icon} onChange={() => setForm({ ...form, icon })} />
                  <span className="caticon" aria-hidden="true">
                    <CategoryIcon icon={icon} />
                  </span>
                  <span className="sr">{ICON_NAMES[icon]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {others.length > 0 && (
            <div className="field">
              <label htmlFor={f("pos")}>Plassering</label>
              <select id={f("pos")} value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}>
                <option value={0}>Først</option>
                {others.map((c, i) => (
                  <option key={c.slug} value={i + 1}>
                    Etter «{c.name}»
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            {category &&
              (confirmDelete ? (
                <span className="confirm">
                  {count > 0 ? `Slette kategorien og ${count} ${count === 1 ? "ønske" : "ønsker"}?` : "Slette kategorien?"}
                  <button type="button" className="btn-danger" disabled={pending} onClick={() => run(() => deleteCategory(category.slug))}>
                    Ja, slett
                  </button>
                  <button type="button" className="btn-text" onClick={() => setConfirmDelete(false)}>
                    Nei
                  </button>
                </span>
              ) : (
                <button type="button" className="btn-text btn-delete" onClick={() => setConfirmDelete(true)}>
                  Slett kategorien
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
