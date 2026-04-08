import HeroSection from '@/components/landing/HeroSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import LeadFormSection from '@/components/landing/LeadFormSection';
import Footer from '@/components/landing/Footer';

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <HeroSection />
        <BenefitsSection />
        <LeadFormSection />
      </main>
      <Footer />
    </div>
  );
}
