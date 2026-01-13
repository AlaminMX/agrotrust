import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BackButton } from '@/components/ui/BackButton';
import { useCart } from '@/context/CartContext';
import { formatPrice, formatDate } from '@/lib/format';
import { STATES, Product, State } from '@/types';
import { Star, MapPin, Minus, Plus, ShoppingCart, Calendar, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProductReviews } from '@/components/reviews/ProductReviews';
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
  farmer_id: string;
}

interface FarmerProfile {
  id: string;
  farm_name: string;
  state: string;
  verification_status: string;
  farm_description: string | null;
  user_id: string;
  created_at: string;
  full_name?: string;
  avatar_url?: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // First fetch the product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (productError) throw productError;
        if (!productData) {
          setLoading(false);
          return;
        }
        
        const dbProduct = productData as DatabaseProduct;
        
        // Fetch farmer data from public view (safe - no sensitive data)
        const { data: farmerData } = await supabase
          .from('farmer_profiles_public')
          .select('id, farm_name, state, verification_status, farm_description, user_id, created_at')
          .eq('id', dbProduct.farmer_id)
          .maybeSingle();

        // Get farmer's profile info (name, avatar)
        let farmerName = farmerData?.farm_name || 'Unknown Farm';
        let farmerAvatar = '';
        
        if (farmerData?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', farmerData.user_id)
            .maybeSingle();
          
          if (profileData) {
            farmerName = profileData.full_name || farmerData.farm_name;
            farmerAvatar = profileData.avatar_url || '';
          }
        }
        
        // Transform to Product type
        const transformedProduct: Product = {
          id: dbProduct.id,
          name: dbProduct.name,
          description: dbProduct.description || '',
          price: dbProduct.price,
          unit: dbProduct.unit,
          category: dbProduct.category,
          image: dbProduct.image_url || '/placeholder.svg',
          farmerId: farmerData?.id || dbProduct.farmer_id,
          farmerName: farmerName,
          farmName: farmerData?.farm_name || 'Unknown Farm',
          state: (dbProduct.state || farmerData?.state || 'kaduna') as State,
          available: dbProduct.available_quantity,
          isVerified: farmerData?.verification_status === 'approved',
          rating: dbProduct.average_rating || 0,
          reviewCount: dbProduct.review_count || 0,
        };
        
        setProduct(transformedProduct);
        
        if (farmerData) {
          setFarmer({
            id: farmerData.id,
            farm_name: farmerData.farm_name,
            state: farmerData.state,
            verification_status: farmerData.verification_status,
            farm_description: farmerData.farm_description,
            user_id: farmerData.user_id,
            created_at: farmerData.created_at,
            full_name: farmerName,
            avatar_url: farmerAvatar,
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const stateLabel = STATES.find(s => s.value === product.state)?.label || product.state;

  const handleAddToCart = () => {
    const success = addToCart(product, quantity);
    if (success) {
      toast({
        title: "Added to cart",
        description: `${quantity}x ${product.name} added to your cart`,
      });
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <BackButton fallbackPath="/products" />
          <span>Back to Products</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Product Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Farm Badge */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-earth">{product.farmName}</span>
              {product.isVerified && <VerifiedBadge size="sm" />}
            </div>

            {/* Title & Location */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{stateLabel}</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-gold text-gold'
                        : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
              <span className="text-lg text-muted-foreground">per {product.unit}</span>
            </div>

            {/* Description */}
            <p className="text-muted-foreground">{product.description}</p>

            {/* Availability */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-medium text-foreground">{product.available} {product.unit}s</span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium text-foreground">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(q => Math.min(product.available, q + 1))}
                  disabled={quantity >= product.available}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button size="lg" className="w-full" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart — {formatPrice(product.price * quantity)}
            </Button>

            {/* Farmer Info */}
            {farmer && (
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="font-semibold text-foreground mb-4">About the Farmer</h3>
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {farmer.avatar_url ? (
                      <img
                        src={farmer.avatar_url}
                        alt={farmer.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {(farmer.full_name || farmer.farm_name).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{farmer.full_name || farmer.farm_name}</span>
                      {farmer.verification_status === 'approved' && <VerifiedBadge size="sm" showText={false} />}
                    </div>
                    <p className="text-sm text-earth font-medium">{farmer.farm_name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {STATES.find(s => s.value === farmer.state)?.label || farmer.state}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Member since {formatDate(farmer.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                {farmer.farm_description && (
                  <p className="text-sm text-muted-foreground mt-4">{farmer.farm_description}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ProductReviews productId={product.id} />
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
