import { Layout } from '@/components/layout/Layout';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FlashDeals } from '@/components/home/FlashDeals';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { TrustBanner } from '@/components/home/TrustBanner';
import { EscrowExplainer } from '@/components/home/EscrowExplainer';
import { BecomeFarmerCTA } from '@/components/home/BecomeFarmerCTA';
import { LocationBanner } from '@/components/home/LocationBanner';
import { LocationSelectionModal } from '@/components/home/LocationSelectionModal';
import { BrowseByStateSection } from '@/components/home/BrowseByStateSection';

const Index = () => {
  return (
    <Layout>
      <LocationBanner />
      <LocationSelectionModal />
      <BannerCarousel />
      <TrustBanner />
      <CategoryGrid />
      <BrowseByStateSection />
      <FlashDeals />
      <FeaturedProductsSection />
      <EscrowExplainer />
      <BecomeFarmerCTA />
    </Layout>
  );
};

export default Index;
