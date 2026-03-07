import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { TrustBanner } from '@/components/home/TrustBanner';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedFarmersSection } from '@/components/home/FeaturedFarmersSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { BecomeFarmerCTA } from '@/components/home/BecomeFarmerCTA';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <TrustBanner />
      <CategoryGrid />
      <FeaturedFarmersSection />
      <FeaturedProductsSection />
      <HowItWorksSection />
      <BecomeFarmerCTA />
    </Layout>
  );
};

export default Index;
