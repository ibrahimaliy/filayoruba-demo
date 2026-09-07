import fs from "fs";
import path from "path";
import Hero from "@/components/home/Hero";
import Collections from "@/components/home/Collections";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import BrandStory from "@/components/home/BrandStory";
import FilaEtiquette from "@/components/home/FilaEtiquette";
import Benefits from "@/components/home/Benefits";
import Testimonials from "@/components/home/Testimonials";
import Gallery from "@/components/home/Gallery";
import CTASection from "@/components/home/CTASection";
import { getActiveHeroSlides } from "@/server/services/hero.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const heroSlides = await getActiveHeroSlides();

  // Inspect the guides folder to verify if images exist
  let availableGuideImages: string[] = [];
  try {
    const guidesDir = path.join(process.cwd(), "public", "images", "guides");
    if (fs.existsSync(guidesDir)) {
      availableGuideImages = fs.readdirSync(guidesDir);
    }
  } catch {
    availableGuideImages = [];
  }

  return (
    <>
      <Hero slides={heroSlides} />
      <Collections />
      <FeaturedProducts />
      <BrandStory />
      <FilaEtiquette availableGuideImages={availableGuideImages} />
      <Gallery />
      <Benefits />
      <Testimonials />
      <CTASection />
    </>
  );
}