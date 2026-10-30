import Navbar from "@/app/components/layout/Navbar/Navbar";
import Footer from "@/app/components/layout/Footer/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
