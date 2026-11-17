import { notFound } from "next/navigation";
import { GuestPage } from "@/components/GuestPage";
import { findCategoryIn, getWishList } from "@/lib/wishes";

export async function generateStaticParams() {
  return (await getWishList()).categories.map((c) => ({ slug: c.slug }));
}

export default async function Page({ params }: PageProps<"/k/[slug]">) {
  const { slug } = await params;
  if (!findCategoryIn(await getWishList(), slug)) notFound();
  return <GuestPage page={{ kind: "category", slug }} />;
}
