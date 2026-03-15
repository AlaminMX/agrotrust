import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { JumiaProductCard } from '@/components/products/JumiaProductCard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export const FeaturedProductsSection = () => {
  const { selectedState } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, unit, category, image_url, available_quantity, state, farmer_id, is_negotiable')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(16);

      if (!productsData?.length) { setProducts([]); setLoading(false); return; }

      const farmerIds = [...new Set(productsData.map(p => p.farmer_id))];
      const { data: farmersData } = await supabase
        .from('farmer_profiles_public')
        .select('id, farm_name, verification_status, state') as any;

      const farmerMap = new Map<string, any>();
      (farmersData || []).filter((f: any) => f.verification_status === 'approved')
        .forEach((f: any) => farmerMap.set(f.id, f));

      const transformed = productsData
        .filter(p => farmerMap.has(p.farmer_id))
        .filter(p => {
          const ps = p.state || farmerMap.get(p.farmer_id)?.state;
          return selectedState === 'all' || ps === selectedState;
        })
        .slice(0, 8)
        .map(p => {
          const farmer = farmerMap.get(p.farmer_id)!;
          return {
            id: p.id, name: p.name, price: p.price, unit: p.unit,
            image_url: p.image_url, available_quantity: p.available_quantity,
            farm_name: farmer.farm_name, is_verified: farmer.verification_status === 'approved',
            state: p.state || farmer.state, area: farmer.area || null,
            is_negotiable: p.is_negotiable,
          };
        });
      setProducts(transformed);
      setLoading(false);
    };
    fetchProducts();
  }, [selectedState]);

  return (
    <section className="py-8 md:py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-foreground">Latest Listings</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Fresh produce from verified farmers</p>
          </div>
          <Link to="/products" className="text-xs md:text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12 md:py-16">
            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <p className="text-muted-foreground text-sm">No products available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
            {products.map(product => (
              <JumiaProductCard key={product.id} product={product} showState={selectedState === 'all'} />
            ))}
          </div>
        )}
        
        {products.length > 0 && (
          <div className="text-center mt-6 md:mt-8">
            <Link to="/products">
              <Button size="default" variant="outline" className="font-semibold text-sm">
                Browse All Listings
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
