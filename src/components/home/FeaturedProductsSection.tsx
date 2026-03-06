import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { JumiaProductCard } from '@/components/products/JumiaProductCard';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const tabs = [
  { id: 'all', label: 'All Products' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'grains', label: 'Grains' },
];

export const FeaturedProductsSection = () => {
  const { selectedState } = useCart();
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from('products').select('id, name, price, unit, category, image_url, available_quantity, state, farmer_id, is_negotiable').eq('is_active', true).limit(16);
      if (activeTab !== 'all') query = query.eq('category', activeTab);
      const { data: productsData } = await query;
      if (!productsData?.length) { setProducts([]); setLoading(false); return; }

      const farmerIds = [...new Set(productsData.map(p => p.farmer_id))];
      const { data: farmersData } = await supabase.from('farmer_profiles_public').select('id, farm_name, verification_status, state').in('id', farmerIds).eq('verification_status', 'approved');

      const farmerMap = new Map<string, any>();
      farmersData?.forEach(f => farmerMap.set(f.id!, f));

      const transformed = productsData
        .filter(p => farmerMap.has(p.farmer_id))
        .filter(p => { const ps = p.state || farmerMap.get(p.farmer_id)?.state; return selectedState === 'all' || ps === selectedState; })
        .slice(0, 8)
        .map(p => {
          const farmer = farmerMap.get(p.farmer_id)!;
          return {
            id: p.id, name: p.name, price: p.price, unit: p.unit,
            image_url: p.image_url, available_quantity: p.available_quantity,
            farm_name: farmer.farm_name, is_verified: farmer.verification_status === 'approved',
            state: p.state, is_negotiable: p.is_negotiable,
          };
        });
      setProducts(transformed);
      setLoading(false);
    };
    fetchProducts();
  }, [activeTab, selectedState]);

  return (
    <section className="py-10 bg-card">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-foreground">Latest Listings</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors", activeTab === tab.id ? "bg-orange text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>{tab.label}</button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20"><p className="text-muted-foreground">No products found in this category</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map(product => <JumiaProductCard key={product.id} product={product} showState={selectedState === 'all'} />)}
          </div>
        )}
        <div className="text-center mt-8">
          <Link to="/products"><Button size="lg" className="bg-orange hover:bg-orange-dark">View All Listings</Button></Link>
        </div>
      </div>
    </section>
  );
};
