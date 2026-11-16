import { Suspense } from "react";
import { connection } from "next/server";
import { getCounts } from "@/lib/reservations";
import { getToday } from "@/lib/today";
import { wishList } from "@/lib/wishes";
import { GuestView, type GuestPage as Page } from "./GuestView";
import { AllView, CategoryView, OverviewView, type ViewProps } from "./WishViews";

/**
 * Gjestesiden: selve lista ligger i det statiske skallet (med plassholdere
 * for knappene), mens antall reservasjoner hentes ferskt per forespørsel.
 */
export async function GuestPage({ page }: { page: Page }) {
  const today = await getToday();
  return (
    <Suspense fallback={<Fallback page={page} today={today} />}>
      <WithCounts page={page} today={today} />
    </Suspense>
  );
}

async function WithCounts({ page, today }: { page: Page; today: string }) {
  // Utenfor try/catch: lar prerenderingen stoppe her i stedet for å fange avbruddet som en feil.
  await connection();
  let counts: Record<string, number> | null = null;
  try {
    counts = await getCounts();
  } catch (err) {
    // Databasen nede: vis lista uten knapper i stedet for en feilside.
    console.error("getCounts feilet", err);
  }
  return <GuestView page={page} list={wishList} counts={counts} today={today} />;
}

function Fallback({ page, today }: { page: Page; today: string }) {
  const props: ViewProps = { list: wishList, mode: "guest", counts: null, today };
  if (page.kind === "overview") return <OverviewView {...props} />;
  if (page.kind === "all") return <AllView {...props} />;
  const category = wishList.categories.find((c) => c.slug === page.slug);
  return category ? <CategoryView {...props} category={category} /> : null;
}
