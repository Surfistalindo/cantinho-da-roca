import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import ProductsSection from '@/components/landing/ProductsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import LeadFormSection from '@/components/landing/LeadFormSection';
import Footer from '@/components/landing/Footer';
import WhatsAppFloat from '@/components/landing/WhatsAppFloat';
import { useScrollProgress } from '@/hooks/useScrollAnimation';

export default function Index() {
  const scrollY = useScrollProgress();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar scrollY={scrollY} />
      <WhatsAppFloat />
      <main className="flex-1">
        <HeroSection scrollY={scrollY} />
        <BenefitsSection />
        <ProductsSection />
        <TestimonialsSection />
        <LeadFormSection />
      </main>
      <Footer />
    </div>
  );
}
