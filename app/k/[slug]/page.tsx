import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GuestPage } from "@/components/GuestPage";
import { findCategoryIn, getWishList } from "@/lib/wishes";

export async function generateStaticParams() {
  return (await getWishList()).categories.map((c) => ({ slug: c.slug }));
}

// params leses inne i <Suspense>, så appskallet kan bygges på nytt når lista endres.
export default function Page({ params }: PageProps<"/k/[slug]">) {
  return (
    <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
      <Category params={params} />
    </Suspense>
  );
}

async function Category({ params }: Pick<PageProps<"/k/[slug]">, "params">) {
  const { slug } = await params;
  if (!findCategoryIn(await getWishList(), slug)) notFound();
  return <GuestPage page={{ kind: "category", slug }} />;
}
