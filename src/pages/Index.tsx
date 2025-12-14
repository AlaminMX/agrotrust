import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { EscrowExplainer } from '@/components/home/EscrowExplainer';
import { TrustStats } from '@/components/home/TrustStats';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <TrustStats />
      <FeaturedProducts />
      <HowItWorksSection />
      <EscrowExplainer />
    </Layout>
  );
};

export default Index;
