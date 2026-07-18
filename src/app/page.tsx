import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { BuiltForSection } from "@/components/landing/BuiltForSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#020408]">
      <Header />
      <main className="flex-1 w-full overflow-hidden bg-white dark:bg-[#020408]">
        <HeroSection />
        <ProductPreview />
        <BenefitsSection />
        <BuiltForSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
