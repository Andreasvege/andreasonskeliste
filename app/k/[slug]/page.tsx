import { notFound } from "next/navigation";
import { CategoryView } from "@/components/WishViews";
import { getToday } from "@/lib/today";
import { findCategory, wishList } from "@/lib/wishes";

export function generateStaticParams() {
  return wishList.categories.map((c) => ({ slug: c.slug }));
}

export default async function Page({ params }: PageProps<"/k/[slug]">) {
  const category = findCategory((await params).slug);
  if (!category) notFound();
  const today = await getToday();
  return <CategoryView list={wishList} category={category} mode="guest" counts={null} today={today} />;
}
