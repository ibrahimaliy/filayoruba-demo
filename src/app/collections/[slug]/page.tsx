import { redirect } from "next/navigation";

interface CollectionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CollectionPage({
  params,
}: CollectionPageProps) {
  const { slug } = await params;
  redirect(`/products?collection=${encodeURIComponent(slug)}`);
}

