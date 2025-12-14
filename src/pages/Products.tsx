import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { StateSelector } from '@/components/products/StateSelector';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { mockProducts } from '@/data/mockData';
import { State, ProductCategory } from '@/types';
import { useCart } from '@/context/CartContext';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Products = () => {
  const { selectedState, setSelectedState } = useCart();
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const matchesState = product.state === selectedState;
      const matchesCategory = category === 'all' || product.category === category;
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.farmName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesState && matchesCategory && matchesSearch;
    });
  }, [selectedState, category, searchQuery]);

  return (
    <Layout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Products</h1>
          <p className="text-muted-foreground">Fresh produce from verified farmers near you</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Filters */}
        <div className="space-y-6 mb-8">
          {/* State Selector */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Select Your State</h3>
            <StateSelector selected={selectedState} onChange={setSelectedState} />
          </div>

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
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-2">No products found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Products;
