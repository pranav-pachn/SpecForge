import { Header } from "@/shared/components/landing/Header";
import { HeroSection } from "@/shared/components/landing/HeroSection";
import { ProductPreview } from "@/shared/components/landing/ProductPreview";
import { BenefitsSection } from "@/shared/components/landing/BenefitsSection";
import { BuiltForSection } from "@/shared/components/landing/BuiltForSection";
import { CTASection } from "@/shared/components/landing/CTASection";
import { Footer } from "@/shared/components/landing/Footer";

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
