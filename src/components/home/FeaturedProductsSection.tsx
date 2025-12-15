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
      let query = supabase
        .from('products')
        .select(`
          *,
          farmer_profiles!inner (
            farm_name,
            verification_status
          )
        `)
        .eq('is_active', true)
        .eq('farmer_profiles.verification_status', 'approved')
        .limit(8);

      if (activeTab !== 'all') {
        query = query.eq('category', activeTab);
      }

      const { data } = await query;

      if (data) {
        const transformed: Product[] = data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.price,
          unit: p.unit,
          image: p.image_url || '/placeholder.svg',
          category: p.category,
          farmerId: p.farmer_id,
          farmerName: p.farmer_profiles?.farm_name || 'Unknown',
          farmName: p.farmer_profiles?.farm_name || 'Unknown Farm',
          isVerified: p.farmer_profiles?.verification_status === 'approved',
          rating: p.average_rating || 4.5,
          reviewCount: p.review_count || 0,
          available: p.available_quantity,
          state: (p.state || 'abuja') as Product['state'],
        }));
        setProducts(transformed);
      }
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
