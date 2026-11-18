"use client";

import { useState, useTransition } from "react";
import { getTakenSummary } from "@/app/owner-actions";

/** Viser «x av y ønsker er tatt» først når Andreas ber om det. */
export function TakenSummary() {
  const [text, setText] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const show = () =>
    startTransition(async () => {
      const res = await getTakenSummary();
      if (!res.ok) return setText("Fikk ikke hentet tallet. Prøv igjen.");
      const free = res.total - res.taken;
      setText(`${res.taken} av ${res.total} ønsker er tatt · ${free} ${free === 1 ? "ledig" : "ledige"}`);
    });

  return (
    <div className="taken-summary">
      {text ? (
        <>
          <p role="status">{text}</p>
          <button type="button" className="btn-text" onClick={() => setText(null)}>
            Skjul
          </button>
        </>
      ) : (
        <button type="button" className="btn-text" onClick={show} disabled={pending} aria-busy={pending}>
          {pending ? "Henter…" : "Vis hvor mange som er tatt"}
        </button>
      )}
    </div>
  );
}
