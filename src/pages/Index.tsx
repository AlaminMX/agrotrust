import { Layout } from '@/components/layout/Layout';
import { Seo, SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION } from '@/components/Seo';
import { HeroSection } from '@/components/home/HeroSection';
import { TrustBanner } from '@/components/home/TrustBanner';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { StateBrowseSection } from '@/components/home/StateBrowseSection';
import { FeaturedFarmersSection } from '@/components/home/FeaturedFarmersSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { BecomeFarmerCTA } from '@/components/home/BecomeFarmerCTA';

const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  },
];

const Index = () => {
  return (
    <Layout>
      <Seo
        title={`${SITE_NAME} | Connecting Farmers Directly With Consumers in Nigeria`}
        titleIsFull
        path="/"
        jsonLd={homeJsonLd}
      />
      <HeroSection />
      <TrustBanner />
      <CategoryGrid />
      <StateBrowseSection />
      <FeaturedFarmersSection />
      <FeaturedProductsSection />
      <HowItWorksSection />
      <BecomeFarmerCTA />
    </Layout>
  );
};

export default Index;
