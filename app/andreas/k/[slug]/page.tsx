import { notFound } from "next/navigation";
import { OwnerPage } from "@/components/OwnerPage";
import { findCategory, wishList } from "@/lib/wishes";

export function generateStaticParams() {
  return wishList.categories.map((c) => ({ slug: c.slug }));
}

export default async function Page({ params }: PageProps<"/andreas/k/[slug]">) {
  const { slug } = await params;
  if (!findCategory(slug)) notFound();
  return <OwnerPage page={{ kind: "category", slug }} />;
}
