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
        .select('id, farm_name, state, verification_status, produce_types') as any;

      if (!farmersData?.length) { setLoading(false); return; }

      const approved = farmersData.filter((f: any) => f.verification_status === 'approved').slice(0, 8);

      const farmerIds = approved.map((f: any) => f.id);
      const { data: products } = await supabase
        .from('products')
        .select('farmer_id')
        .in('farmer_id', farmerIds)
        .eq('is_active', true);

      const countMap = new Map<string, number>();
      products?.forEach(p => countMap.set(p.farmer_id, (countMap.get(p.farmer_id) || 0) + 1));

      setFarmers(approved.map((f: any) => ({
        id: f.id,
        farm_name: f.farm_name,
        state: f.state,
        area: f.area || null,
        verification_status: f.verification_status,
        produce_types: f.produce_types,
        product_count: countMap.get(f.id) || 0,
      })));
      setLoading(false);
    };
    fetchFarmers();
  }, []);

  if (loading) {
    return (
      <section className="py-8 md:py-12">
        <div className="container">
          <div className="flex items-center justify-center py-6 md:py-8">
            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (farmers.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-foreground">Verified Farmers</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Trusted farmers ready to serve you</p>
          </div>
          <Link to="/products?verified=true" className="text-xs md:text-sm font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>
        
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory">
          {farmers.map((farmer) => (
            <Link
              key={farmer.id}
              to={`/farmers/${farmer.id}`}
              className="snap-start shrink-0 w-52 md:w-64 bg-card border border-border rounded-xl p-4 md:p-5 hover:shadow-card-hover hover:border-primary/20 transition-all duration-200 group"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2.5 md:mb-3">
                <span className="text-base md:text-lg font-bold text-primary">
                  {farmer.farm_name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-xs md:text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {farmer.farm_name}
                </h3>
                <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0" />
              </div>
              
              <p className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground mb-2 md:mb-3">
                <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 shrink-0" />
                {formatLocation(farmer.state, farmer.area)}
              </p>
              
              <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                <Package className="h-2.5 w-2.5 md:h-3 md:w-3" />
                {farmer.product_count} {farmer.product_count === 1 ? 'listing' : 'listings'}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
