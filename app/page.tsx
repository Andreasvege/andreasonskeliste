import { OverviewView } from "@/components/WishViews";
import { getToday } from "@/lib/today";
import { wishList } from "@/lib/wishes";

export default async function Page() {
  const today = await getToday();
  return <OverviewView list={wishList} mode="guest" counts={null} today={today} />;
}
