import { Layout } from '@/components/layout/Layout';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { TrustBanner } from '@/components/home/TrustBanner';
import { EscrowExplainer } from '@/components/home/EscrowExplainer';
import { BecomeFarmerCTA } from '@/components/home/BecomeFarmerCTA';
import { LocationBanner } from '@/components/home/LocationBanner';
import { LocationSelectionModal } from '@/components/home/LocationSelectionModal';
import { BrowseByStateSection } from '@/components/home/BrowseByStateSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';

const Index = () => {
  return (
    <Layout>
      <LocationBanner />
      <LocationSelectionModal />
      <BannerCarousel />
      <TrustBanner />
      <CategoryGrid />
      <HowItWorksSection />
      <BrowseByStateSection />
      <FeaturedProductsSection />
      <EscrowExplainer />
      <BecomeFarmerCTA />
    </Layout>
  );
};

export default Index;
