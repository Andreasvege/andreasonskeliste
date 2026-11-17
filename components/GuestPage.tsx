import { Suspense } from "react";
import { connection } from "next/server";
import { getCounts } from "@/lib/reservations";
import { getToday } from "@/lib/today";
import { getWishList } from "@/lib/wishes";
import type { WishList } from "@/lib/schema";
import { GuestView, type GuestPage as Page } from "./GuestView";
import { AllView, CategoryView, OverviewView, type ViewProps } from "./WishViews";

/**
 * Gjestesiden: selve lista ligger i det statiske skallet (med plassholdere
 * for knappene), mens antall reservasjoner hentes ferskt per forespørsel.
 */
export async function GuestPage({ page }: { page: Page }) {
  const [today, list] = await Promise.all([getToday(), getWishList()]);
  return (
    <Suspense fallback={<Fallback page={page} list={list} today={today} />}>
      <WithCounts page={page} list={list} today={today} />
    </Suspense>
  );
}

async function WithCounts({ page, list, today }: { page: Page; list: WishList; today: string }) {
  // Utenfor try/catch: lar prerenderingen stoppe her i stedet for å fange avbruddet som en feil.
  await connection();
  let counts: Record<string, number> | null = null;
  try {
    counts = await getCounts();
  } catch (err) {
    // Databasen nede: vis lista uten knapper i stedet for en feilside.
    console.error("getCounts feilet", err);
  }
  return <GuestView page={page} list={list} counts={counts} today={today} />;
}

function Fallback({ page, list, today }: { page: Page; list: WishList; today: string }) {
  const props: ViewProps = { list, mode: "guest", counts: null, today };
  if (page.kind === "overview") return <OverviewView {...props} />;
  if (page.kind === "all") return <AllView {...props} />;
  const category = list.categories.find((c) => c.slug === page.slug);
  return category ? <CategoryView {...props} category={category} /> : null;
}
