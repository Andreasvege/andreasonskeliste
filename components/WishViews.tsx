import Link from "next/link";
import type { Category, Wish, WishList } from "@/lib/schema";
import {
  activeSale,
  basePath,
  categoryMeta,
  countFor,
  fmtDate,
  isTaken,
  listSummary,
  sizesLine,
  type Counts,
  type Mode,
} from "@/lib/view";
import {
  ArrowLeft,
  ArrowRight,
  CategoryIcon,
  CheckIcon,
  ExternalIcon,
  ListIcon,
  PeopleIcon,
  StarIcon,
  TagIcon,
} from "./icons";

/** Felles props for alle visninger. Gjeste-interaksjon er valgfri. */
export type ViewProps = {
  list: WishList;
  mode: Mode;
  /** Reservasjoner per id. Owner får alltid `null`. */
  counts: Counts;
  /** "YYYY-MM-DD" i Europe/Oslo, eller null hvis ukjent. */
  today: string | null;
  /** Ønsker denne nettleseren har reservert. */
  mine?: ReadonlySet<string>;
  /** Ønsket som akkurat nå reserveres/angres. */
  pendingId?: string | null;
  onToggle?: (wish: Wish) => void;
};

function Knit() {
  return (
    <div className="knit" aria-hidden="true">
      <div className="knit-dots" />
      <div className="knit-zig" />
      <div className="knit-dots" />
    </div>
  );
}

function OwnerBanner({ mode }: { mode: Mode }) {
  if (mode !== "owner") return null;
  return (
    <p className="owner-banner">
      Spoilerfri visning (/andreas). Du ser hele lista, men ikke hva som er tatt.
    </p>
  );
}

function Sizes({ list, className }: { list: WishList; className?: string }) {
  const line = sizesLine(list.sizes);
  if (!line) return null;
  return <p className={`sizes hand ${className ?? ""}`}>Størrelser: {line}</p>;
}

function BackLink({ mode, style }: { mode: Mode; style?: React.CSSProperties }) {
  return (
    <Link href={basePath(mode) || "/"} className="back" style={style}>
      <ArrowLeft />
      Alle kategorier
    </Link>
  );
}

/* ---------------- Forside ---------------- */

export function OverviewView(props: ViewProps) {
  const { list, mode, counts, today } = props;
  const base = basePath(mode);
  return (
    <>
      <OwnerBanner mode={mode} />
      <div className="overview-top">
        <p className="summary">{listSummary(list, mode, counts)}</p>
        <Link href={`${base}/alle`} className="pill-outline">
          <ListIcon />
          Hele lista
        </Link>
      </div>
      <nav aria-label="Kategorier">
        {list.categories.map((cat) => (
          <Link key={cat.slug} href={`${base}/k/${cat.slug}`} className="catrow">
            <span className="caticon" aria-hidden="true">
              <CategoryIcon icon={cat.icon} />
            </span>
            <span className="cattext">
              <span className="catname">{cat.name}</span>
              <span className="catmeta">{categoryMeta(cat, mode, counts, today)}</span>
            </span>
            <ArrowRight size={32} color="#A3211A" />
          </Link>
        ))}
      </nav>
      <Sizes list={list} />
    </>
  );
}

/* ---------------- Én kategori ---------------- */

export function CategoryView(props: ViewProps & { category: Category }) {
  const { list, mode, counts, today, category } = props;
  const base = basePath(mode);
  const idx = list.categories.findIndex((c) => c.slug === category.slug);
  const next = list.categories[(idx + 1) % list.categories.length];
  return (
    <>
      <OwnerBanner mode={mode} />
      <div className="cat-nav">
        <BackLink mode={mode} />
        <Link href={`${base}/alle`} className="plain-link">
          Hele lista
        </Link>
      </div>
      <Knit />
      <h2 className="h-page">{category.name}</h2>
      <p className="page-meta">{categoryMeta(category, mode, counts, today)}</p>
      {category.items.map((it) => (
        <WishRow key={it.id} wish={it} {...props} />
      ))}
      {next.slug !== category.slug && (
        <Link href={`${base}/k/${next.slug}`} className="pill-outline pill-next">
          Neste: {next.name}
          <ArrowRight />
        </Link>
      )}
    </>
  );
}

