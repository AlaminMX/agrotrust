import { Link } from 'react-router-dom';
import { Star, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { STATES, State } from '@/types';

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
  is_negotiable?: boolean;
  listing_status?: string;
}

interface JumiaProductCardProps {
  product: ProductData;
  showState?: boolean;
}

export const JumiaProductCard = ({ product, showState = false }: JumiaProductCardProps) => {
  const discountPercent = product.discount_percentage || 0;
  const originalPrice = product.original_price || null;
  const imageUrl = product.image_url || product.image || '/placeholder.svg';
  const rating = product.average_rating ?? product.rating ?? 0;
  const reviewCount = product.review_count ?? product.reviewCount ?? 0;
  const farmName = product.farm_name || product.farmName || 'Local Farm';
  const isVerified = product.is_verified ?? product.isVerified ?? false;
  const isNegotiable = product.is_negotiable ?? false;
  const productState = product.state as State | undefined;
  const stateLabel = productState && productState !== 'all' 
    ? STATES.find(s => s.value === productState)?.label 
    : null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img src={imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">
            -{discountPercent}%
          </span>
        )}

        {isVerified && (
          <div className="absolute top-2 right-2">
            <VerifiedBadge variant="prominent" size="sm" showText={false} />
          </div>
        )}

        {isNegotiable && (
          <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium">
            Negotiable
          </span>
        )}
      </div>

      <div className="p-3 space-y-2">
        {isVerified && (
          <div className="flex items-center">
            <VerifiedBadge size="sm" />
          </div>
        )}

        <h3 className="font-medium text-foreground text-sm line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
            <span className="text-xs text-muted-foreground">/{product.unit}</span>
          </div>
          {originalPrice && originalPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">by {farmName}</span>
          {showState && stateLabel && (
            <span className="flex items-center gap-0.5 shrink-0 ml-2 text-primary font-medium">
              <MapPin className="h-3 w-3" />
              {stateLabel}
            </span>
          )}
        </div>

        <Button size="sm" variant="outline" className="w-full mt-2 gap-1.5 text-xs" onClick={(e) => e.preventDefault()}>
          <MessageCircle className="h-3.5 w-3.5" />
          Contact Farmer
        </Button>
      </div>
    </Link>
  );
};
