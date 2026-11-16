# Ønskeliste – overlevering til Claude Code

En ønskeliste for bursdagen 2. desember og jul 2026. Gjester kan reservere gaver **anonymt**: ingen navn, ingen innlogging, og Andreas skal ikke kunne se hva som er reservert.

Målet er å ha siden oppe i god tid før 2. desember.

## Filer i denne pakken

| Fil | Hva det er |
| --- | --- |
| `HANDOFF.md` | Denne fila. Spesifikasjonen. |
| `wishes.json` | Alle ønskene. Legg den i `data/wishes.json`. |
| `design/Kategorier.dc.html` | **Hoveddesignet** (retning D). Den visuelle fasiten. |
| `design/Delingsbilde.dc.html` | Delingsbildet for lenka (1200×630). |

### Om designfilene (`.dc.html`)
Filene er laget i Claudes designverktøy og bruker en egen malsyntaks: `{{hull}}`, `<sc-if>`, `<sc-for>` og en `class Component extends DCLogic`. **Ikke prøv å kjøre dem.** Bruk dem som en presis visuell referanse:
- Alle farger, størrelser, avstander og fonter står som inline `style` i markupen.
- CSS for snø, julelys, snøfonn og strikkemønster ligger i `<helmet><style>` øverst.
- Logikken i `<script>` nederst viser hvordan tekster og tilstander regnes ut (meta-tekster, «flere kan gi», tilbud). Port den til React/TypeScript.

## Stack

- Next.js (App Router) + TypeScript
- Postgres fra Vercel Marketplace (samme oppsett som Stå på!)
- DB-tilgang: én tabell, så rå SQL med `@neondatabase/serverless` holder. Prisma går også fint.
- Fonter via `next/font/google`: **Bricolage Grotesque** (400/600/800) og **Caveat** (500/700)
- Ingen CSS-rammeverk er nødvendig. CSS Modules eller vanlig global CSS for de dekorative klassene.

## Ruter

| Rute | Innhold |
| --- | --- |
| `/` | Forside: kategoriene + «Hele lista»-knapp |
| `/k/[slug]` | Én kategori, med «Alle kategorier», «Hele lista» og «Neste: …» |
| `/alle` | Hele lista, kategoriene skilt med strikkemønster |
| `/andreas`, `/andreas/k/[slug]`, `/andreas/alle` | **Spoilerfri visning.** Samme sider, men uten reservasjoner, tellere, knapper og bekreftelser |

Gjør visningene til delte komponenter med en `mode: "guest" | "owner"`-prop.

**Viktig:** owner-sidene skal **aldri hente reservasjoner fra databasen**, ikke engang for å skjule dem i UI-et. Da finnes ikke dataene i HTML-en eller i nettverksfanen.

Legg `robots: { index: false, follow: false }` i metadata, så lista ikke dukker opp i Google.

## Data: `wishes.json`

Ønskene ligger i repoet. Endringer gjøres med en commit, og det finnes ikke noe adminpanel.

```ts
type Wish = {
  id: string;            // stabil, brukes i databasen. Ikke endre etter lansering
  name: string;
  note?: string;         // grå undertekst
  hand?: string;         // håndskrevet notat (Caveat, rød, litt rotert)
  multi?: boolean;       // flere kan kjøpe denne (kapsler, sokker, strenger)
  star?: boolean;        // «Mest ønsket»
  links?: { label: string; url: string }[];
  sale?: { price: string; was: string; until: string }; // until = "YYYY-MM-DD"
};
type Category = { slug: string; name: string; icon: "run" | "kitchen" | "tech" | "music" | "travel"; items: Wish[] };
type WishList = { occasion: string; sizes: Record<string, string>; categories: Category[] };
```

Valider fila ved oppstart/build (f.eks. med zod): unike `id`-er, gyldige URL-er, gyldig `until`-dato.

## Database

```sql
create table reservations (
  id          uuid primary key default gen_random_uuid(),
  item_id     text not null,
  exclusive   boolean not null,          -- true for vanlige ønsker, false for multi
  token_hash  text not null,             -- sha256 av angre-koden, aldri selve koden
  created_at  timestamptz not null default now()
);
create index reservations_item_idx on reservations (item_id);
-- Hindrer at to personer tar samme vanlige ønske samtidig (race-sikkert):
create unique index reservations_exclusive_once on reservations (item_id) where exclusive;
```

Det lagres **ikke** navn, IP-adresse, user agent eller noe annet om den som reserverer.

## Reservasjoner (server actions eller route handlers)

**`reserve(itemId)`**
1. Slå opp `itemId` i `wishes.json`. Ukjent id → feil.
2. Lag angre-koden på serveren: `crypto.randomBytes(32).toString("base64url")`.
3. Sett inn rad med `exclusive = !wish.multi` og `token_hash = sha256(code)`.
4. Brudd på unik-indeksen → svar «allerede tatt» (vis vennlig melding, oppdater lista).
5. Returner koden til klienten. Klienten lagrer den i `localStorage` under `onskeliste:codes` som `{ [itemId]: code }`.

**`unreserve(itemId, code)`**
- `delete from reservations where item_id = $1 and token_hash = $2`. Bare den nettleseren som har koden kan angre.

