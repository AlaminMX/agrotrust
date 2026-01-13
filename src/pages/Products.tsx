import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { StateBanner } from '@/components/products/StateBanner';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { State, ProductCategory, STATES } from '@/types';
import { useCart } from '@/context/CartContext';
import { Search, Loader2, ArrowUpDown, SlidersHorizontal, X, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get max price for slider
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 100000;
    return Math.max(...products.map(p => p.price)) + 1000;
  }, [products]);

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
    // Don't clear cart when changing to/from "all"
    if (items.length > 0 && newState !== selectedState && newState !== 'all' && selectedState !== 'all') {
      clearCart();
      toast.info('Cart cleared', { 
        description: 'Your cart was cleared because you changed your delivery location.' 
      });
    }
    setSelectedState(newState);
  };

  const resetFilters = () => {
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setCategory('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  const hasActiveFilters = priceRange[0] > 0 || priceRange[1] < maxPrice || minRating > 0;

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      if (!product.farmer) return false;
      
      // Use product.state or fall back to farmer's state
      const productState = product.state || product.farmer.state;
      
      // State filter - "all" shows all states
      const matchesState = selectedState === 'all' || productState === selectedState;
      
      const matchesCategory = category === 'all' || product.category === category;
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.farmer.farm_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Price range filter
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      // Rating filter
      const productRating = product.average_rating || 0;
      const matchesRating = productRating >= minRating;
      
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
  }, [products, selectedState, category, searchQuery, sortBy, priceRange, minRating]);

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

  // Show state on products when viewing "all"
  const showStateOnProducts = selectedState === 'all';

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

        {/* Filters */}
        <div className="space-y-6 mb-8">

          {/* Search, Sort & Category */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative max-w-md flex-1">
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
              
              {/* Advanced Filters Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        !
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Products</SheetTitle>
                  </SheetHeader>
                  <div className="py-6 space-y-8">
                    {/* Price Range */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Price Range</Label>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        min={0}
                        max={maxPrice}
                        step={100}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>₦{priceRange[0].toLocaleString()}</span>
                        <span>₦{priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Minimum Rating */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Minimum Rating</Label>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3, 4].map((rating) => (
                          <Button
                            key={rating}
                            variant={minRating === rating ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMinRating(rating)}
                            className="gap-1"
                          >
                            {rating === 0 ? 'All' : (
                              <>
                                {rating}+
                                <Star className="h-3 w-3 fill-current" />
                              </>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Reset Filters */}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={resetFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reset All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <CategoryFilter selected={category} onChange={setCategory} />
          </div>
          
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {priceRange[0] > 0 && (
                <Button variant="secondary" size="sm" onClick={() => setPriceRange([0, priceRange[1]])}>
                  Min: ₦{priceRange[0].toLocaleString()} <X className="h-3 w-3 ml-1" />
                </Button>
              )}
              {priceRange[1] < maxPrice && (
                <Button variant="secondary" size="sm" onClick={() => setPriceRange([priceRange[0], maxPrice])}>
                  Max: ₦{priceRange[1].toLocaleString()} <X className="h-3 w-3 ml-1" />
                </Button>
              )}
              {minRating > 0 && (
                <Button variant="secondary" size="sm" onClick={() => setMinRating(0)}>
                  {minRating}+ Stars <X className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transformedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {transformedProducts.map(product => (
              <ProductCard key={product.id} product={product} showState={showStateOnProducts} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-2">No products found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {products.length === 0 
                ? 'No products have been listed yet. Check back soon!'
                : 'Try adjusting your filters or search query'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={resetFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
