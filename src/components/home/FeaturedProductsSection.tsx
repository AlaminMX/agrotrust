import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { JumiaProductCard } from '@/components/products/JumiaProductCard';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const tabs = [
  { id: 'all', label: 'All Products' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'grains', label: 'Grains' },
];

export const FeaturedProductsSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      // First fetch products
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(16);

      if (activeTab !== 'all') {
        query = query.eq('category', activeTab);
      }

      const { data: productsData } = await query;

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Get unique farmer IDs
      const farmerIds = [...new Set(productsData.map(p => p.farmer_id))];
      
      // Fetch farmer data from public view (safe - no sensitive data)
      const { data: farmersData } = await supabase
        .from('farmer_profiles_public')
        .select('id, farm_name, verification_status')
        .in('id', farmerIds)
        .eq('verification_status', 'approved');

      // Create farmer lookup map
      const farmerMap = new Map<string, { farm_name: string; verification_status: string }>();
      farmersData?.forEach(farmer => {
        farmerMap.set(farmer.id, farmer);
      });

      // Combine and filter to only products from approved farmers
      const transformed: Product[] = productsData
        .filter(p => farmerMap.has(p.farmer_id))
        .slice(0, 8)
        .map(p => {
          const farmer = farmerMap.get(p.farmer_id)!;
          return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.price,
            unit: p.unit,
            image: p.image_url || '/placeholder.svg',
            category: p.category,
            farmerId: p.farmer_id,
            farmerName: farmer.farm_name || 'Unknown',
            farmName: farmer.farm_name || 'Unknown Farm',
            isVerified: farmer.verification_status === 'approved',
            rating: p.average_rating || 4.5,
            reviewCount: p.review_count || 0,
            available: p.available_quantity,
            state: (p.state || 'kaduna') as Product['state'],
          };
        });
      
      setProducts(transformed);
      setLoading(false);
    };
    fetchProducts();
  }, [activeTab]);

  return (
    <section className="py-10 bg-card">
      <div className="container">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-foreground">Featured Products</h2>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
                  activeTab === tab.id
                    ? "bg-orange text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-orange" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No products found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <JumiaProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* See All Button */}
        <div className="text-center mt-8">
          <Link to="/products">
            <Button size="lg" className="bg-orange hover:bg-orange-dark">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
