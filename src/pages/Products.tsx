import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { StateBanner } from '@/components/products/StateBanner';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { State, ProductCategory, STATES } from '@/types';
import { useCart } from '@/context/CartContext';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  farmer_profiles: {
    farm_name: string;
    state: string;
    verification_status: string;
  };
}

const Products = () => {
  const [searchParams] = useSearchParams();
  const { selectedState, setSelectedState, items, clearCart } = useCart();
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);

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
      const { data, error } = await supabase
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
          farmer_profiles!inner (
            farm_name,
            state,
            verification_status
          )
        `)
        .eq('is_active', true)
        .eq('farmer_profiles.verification_status', 'approved');

      if (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const handleStateChange = (newState: State) => {
    if (items.length > 0 && newState !== selectedState) {
      clearCart();
      toast.info('Cart cleared', { 
        description: 'Your cart was cleared because you changed your delivery location.' 
      });
    }
    setSelectedState(newState);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Use product.state or fall back to farmer's state
      const productState = product.state || product.farmer_profiles.state;
      const matchesState = productState === selectedState;
      const matchesCategory = category === 'all' || product.category === category;
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.farmer_profiles.farm_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesState && matchesCategory && matchesSearch;
    });
  }, [products, selectedState, category, searchQuery]);

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
      farmerId: product.id,
      farmerName: product.farmer_profiles.farm_name,
      farmName: product.farmer_profiles.farm_name,
      state: (product.state || product.farmer_profiles.state) as State,
      available: product.available_quantity,
      rating: product.average_rating || 0,
      reviewCount: product.review_count || 0,
      isVerified: product.farmer_profiles.verification_status === 'approved',
      inStock: product.available_quantity > 0,
    }));
  }, [filteredProducts]);

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

          {/* Search & Category */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or farms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <CategoryFilter selected={category} onChange={setCategory} />
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transformedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {transformedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
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
    </Layout>
  );
};

export default Products;
