import Hero from "@/app/components/home/Hero/Hero";
import FeaturedProducts from "@/app/components/home/FeaturedProducts/FeaturedProducts";
// Sections masquées pour le moment — décommenter pour les réafficher
// import TrustBar from "@/app/components/home/TrustBar/TrustBar";
// import CategoryShowcase from "@/app/components/home/CategoryShowcase/CategoryShowcase";
// import PromoBanner from "@/app/components/home/PromoBanner/PromoBanner";
// import Bestsellers from "@/app/components/home/Bestsellers/Bestsellers";
// import Recommended from "@/app/components/home/Recommended/Recommended";
// import ReviewsSection from "@/app/components/home/ReviewsSection/ReviewsSection";

export default function HomePage() {
  return (
    <main>
      <Hero />
      {/* <TrustBar /> */}
      {/* <CategoryShowcase /> */}
      <FeaturedProducts />
      {/* <PromoBanner /> */}
      {/* <Bestsellers /> */}
      {/* <Recommended /> */}
      {/* <ReviewsSection /> */}
    </main>
  );
}
