"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { reserve, unreserve } from "@/app/actions";
import type { Wish, WishList } from "@/lib/schema";
import { AllView, CategoryView, OverviewView, type ViewProps } from "./WishViews";
import { CheckIcon } from "./icons";

export type GuestPage = { kind: "overview" } | { kind: "category"; slug: string } | { kind: "all" };

const STORAGE_KEY = "onskeliste:codes";
type Codes = Record<string, string>;

function readCodes(): Codes {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === "string"),
    ) as Codes;
  } catch {
    return {};
  }
}

function writeCodes(codes: Codes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch {
    // Privat modus e.l.: reservasjonen gjelder fortsatt, men kan ikke angres herfra.
  }
}

type Toast = "ok" | "taken" | "error";

const TOAST_TEXT: Record<Toast, [string, string]> = {
  ok: ["Supert!", "Ingen navn er lagret. Du kan angre fra denne nettleseren."],
  taken: ["Oi!", "Noen rakk å ta denne rett før deg."],
  error: ["Noe gikk galt.", "Prøv igjen om litt."],
};

export function GuestView({
  page,
  list,
  counts,
  today,
}: {
  page: GuestPage;
  list: WishList;
  counts: Record<string, number> | null;
  today: string | null;
}) {
  const [codes, setCodes] = useState<Codes>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // localStorage finnes bare i nettleseren, så vi leser etter mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- engangs synk fra localStorage
    setCodes(readCodes());
    return () => clearTimeout(timer.current);
  }, []);

  const showToast = useCallback((t: Toast) => {
    clearTimeout(timer.current);
    setToast(t);
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // «Mine» = vi har en kode OG serveren har minst én reservasjon på ønsket.
  // (Hvis raden er borte i databasen, er koden utdatert og ignoreres.)
  const mine = useMemo(
    () => new Set(Object.keys(codes).filter((id) => (counts?.[id] ?? 0) > 0)),
    [codes, counts],
  );

  const onToggle = useCallback(
    (wish: Wish) => {
      if (pendingId) return;
      setPendingId(wish.id);
      startTransition(async () => {
        try {
          const code = codes[wish.id];
          if (code && mine.has(wish.id)) {
            const res = await unreserve(wish.id, code);
            if (!res.ok) return showToast("error");
            const next = { ...readCodes() };
            delete next[wish.id];
            writeCodes(next);
            setCodes(next);
            clearTimeout(timer.current);
            setToast(null);
          } else {
            const res = await reserve(wish.id);
            if (!res.ok) return showToast(res.reason === "taken" ? "taken" : "error");
            const next = { ...readCodes(), [wish.id]: res.code };
            writeCodes(next);
            setCodes(next);
            showToast("ok");
          }
        } catch {
          showToast("error");
        } finally {
          setPendingId(null);
        }
      });
    },
    [codes, mine, pendingId, showToast],
  );

  const props: ViewProps = { list, mode: "guest", counts, today, mine, pendingId, onToggle };
  const category = page.kind === "category" ? list.categories.find((c) => c.slug === page.slug) : undefined;

  return (
    <>
      {page.kind === "overview" && <OverviewView {...props} />}
      {page.kind === "all" && <AllView {...props} />}
      {category && <CategoryView {...props} category={category} />}

      {/* Live-regionen står alltid i DOM-en, så skjermlesere fanger opp endringen. */}
      <div role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            {toast === "ok" && <CheckIcon size={22} color="#5BD27A" />}
            <span>
              <strong>{TOAST_TEXT[toast][0]}</strong> {TOAST_TEXT[toast][1]}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
