import { notFound } from "next/navigation";
import { OwnerPage } from "@/components/OwnerPage";
import { findCategoryIn, getWishList } from "@/lib/wishes";

export async function generateStaticParams() {
  return (await getWishList()).categories.map((c) => ({ slug: c.slug }));
}

export default async function Page({ params }: PageProps<"/andreas/k/[slug]">) {
  const { slug } = await params;
  if (!findCategoryIn(await getWishList(), slug)) notFound();
  return <OwnerPage page={{ kind: "category", slug }} />;
}
