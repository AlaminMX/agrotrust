import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JumiaProductCard } from '@/components/products/JumiaProductCard';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

export const FlashDeals = () => {
  const { selectedState } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 30 });

  useEffect(() => {
    const fetchProducts = async () => {
      // First fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(16);

      if (!productsData || productsData.length === 0) {
        setLoading(false);
        return;
      }

      // Get unique farmer IDs
      const farmerIds = [...new Set(productsData.map(p => p.farmer_id))];
      
      // Fetch farmer data from public view (safe - no sensitive data)
      const { data: farmersData } = await supabase
        .from('farmer_profiles_public')
        .select('id, farm_name, verification_status, state')
        .in('id', farmerIds)
        .eq('verification_status', 'approved');

      // Create farmer lookup map
      const farmerMap = new Map<string, { farm_name: string | null; verification_status: string | null; state: string | null }>();
      farmersData?.forEach(farmer => {
        farmerMap.set(farmer.id!, farmer);
      });

      // Combine and filter to only products from approved farmers AND matching selected state
      const transformed: Product[] = productsData
        .filter(p => farmerMap.has(p.farmer_id))
        .filter(p => {
          const productState = p.state || farmerMap.get(p.farmer_id)?.state;
          return selectedState === 'all' || productState === selectedState;
        })
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
  }, [selectedState]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  if (loading || products.length === 0) return null;

  return (
    <section className="py-8 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-orange p-2 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Flash Deals</h2>
            </div>
            
            {/* Timer */}
            <div className="hidden sm:flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">Ends in:</span>
              <div className="flex items-center gap-1">
                <span className="bg-foreground text-background px-2 py-1 rounded font-mono font-bold">
                  {formatTime(timeLeft.hours)}
                </span>
                <span className="font-bold">:</span>
                <span className="bg-foreground text-background px-2 py-1 rounded font-mono font-bold">
                  {formatTime(timeLeft.minutes)}
                </span>
                <span className="font-bold">:</span>
                <span className="bg-foreground text-background px-2 py-1 rounded font-mono font-bold">
                  {formatTime(timeLeft.seconds)}
                </span>
              </div>
            </div>
          </div>

          <Link to="/products">
            <Button variant="link" className="text-orange hover:text-orange-dark">
              See All →
            </Button>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map(product => (
            <JumiaProductCard key={product.id} product={product} showState={selectedState === 'all'} />
          ))}
        </div>
      </div>
    </section>
  );
};
