import { useState, useMemo, useEffect, useRef } from 'react';
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

type SortOption = 'newest' | 'price-low' | 'price-high';

interface DatabaseProduct {
  id: string; name: string; description: string | null; price: number; unit: string;
  category: string; image_url: string | null; available_quantity: number; state: string | null;
  farmer_id: string; availability_status: 'In Stock' | 'Limited' | 'Out of Stock' | null;
}

interface FarmerPublicProfile { id: string; farm_name: string; state: string; verification_status: string; user_id: string; }
interface ProductWithFarmer extends DatabaseProduct { farmer?: FarmerPublicProfile; }

const Products = () => {
  const { state: routeState } = useParams<{ state?: State }>();
  const [searchParams] = useSearchParams();
  const { selectedState, setSelectedState } = useCart();
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [products, setProducts] = useState<ProductWithFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availability, setAvailability] = useState<'all' | 'In Stock' | 'Limited' | 'Out of Stock'>('all');
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (routeState && STATES.some(s => s.value === routeState)) {
      setSelectedState(routeState);
      return;
    }
    const stateParam = searchParams.get('state') as State;
    if (stateParam && STATES.some(s => s.value === stateParam)) setSelectedState(stateParam);
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
      const requestId = ++requestIdRef.current;
      setLoading(true);

      const query = supabase.from('products').select('id, name, description, price, unit, category, image_url, available_quantity, state, farmer_id, availability_status').eq('is_active', true);
      const { data: productsData, error } = selectedState !== 'all' ? await query.eq('state', selectedState) : await query;

      if (requestId !== requestIdRef.current) return;
      if (error) {
        console.error(error);
        toast.error('Failed to load listings');
        setProducts([]);
        setLoading(false);
        return;
      }

      const farmerIds = [...new Set((productsData || []).map(p => p.farmer_id))];
      const { data: farmersData } = await supabase.from('farmer_profiles_public').select('id, farm_name, state, verification_status, user_id').in('id', farmerIds);
      const farmerMap = new Map((farmersData || []).map(f => [f.id, f]));

      const nextProducts = (productsData || []).map((product) => ({
        ...(product as DatabaseProduct),
        availability_status: product.availability_status || ((product.available_quantity ?? 0) > 10 ? 'In Stock' : (product.available_quantity ?? 0) > 0 ? 'Limited' : 'Out of Stock'),
        farmer: farmerMap.get(product.farmer_id),
      }));

      setProducts(nextProducts);
      logActivity('product_feed_loaded', { state: selectedState, metadata: { count: nextProducts.length } });
      setLoading(false);
    };
    fetchProducts();
  }, [selectedState]);

  const activeFiltersCount = [verifiedOnly, availability !== 'all'].filter(Boolean).length;
  const clearFilters = () => {
    setVerifiedOnly(false);
    setAvailability('all');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.farmer) return false;
      const productState = p.state || p.farmer.state;
      const matchesState = selectedState === 'all' || productState === selectedState;
      const matchesCategory = category === 'all' || p.category === category;
      const haystack = `${p.name} ${p.farmer.farm_name} ${productState} ${p.category}`.toLowerCase();
      const matchesSearch = searchQuery === '' || haystack.includes(searchQuery.toLowerCase());
      const matchesVerified = !verifiedOnly || p.farmer.verification_status === 'verified';
      const status = p.availability_status || 'In Stock';
      const matchesAvailability = availability === 'all' || status === availability;
      return matchesState && matchesCategory && matchesSearch && matchesVerified && matchesAvailability;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        default: return 0;
      }
    });
  }, [products, selectedState, category, searchQuery, sortBy, verifiedOnly, availability]);

  const transformedProducts = useMemo(() => filteredProducts.map(p => ({
    id: p.id, name: p.name, description: p.description || '', price: p.price, unit: p.unit,
    category: p.category as ProductCategory, image: p.image_url || '/placeholder.svg',
    farmerId: p.farmer!.id, farmerName: p.farmer!.farm_name, farmName: p.farmer!.farm_name,
    state: (p.state || p.farmer!.state) as State, available: p.available_quantity,
    isVerified: p.farmer!.verification_status === 'verified',
  })), [filteredProducts]);

  return (
    <Layout>
      <div className="bg-muted/30 py-8"><div className="container"><h1 className="text-3xl font-bold text-foreground mb-2">Browse Listings</h1><p className="text-muted-foreground">Connect directly with farmers across Nigeria</p></div></div>
      <div className="container py-8">
        <StateBanner selectedState={selectedState} onStateChange={setSelectedState} />
        <div className="flex flex-col lg:flex-row gap-6">
          <ProductFilters verifiedOnly={verifiedOnly} availability={availability} onVerifiedOnlyChange={setVerifiedOnly} onAvailabilityChange={setAvailability} onClearFilters={clearFilters} activeFiltersCount={activeFiltersCount} />
          <div className="flex-1">
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search products, farmers, state, category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
                  <SelectTrigger className="w-full sm:w-[180px]"><ArrowUpDown className="h-4 w-4 mr-2" /><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CategoryFilter selected={category} onChange={setCategory} />
            </div>
            {loading ? <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : transformedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{transformedProducts.map(p => <ProductCard key={p.id} product={p} showState={selectedState === 'all'} />)}</div>
            ) : (
              <div className="text-center py-16"><p className="text-lg text-muted-foreground mb-2">No listings found</p><p className="text-sm text-muted-foreground">Try changing filters or searching another state/category.</p></div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
