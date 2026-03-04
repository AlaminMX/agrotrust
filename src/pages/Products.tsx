import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { StateBanner } from '@/components/products/StateBanner';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { ProductFilters } from '@/components/products/ProductFilters';
import { State, ProductCategory, STATES } from '@/types';
import { useCart } from '@/context/CartContext';
import { Search, Loader2, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/activityLogger';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating';

interface DatabaseProduct {
  id: string; slug: string | null; name: string; description: string | null; price: number; unit: string;
  category: string; image_url: string | null; available_quantity: number;
  average_rating: number | null; review_count: number | null; state: string | null;
  farmer_id: string;
}

interface FarmerPublicProfile {
  id: string; farm_name: string; state: string; verification_status: string; user_id: string;
}

interface ProductWithFarmer extends DatabaseProduct {
  farmer?: FarmerPublicProfile;
}

const Products = () => {
  const { state: routeState } = useParams<{ state?: State }>();
  const [searchParams] = useSearchParams();
  const { selectedState, setSelectedState } = useCart();
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [products, setProducts] = useState<ProductWithFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);

  useEffect(() => {
    if (routeState && STATES.some(s => s.value === routeState)) {
      setSelectedState(routeState);
      return;
    }
    const stateParam = searchParams.get('state') as State;
    if (stateParam && STATES.some(s => s.value === stateParam)) {
      setSelectedState(stateParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam) setSearchQuery(searchParam);
    const categoryParam = searchParams.get('category');
    if (categoryParam) setCategory(categoryParam as ProductCategory);
  }, [routeState, searchParams, setSelectedState]);

  useEffect(() => {
    const stateLabel = STATES.find((s) => s.value === selectedState)?.label || 'Nigeria';
    document.title = selectedState === 'all' ? 'Browse Farm Products in Nigeria | AgroTrust' : `Fresh Farm Produce in ${stateLabel} | AgroTrust`;
  }, [selectedState]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase
        .from('products').select('id, slug, name, description, price, unit, category, image_url, available_quantity, average_rating, review_count, state, farmer_id')
        .eq('is_active', true);

      if (selectedState !== 'all') {
        query = query.eq('state', selectedState);
      }

      const { data: productsData, error } = await query;

      if (error) { console.error(error); toast.error('Failed to load listings'); setLoading(false); return; }
      if (!productsData?.length) { setProducts([]); setLoading(false); return; }

      const farmerIds = [...new Set(productsData.map(p => p.farmer_id))];
      const { data: farmersData } = await supabase.from('farmer_profiles_public')
        .select('id, farm_name, state, verification_status, user_id').in('id', farmerIds).eq('verification_status', 'approved');

      const farmerMap = new Map<string, FarmerPublicProfile>();
      farmersData?.forEach(f => farmerMap.set(f.id, f as FarmerPublicProfile));

      setProducts(productsData.filter(p => farmerMap.has(p.farmer_id)).map(p => ({ ...p, farmer: farmerMap.get(p.farmer_id) })));
      logActivity('product_feed_loaded', { state: selectedState, metadata: { count: productsData.length } });
      setLoading(false);
    };
    fetchProducts();
  }, [selectedState]);

  const handleStateChange = (newState: State) => { setSelectedState(newState); };
  const clearFilters = () => { setMinPrice(''); setMaxPrice(''); setMinRating(null); };
  const activeFiltersCount = [minPrice !== '', maxPrice !== '', minRating !== null].filter(Boolean).length;

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.farmer) return false;
      const productState = p.state || p.farmer.state;
      const matchesState = selectedState === 'all' || productState === selectedState;
      const matchesCategory = category === 'all' || p.category === category;
      const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.farmer.farm_name.toLowerCase().includes(searchQuery.toLowerCase());
      const minP = minPrice ? parseFloat(minPrice) : 0;
      const maxP = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = p.price >= minP && p.price <= maxP;
      const matchesRating = minRating === null || (p.average_rating || 0) >= minRating;
      return matchesState && matchesCategory && matchesSearch && matchesPrice && matchesRating;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return (b.average_rating || 0) - (a.average_rating || 0);
        default: return 0;
      }
    });
  }, [products, selectedState, category, searchQuery, sortBy, minPrice, maxPrice, minRating]);

  const transformedProducts = useMemo(() => filteredProducts.map(p => ({
    id: p.id, slug: p.slug || undefined, name: p.name, description: p.description || '', price: p.price, unit: p.unit,
    category: p.category as ProductCategory, image: p.image_url || '/placeholder.svg',
    farmerId: p.farmer!.id, farmerName: p.farmer!.farm_name, farmName: p.farmer!.farm_name,
    state: (p.state || p.farmer!.state) as State, available: p.available_quantity,
    rating: p.average_rating || 0, reviewCount: p.review_count || 0,
    isVerified: p.farmer!.verification_status === 'approved',
  })), [filteredProducts]);

  return (
    <Layout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Listings</h1>
          <p className="text-muted-foreground">Connect directly with verified farmers across Nigeria</p>
        </div>
      </div>
      <div className="container py-8">
        <StateBanner selectedState={selectedState} onStateChange={handleStateChange} />
        <div className="flex flex-col lg:flex-row gap-6">
          <ProductFilters minPrice={minPrice} maxPrice={maxPrice} minRating={minRating}
            onMinPriceChange={setMinPrice} onMaxPriceChange={setMaxPrice}
            onMinRatingChange={setMinRating} onClearFilters={clearFilters} activeFiltersCount={activeFiltersCount} />
          <div className="flex-1">
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search listings or farms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <ArrowUpDown className="h-4 w-4 mr-2" /><SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CategoryFilter selected={category} onChange={setCategory} />
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : transformedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {transformedProducts.map(p => <ProductCard key={p.id} product={p} showState={selectedState === 'all'} />)}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground mb-2">No listings found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
