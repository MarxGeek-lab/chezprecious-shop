import Hero from "@/app/components/home/Hero/Hero";
import TrustBar from "@/app/components/home/TrustBar/TrustBar";
import CategoryShowcase from "@/app/components/home/CategoryShowcase/CategoryShowcase";
import FeaturedProducts from "@/app/components/home/FeaturedProducts/FeaturedProducts";
import PromoBanner from "@/app/components/home/PromoBanner/PromoBanner";
import Bestsellers from "@/app/components/home/Bestsellers/Bestsellers";
import Recommended from "@/app/components/home/Recommended/Recommended";
import ReviewsSection from "@/app/components/home/ReviewsSection/ReviewsSection";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <TrustBar />
      <CategoryShowcase />
      <FeaturedProducts />
      <PromoBanner />
      <Bestsellers />
      <Recommended />
      <ReviewsSection />
    </main>
  );
}
