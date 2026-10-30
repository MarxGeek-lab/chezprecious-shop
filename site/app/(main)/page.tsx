import Hero from "@/app/components/home/Hero/Hero";
import FeaturedProducts from "@/app/components/home/FeaturedProducts/FeaturedProducts";
import ClassicsCarousel from "@/app/components/home/ClassicsCarousel/ClassicsCarousel";
import Recommended from "@/app/components/home/Recommended/Recommended";
import Bestsellers from "@/app/components/home/Bestsellers/Bestsellers";
import ReviewsSection from "@/app/components/home/ReviewsSection/ReviewsSection";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturedProducts />
      <ClassicsCarousel />
      <Recommended />
      <Bestsellers />
      <ReviewsSection />
    </main>
  );
}
