import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { STATES } from '@/types';

interface ProductData {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  discount_percentage?: number | null;
  unit: string;
  image_url?: string | null;
  image?: string;
  available_quantity?: number;
  available?: number;
  average_rating?: number;
  rating?: number;
  review_count?: number;
  reviewCount?: number;
  farm_name?: string;
  farmName?: string;
  is_verified?: boolean;
  isVerified?: boolean;
  state?: string;
}

interface JumiaProductCardProps {
  product: ProductData;
  showState?: boolean;
}

export const JumiaProductCard = ({ product, showState = false }: JumiaProductCardProps) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Handle both DB format and legacy format
  const discountPercent = product.discount_percentage || 0;
  const originalPrice = product.original_price || null;
  const imageUrl = product.image_url || product.image || '/placeholder.svg';
  const available = product.available_quantity ?? product.available ?? 0;
  const rating = product.average_rating ?? product.rating ?? 0;
  const reviewCount = product.review_count ?? product.reviewCount ?? 0;
  const farmName = product.farm_name || product.farmName || 'Local Farm';
  const isVerified = product.is_verified ?? product.isVerified ?? false;
  const stateLabel = STATES.find(s => s.value === product.state)?.label || product.state || '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Convert to cart-compatible format
    const success = addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      image: imageUrl,
      available: available,
      farmName: farmName,
      isVerified: isVerified,
      rating: rating,
      reviewCount: reviewCount,
    } as any);
    
    if (success) {
      toast.success(`${product.name} added to cart`);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
            -{discountPercent}%
          </span>
        )}

        {/* Verified Farmer Badge - Prominent */}
        {isVerified && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-bold uppercase tracking-wide">Verified</span>
          </div>
        )}

        {/* Low Stock Warning */}
        {available > 0 && available <= 5 && (
          <span className="absolute bottom-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
            Only {available} left!
          </span>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full shadow-lg bg-card hover:bg-primary hover:text-primary-foreground"
            onClick={handleWishlist}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-primary text-primary")} />
          </Button>
          <Button
            size="icon"
            className="h-9 w-9 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 text-primary-foreground" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Product Name */}
        <h3 className="font-medium text-foreground text-sm line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
            <span className="text-xs text-muted-foreground">/{product.unit}</span>
          </div>
          {originalPrice && originalPrice > product.price && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            </div>
          )}
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
        </div>

        {/* Farm Name & State */}
        <div className="flex items-center justify-between">
          <p className={cn(
            "text-xs truncate flex items-center gap-1",
            isVerified ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {isVerified && <ShieldCheck className="h-3 w-3 flex-shrink-0" />}
            {farmName}
          </p>
          {showState && stateLabel && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
              <MapPin className="h-3 w-3" />
              {stateLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