/* ---------------- Hele lista ---------------- */

export function AllView(props: ViewProps) {
  const { list, mode, counts } = props;
  return (
    <>
      <OwnerBanner mode={mode} />
      <BackLink mode={mode} style={{ marginBottom: 24 }} />
      <h2 className="h-page">Hele lista</h2>
      <p className="page-meta page-meta-all">{listSummary(list, mode, counts)}</p>
      {list.categories.map((cat) => (
        <section key={cat.slug} className="group" aria-labelledby={`g-${cat.slug}`}>
          <Knit />
          <h3 className="h-group" id={`g-${cat.slug}`}>
            {cat.name}
          </h3>
          {cat.items.map((it) => (
            <WishRow key={it.id} wish={it} {...props} />
          ))}
        </section>
      ))}
      <Sizes list={list} className="sizes-all" />
    </>
  );
}

/* ---------------- Ett ønske ---------------- */

function WishRow({ wish, mode, counts, today, mine, pendingId, onToggle }: ViewProps & { wish: Wish }) {
  const guest = mode === "guest";
  const count = countFor(wish, counts);
  const taken = isTaken(wish, counts);
  const isMine = guest && !!mine?.has(wish.id);
  const strike = guest && taken;
  const sale = activeSale(wish, today);
  const links = wish.links ?? [];

  let multiText = "Flere kan gi denne";
  if (guest && count > 0) multiText += ` · ${count} har allerede kjøpt`;

  return (
    <div className="item">
      <div className="item-body">
        {wish.star && (
          <p className="item-star">
            <StarIcon />
            Mest ønsket
          </p>
        )}
        <p className={strike ? "item-name strike" : "item-name"}>
          {wish.name}
          {strike && <span className="sr"> (tatt)</span>}
        </p>
        {wish.note && <p className="item-note">{wish.note}</p>}
        {wish.hand && <p className="item-hand hand">{wish.hand}</p>}
        {wish.multi && (
          <p className="item-multi">
            <PeopleIcon />
            {multiText}
          </p>
        )}
        {(sale || links.length > 0) && (
          <div className="item-shop">
            {sale && (
              <span className="sale">
                <span className="sale-badge">
                  <TagIcon />
                  Tilbud
                </span>
                <span>{sale.price}</span>
                <span className="sale-was">
                  <span className="sr">før </span>
                  {sale.was}
                </span>
                <span className="sale-until">til {fmtDate(sale.until)}</span>
              </span>
            )}
            {links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="shop-link">
                {l.label}
                <ExternalIcon />
                <span className="sr">(åpnes i ny fane)</span>
              </a>
            ))}
          </div>
        )}
      </div>
      {guest && (
        <WishAction
          wish={wish}
          counts={counts}
          count={count}
          taken={taken}
          isMine={isMine}
          pending={pendingId === wish.id}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}

function WishAction({
  wish,
  counts,
  count,
  taken,
  isMine,
  pending,
  onToggle,
}: {
  wish: Wish;
  counts: Counts;
  count: number;
  taken: boolean;
  isMine: boolean;
  pending: boolean;
  onToggle?: (wish: Wish) => void;
}) {
  // Tallene er ikke lastet ennå: vis en plassholder i stedet for en knapp som kan være feil.
  if (counts === null || !onToggle) return <span className="btn-placeholder" aria-hidden="true" />;

  if (isMine) {
    return (
      <button type="button" className="btn-mine" onClick={() => onToggle(wish)} disabled={pending} aria-busy={pending}>
        <CheckIcon />
        {wish.multi ? "Du kjøper denne" : "Du tar denne"} · angre
      </button>
    );
  }
  if (taken) {
    return <span className="taken">Tatt av noen</span>;
  }
  const label = wish.multi ? (count > 0 ? "Jeg kjøper også" : "Jeg kjøper denne") : "Jeg tar denne";
  return (
    <button type="button" className="btn-take" onClick={() => onToggle(wish)} disabled={pending} aria-busy={pending}>
      {label}
    </button>
  );
}