**`getCounts()`** (bare gjestesidene)
- `select item_id, count(*) from reservations group by item_id`.

Etter `reserve`/`unreserve`: `revalidatePath` på gjestesidene, eller gjør dem dynamiske.

På klienten: les `onskeliste:codes` ved mount for å vite hvilke ønsker som er «mine».

## Tilstander per ønske (gjestevisning)

| Tilstand | Navn | Høyre side |
| --- | --- | --- |
| Ledig | normal | Rød knapp «Jeg tar denne» |
| Tatt av meg | gjennomstreket | Grønn omriss-knapp med hake: «Du tar denne · angre» |
| Tatt av andre | gjennomstreket, grå | Stiplet pille «Tatt av noen» (ikke klikkbar) |
| Multi, ingen har kjøpt | normal | «Jeg kjøper denne» |
| Multi, noen har kjøpt | normal | «Jeg kjøper også» + linja «Flere kan gi denne · N har allerede kjøpt» |
| Multi, jeg har kjøpt | normal | «Du kjøper denne · angre» |

Etter en reservasjon vises en bekreftelse nederst i 4 sekunder (`role="status"`):
**«Supert!** Ingen navn er lagret. Du kan angre fra denne nettleseren.»

## Utregnede tekster (se `renderVals()` i designfila)

- Kategori-meta, gjest: `"7 ønsker · 5 ledige · 1 på tilbud"`. Owner: `"7 ønsker"`, og tilbud vises også der.
- «Ledige» = vanlige ønsker som ikke er tatt + alle multi-ønsker.
- Tilbud på vanlige ønsker som allerede er tatt telles ikke med i meta for gjester.
- Oppsummering på forsiden: `"5 kategorier · 17 ønsker · 13 ledige"`.
- Tilbud er aktivt når `until >= i dag` (Europe/Oslo). Datoformat: `"30. nov"`.
- Tilbud og lenker står på **én linje** under notatet: `[TILBUD] xxx kr ~~yyy kr~~ til 30. nov · Se hos Komplett ↗`. Lenker åpnes i ny fane med `rel="noopener noreferrer"`.

## Design-tokens

| Token | Verdi |
| --- | --- |
| Natt (hero, tekst) | `#13294B` |
| Snø (bakgrunn) | `#F6F9FC` |
| Lusekofte-rød (knapper, håndskrift) | `#A3211A` |
| Dempet tekst | `#4F6079` |
| Gjennomstreket tekst | `#5E6E82` |
| Skillelinje | `#D5DFEA` |
| Ikonsirkel | `#E4EDF6` |
| Tilbud-gul | `#FFC53D` |
| «Mitt»-grønn | `#1F7A45` |
| Hero lys tekst | `#CFE3F5` |
| Julelys | `#FF5A5F`, `#FFC53D`, `#5BD27A`, `#6CC4FF` |

- Innhold: `max-width: 1040px`, sidepadding 24px.
- Knapper: pille (`border-radius: 999px`), min. 44–48px høye.
- Ingen bokser/kort rundt ønskene: rader med skillelinje under.
- Dekor (kopier CSS-en fra `<helmet>`): `.flake` (snø), `.bulb` (julelys med sokkel via `::before`), `.drift` (snøfonn under hero), `.knit-dots` + `.knit-zig` (strikkemønster, brukt dots/zig/dots).
- `prefers-reduced-motion`: snø og blinking slås av.
- Ikoner: inline SVG med strek (se designfila), aldri emoji.

## Delingsbilde

`app/opengraph-image.tsx` med `ImageResponse` (1200×630), etter `design/Delingsbilde.dc.html`.

`ImageResponse` støtter bare en del av CSS-en. Hvis strikkemønsteret eller lysglød ikke rendres riktig, eksporter artboardet som PNG fra designverktøyet og bruk det som statisk `opengraph-image.png` i stedet.

## Byggerekkefølge

1. **Statisk side:** les `wishes.json` og bygg `/`, `/k/[slug]` og `/alle` uten database. Ferdig når alt ser ut som designet på mobil og desktop.
2. **Database + reservasjoner:** tabell, `reserve`, `unreserve`, `getCounts`, angre-koder i `localStorage`, bekreftelse. Ferdig når to nettlesere ikke kan ta samme vanlige ønske.
3. **`/andreas`:** owner-modus som aldri henter reservasjoner.
4. **Multi, tilbud, stjerne, lenker.**
5. **Delingsbilde + metadata** (tittel, beskrivelse, `noindex`).
6. **Deploy og test på telefon.** Send lenka.

## Ikke gjør

- Ingen navn, innlogging, kommentarfelt eller annen identifisering av gjester.
- Ingen analytics eller logging av hvem som reserverer.
- Ikke vis eller hent reservasjoner i `/andreas`.
- Ikke bygg adminpanel. `wishes.json` + commit er hele «CMS-et».

## Åpne punkter (Andreas fyller inn)

- Størrelser i `wishes.json`.
- Hvilke ønsker som skal ha stjerne (musematta er bare et eksempel).
- Produktlenker for resten av ønskene.
- Domene (eller bare `*.vercel.app`).
