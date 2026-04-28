import Navbar from '@/components/landing/Navbar';
import StaticImageHero from '@/components/landing/StaticImageHero';
import BenefitsSection from '@/components/landing/BenefitsSection';
import ProductsSection from '@/components/landing/ProductsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import LeadFormSection from '@/components/landing/LeadFormSection';
import Footer from '@/components/landing/Footer';
import { useScrollProgress } from '@/hooks/useScrollAnimation';

export default function Index() {
  const scrollY = useScrollProgress();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar scrollY={scrollY} />
      <main className="flex-1">
        <StaticImageHero />
        <BenefitsSection />
        <ProductsSection scrollY={scrollY} />
        <TestimonialsSection />
        <LeadFormSection />
      </main>
      <Footer />
    </div>
  );
}
