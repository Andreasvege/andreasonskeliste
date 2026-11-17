// Spoilerfri visning for Andreas. Denne fila skal ALDRI importere noe som
// leser reservasjoner (lib/reservations, app/actions, GuestView). Da finnes
// ikke dataene i HTML-en eller i nettverksfanen.
import { getToday } from "@/lib/today";
import { findCategoryIn, getWishList } from "@/lib/wishes";
import { AllView, CategoryView, OverviewView, type ViewProps } from "./WishViews";

type Page = { kind: "overview" } | { kind: "category"; slug: string } | { kind: "all" };

export async function OwnerPage({ page }: { page: Page }) {
  const wishList = await getWishList();
  const props: ViewProps = { list: wishList, mode: "owner", counts: null, today: await getToday() };
  if (page.kind === "overview") return <OverviewView {...props} />;
  if (page.kind === "all") return <AllView {...props} />;
  const category = findCategoryIn(wishList, page.slug);
  return category ? <CategoryView {...props} category={category} /> : null;
}
