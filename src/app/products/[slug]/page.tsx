import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { findProductBySlug } from "@/lib/catalog";
import ProductGallery from "@/components/products/ProductGallery";
import ProductInfo from "@/components/products/ProductInfo";
import ProductReviewsSection from "@/components/products/ProductReviewsSection";
import RelatedProducts from "@/components/products/RelatedProducts";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProductBySlug(slug);

  if (!product) {
    return {
      title: "Cap Not Found | Fìlà Yorùbá",
    };
  }

  const mainImage = product.images?.[0] || "/logo.jpg";
  const desc = product.description || `Authentic handcrafted ${product.name} Yoruba Fila cap tailored from premium woven threads.`;

  return {
    title: `${product.name} — Handcrafted Yoruba Cap`,
    description: desc,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title: `${product.name} | Fìlà Yorùbá`,
      description: desc,
      url: `/products/${slug}`,
      siteName: "Fìlà Yorùbá",
      locale: "en_NG",
      type: "website",
      images: [
        {
          url: mainImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Fìlà Yorùbá`,
      description: desc,
      images: [mainImage],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await findProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "NGN",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
        {/* 1. Classy Breadcrumb Bar */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-500 mb-8 sm:mb-10 overflow-x-auto whitespace-nowrap scrollbar-none"
        >
          <Link href="/" className="hover:text-[#000000] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link href="/products" className="hover:text-[#000000] transition-colors">
            Shop All
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link
            href={`/products?collection=${product.collection?.slug || ""}`}
            className="hover:text-[#000000] transition-colors"
          >
            {product.collection?.name || "Handwoven Aso-Oke"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="font-semibold text-[#000000] truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* 2. Main Buy Box & Visual Stage */}
        <div className="grid md:grid-cols-2 lg:grid-cols-[1.05fr_1fr] gap-8 md:gap-10 lg:gap-14 items-start">
          {/* Gallery (Left Column) */}
          <div className="md:sticky md:top-24 lg:top-28">
            <ProductGallery
              images={product.images}
              name={product.name}
            />
          </div>

          {/* Product Information & Buy Actions (Right Column) */}
          <div>
            <ProductInfo product={product} />
          </div>
        </div>

        {/* 3. Simple Reviews Section */}
        <section id="reviews" className="mt-20 pt-12 border-t border-slate-100 scroll-mt-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-serif text-[#000000] tracking-tight">
              Customer Reviews
            </h2>
          </div>

          <ProductReviewsSection
            productSlug={product.slug}
            productName={product.name}
            initialReviews={product.reviews || []}
            initialRating={product.rating || 5.0}
          />
        </section>

        {/* 4. Related Products */}
        <RelatedProducts
          collectionSlug={product.collection?.slug || "aso-oke"}
          currentProductId={product.id}
        />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}