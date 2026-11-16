import { notFound } from "next/navigation";
import { GuestPage } from "@/components/GuestPage";
import { findCategory, wishList } from "@/lib/wishes";

export function generateStaticParams() {
  return wishList.categories.map((c) => ({ slug: c.slug }));
}

export default async function Page({ params }: PageProps<"/k/[slug]">) {
  const { slug } = await params;
  if (!findCategory(slug)) notFound();
  return <GuestPage page={{ kind: "category", slug }} />;
}
