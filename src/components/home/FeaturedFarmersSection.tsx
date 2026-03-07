import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatLocation } from '@/lib/location';

interface FeaturedFarmer {
  id: string;
  farm_name: string;
  state: string;
  area: string | null;
  verification_status: string;
  produce_types: string[] | null;
  product_count: number;
}

export const FeaturedFarmersSection = () => {
  const [farmers, setFarmers] = useState<FeaturedFarmer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarmers = async () => {
      const { data: farmersData } = await supabase
        .from('farmer_profiles_public')
        .select('id, farm_name, state, area, verification_status, produce_types')
        .eq('verification_status', 'approved')
        .limit(8);

      if (!farmersData?.length) { setLoading(false); return; }

      // Get product counts
      const farmerIds = farmersData.map(f => f.id!);
      const { data: products } = await supabase
        .from('products')
        .select('farmer_id')
        .in('farmer_id', farmerIds)
        .eq('is_active', true);

      const countMap = new Map<string, number>();
      products?.forEach(p => countMap.set(p.farmer_id, (countMap.get(p.farmer_id) || 0) + 1));

      setFarmers(farmersData.map(f => ({
        id: f.id!,
        farm_name: f.farm_name!,
        state: f.state!,
        area: f.area || null,
        verification_status: f.verification_status!,
        produce_types: f.produce_types,
        product_count: countMap.get(f.id!) || 0,
      })));
      setLoading(false);
    };
    fetchFarmers();
  }, []);

  if (loading) {
    return (
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (farmers.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Verified Farmers</h2>
            <p className="text-sm text-muted-foreground mt-1">Trusted farmers ready to serve you</p>
          </div>
          <Link to="/products?verified=true" className="text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {farmers.map((farmer) => (
            <Link
              key={farmer.id}
              to={`/farmers/${farmer.id}`}
              className="snap-start shrink-0 w-64 bg-card border border-border rounded-xl p-5 hover:shadow-card-hover hover:border-primary/20 transition-all duration-200 group"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-lg font-bold text-primary">
                  {farmer.farm_name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Name + verified */}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {farmer.farm_name}
                </h3>
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              </div>
              
              {/* Location */}
              <p className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <MapPin className="h-3 w-3 shrink-0" />
                {formatLocation(farmer.state, farmer.area)}
              </p>
              
              {/* Product count */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                {farmer.product_count} {farmer.product_count === 1 ? 'listing' : 'listings'}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
