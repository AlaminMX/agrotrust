import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating';

interface DatabaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  image_url: string | null;
  available_quantity: number;
  average_rating: number | null;
  review_count: number | null;
  state: string | null;
  farmer_id: string;
}

interface FarmerPublicProfile {
  id: string;
  farm_name: string;
  state: string;
  verification_status: string;
  user_id: string;
}

interface ProductWithFarmer extends DatabaseProduct {
  farmer?: FarmerPublicProfile;
}

const Products = () => {
  const [searchParams] = useSearchParams();
  const { selectedState, setSelectedState, items, clearCart } = useCart();
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [products, setProducts] = useState<ProductWithFarmer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);

  // Handle state from URL params (from onboarding)
  useEffect(() => {
    const stateParam = searchParams.get('state') as State;
    if (stateParam && STATES.some(s => s.value === stateParam)) {
      setSelectedState(stateParam);
    }
  }, [searchParams, setSelectedState]);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      // First fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          unit,
          category,
          image_url,
          available_quantity,
          average_rating,
          review_count,
          state,
          farmer_id
        `)
        .eq('is_active', true);

      if (productsError) {
        console.error('Error fetching products:', productsError);
        toast.error('Failed to load products');
        setLoading(false);
        return;
      }

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
        .select('id, farm_name, state, verification_status, user_id')
        .in('id', farmerIds)
        .eq('verification_status', 'approved');

      // Create farmer lookup map
      const farmerMap = new Map<string, FarmerPublicProfile>();
      farmersData?.forEach(farmer => {
        farmerMap.set(farmer.id, farmer as FarmerPublicProfile);
      });

      // Combine products with farmer data, filtering to only approved farmers
      const productsWithFarmers: ProductWithFarmer[] = productsData
        .filter(product => farmerMap.has(product.farmer_id))
        .map(product => ({
          ...product,
          farmer: farmerMap.get(product.farmer_id)
        }));

      setProducts(productsWithFarmers);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const handleStateChange = (newState: State) => {
    if (items.length > 0 && newState !== selectedState && newState !== 'all' && selectedState !== 'all') {
      clearCart();
      toast.info('Cart cleared', { 
        description: 'Your cart was cleared because you changed your delivery location.' 
      });
    }
    setSelectedState(newState);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinRating(null);
  };

  const activeFiltersCount = [
    minPrice !== '',
    maxPrice !== '',
    minRating !== null,
  ].filter(Boolean).length;

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      if (!product.farmer) return false;
      
      // Use product.state or fall back to farmer's state
      const productState = product.state || product.farmer.state;
      
      // Location filter - if 'all' is selected, show all products
      const matchesState = selectedState === 'all' || productState === selectedState;
      
      const matchesCategory = category === 'all' || product.category === category;
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.farmer.farm_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Price filter
      const minPriceNum = minPrice ? parseFloat(minPrice) : 0;
      const maxPriceNum = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = product.price >= minPriceNum && product.price <= maxPriceNum;
      
      // Rating filter
      const productRating = product.average_rating || 0;
      const matchesRating = minRating === null || productRating >= minRating;
      
      return matchesState && matchesCategory && matchesSearch && matchesPrice && matchesRating;
    });

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0);
        case 'newest':
        default:
          return 0; // Keep original order (newest first from DB)
      }
    });
  }, [products, selectedState, category, searchQuery, sortBy, minPrice, maxPrice, minRating]);

  // Transform database products to the format expected by ProductCard
  const transformedProducts = useMemo(() => {
    return filteredProducts.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      unit: product.unit,
      category: product.category as ProductCategory,
      image: product.image_url || '/placeholder.svg',
      farmerId: product.farmer!.id,
      farmerName: product.farmer!.farm_name,
      farmName: product.farmer!.farm_name,
      state: (product.state || product.farmer!.state) as State,
      available: product.available_quantity,
      rating: product.average_rating || 0,
      reviewCount: product.review_count || 0,
      isVerified: product.farmer!.verification_status === 'approved',
    }));
  }, [filteredProducts]);

  // Determine if we should show state on product cards (when "All" is selected)
  const showStateOnCards = selectedState === 'all';

  return (
    <Layout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Products</h1>
          <p className="text-muted-foreground">Fresh produce from verified farmers near you</p>
        </div>
      </div>

      <div className="container py-8">
        {/* State Banner */}
        <StateBanner 
          selectedState={selectedState} 
          onStateChange={handleStateChange}
          hasItemsInCart={items.length > 0}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <ProductFilters
            minPrice={minPrice}
            maxPrice={maxPrice}
            minRating={minRating}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onMinRatingChange={setMinRating}
            onClearFilters={clearFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Main Content */}
          <div className="flex-1">
            {/* Search, Sort & Category */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products or farms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
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

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transformedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {transformedProducts.map(product => (
                  <ProductCard key={product.id} product={product} showState={showStateOnCards} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground mb-2">No products found</p>
                <p className="text-sm text-muted-foreground">
                  {products.length === 0 
                    ? 'No products have been listed yet. Check back soon!'
                    : 'Try adjusting your filters or search query'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
