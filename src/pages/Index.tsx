
import Layout from '@/components/Layout';
import HeroSection from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import PricingSection from '@/components/home/PricingSection';
import { CallToAction } from '@/components/homepage/CallToAction';
import { TrialBanner } from '@/components/trial/TrialBanner';
import { logger } from '@/utils/logger';

const Index = () => {
  logger.debug('Index component rendering', { component: 'Index' });
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        <TrialBanner />
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <CallToAction />
      </div>
    </Layout>
  );
};

export default Index;
