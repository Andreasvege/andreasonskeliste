@AGENTS.md

# Andreas' ønskeliste

Ønskeliste for familien. Gjester kan reservere ønsker anonymt, uten navn og uten innlogging. Andreas redigerer lista på `/andreas` og skal aldri se hva som er reservert.

- Produksjon: https://andreasonskeliste.vercel.app (deployer automatisk ved push til `main`)
- Opprinnelig spesifikasjon og design: `onskeliste-handoff/` (HANDOFF.md, design/*.dc.html)

## Arbeidsmåte

- Ta ett steg om gangen og les koden før du går videre. Verifiser i nettleser og mot databasen.
- Commit og push til `main` på egen hånd ved naturlige stoppunkter.
- Skriv brukertekst, commit-meldinger og kodekommentarer på norsk.
- **Lokal utvikling bruker samme database som produksjon** (`DATABASE_URL` i `.env.local`). Det finnes ekte reservasjoner fra familien:
  - Ikke vis eller rapporter reservasjonsdata til Andreas.
  - Testrader må ha en tydelig prefiks, for eksempel `test-…`, og slettes etterpå.
  - Ta backup av `wishlist.data` før du tester redigering.
  - Ikke skriv ut hemmeligheter.

## Kommandoer

```sh
npm run dev         # utviklingsserver
npm run build       # produksjonsbygg (genererer også rutetyper)
npm run lint
npm run db:migrate  # idempotent: oppretter tabeller, seeder wishlist fra data/wishes.json hvis tom
```

## Stack

- Next.js 16.4 App Router med `cacheComponents: true` og `partialPrefetching: true`. **Les `node_modules/next/dist/docs/` før du skriver Next-kode**, fordi API-ene er nyere enn treningsdataene dine.
- React 19, TypeScript, zod 4, vanlig CSS i `app/globals.css` (ikke Tailwind).
- Neon Postgres via `@neondatabase/serverless` (HTTP-driveren: `db().query(sql, params)`).
- Fonter: Bricolage Grotesque og Caveat via `next/font`. Til OG-bildet ligger WOFF-filer i `assets/fonts/`.

## Ruter

| Rute | Hva |
|---|---|
| `/` | Forside for gjester: kategorier med antall ledige |
| `/k/[slug]` | Én kategori med «Jeg tar denne» |
| `/alle` | Alle ønsker på én side |
| `/andreas`, `/andreas/k/[slug]`, `/andreas/alle` | Samme visninger i eiermodus: ingen reservasjonsstatus, men redigering |
| `/opengraph-image` | Delingsbilde (next/og) |

`app/icon.svg` er favicon (juletre). `app/apple-icon.tsx` lager en PNG fra den.

## Data

**`wishlist`** er én rad (`id = 1`) med hele lista som `json`.
- Bruk `json`, ikke `jsonb`, fordi rekkefølgen på nøklene (for eksempel størrelser) skal bevares.
- Formatet er det samme som i `data/wishes.json`, som nå bare brukes som seed.
- Skjemaet ligger i `lib/schema.ts` (zod).

**`reservations`**: `item_id`, `exclusive`, `token_hash`, `created_at`.
- Den delvise unike indeksen `reservations_exclusive_once` sørger for at et vanlig ønske bare kan tas én gang, også ved samtidige forsøk. Postgres-feil 23505 betyr «allerede tatt».
- Ønsker med `multi` kan reserveres av flere (`exclusive = false`).
- Ønske-id-er lages som `slug-<4 hex>` og gjenbrukes aldri. Et slettet ønske kan ha reservasjoner liggende igjen, og et nytt ønske skal ikke arve dem.

## Personvern (ufravikelig)

- Ikke lagre navn, IP, user agent, kommentarer eller analytics om gjester.
- Angre-koden (`randomBytes(32)` base64url) lagres bare i gjestens `localStorage` (`onskeliste:codes`). Databasen har bare sha256 av den.
- Eiersidene (`components/OwnerPage.tsx`, `app/andreas/**`) skal **aldri** importere `lib/reservations.ts` eller hente reservasjoner.
- Eneste unntak er `app/owner-actions.ts` → `getTakenSummary()`. Andreas ba om den:
  - Den henter bare én totalsum («x av y ønsker er tatt»), aldri per ønske eller per kategori.
  - Den kjøres bare når han trykker på knappen i `components/TakenSummary.tsx`, på `/andreas`.
  - Multi-ønsker regnes som ledige.
- Redigering har bevisst **ingen innlogging**. Det var Andreas sitt valg, siden siden bare er for familien.

## Kodestruktur

- `lib/wishes.ts` (server-only):
  - `getWishList()` er cachet med `"use cache"`, `cacheLife("max")` og `cacheTag("wishlist")`.
  - `readWishListFresh()` og `writeWishList()` brukes når lista redigeres.
- `lib/reservations.ts`: `getCounts`, `insertReservation`, `deleteReservation`, `countTaken`, `hashCode`, `newCode`.
- `lib/view.ts`: presentasjonshjelpere (Oslo-dato, tilbud, `countFor`/`isTaken`, sammendrag, `basePath`).
- `lib/schema.ts` (trygg for klienten):
  - zod-skjemaer og `CATEGORY_ICONS`.
  - `visibleList()` skjuler tomme kategorier for gjester.
- `app/actions.ts`: `reserve` og `unreserve` for gjester. Kaller `refresh()`.
- `app/edit-actions.ts`: `saveWish`, `deleteWish`, `saveCategory` og `deleteCategory`. Kaller `updateTag(WISHLIST_TAG)`.
  - Kategori-slug settes én gang og endres ikke ved nytt navn.
- `components/WishViews.tsx`: felles visninger (`OverviewView`, `CategoryView`, `AllView`, `WishRow`) med en `mode`-prop (gjest eller eier).
- `components/GuestPage.tsx` / `GuestView.tsx`: gjestesider med reservasjonsantall og localStorage-koder. `OwnerPage.tsx`: eiersider.
- `components/WishEditor.tsx` / `CategoryEditor.tsx`: modaler med `<dialog>`.
- `components/icons.tsx`:
  - Alle kategoriikoner. Et nytt ikon må legges inn i `CATEGORY_ICONS`, i `CategoryIcon` og i `ICON_NAMES` i CategoryEditor.

## Fallgruver vi har gått i

- **`params` må leses inne i `<Suspense>`** i `[slug]`-sider. Ellers feiler regenereringen av App Shell etter `updateTag`, og alle kategorisider gir 500.
- **`await connection()` må kalles før DB-lesing og utenfor try/catch** i dynamiske deler. Ellers fanger catch abort-signalet ved prerender (HANGING_PROMISE_REJECTION).
- **`dynamicParams` finnes ikke med Cache Components.** Ved streaming gir `notFound()` status 200 med noindex.
- **`updateTag` virker bare i Server Actions.**
- **React-lint:** ikke definer komponenter inne i render, og ikke les refs under render.
- **Mobil (`max-width: 560px`):**
  - Kategorirader vises som en klassisk liste (ikon, tekst, pil på én linje).
  - Ønskerader har «Jeg tar denne» nederst til høyre (`align-items: flex-end`).
