import { Link } from 'react-router-dom';
import { MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/format';
import { formatLocation } from '@/lib/location';
import { getAvailabilityStatus, getAvailabilityColor, State, STATES } from '@/types';

interface ProductData {
  id: string;
  name: string;
  price: number;
  unit: string;
  image_url?: string | null;
  image?: string;
  available_quantity?: number;
  available?: number;
  farm_name?: string;
  farmName?: string;
  is_verified?: boolean;
  isVerified?: boolean;
  state?: string;
  area?: string | null;
  is_negotiable?: boolean;
  category?: string;
}

interface JumiaProductCardProps {
  product: ProductData;
  showState?: boolean;
}

export const JumiaProductCard = ({ product, showState = false }: JumiaProductCardProps) => {
  const imageUrl = product.image_url || product.image || '/placeholder.svg';
  const farmName = product.farm_name || product.farmName || 'Local Farm';
  const isVerified = product.is_verified ?? product.isVerified ?? false;
  const isNegotiable = product.is_negotiable ?? false;
  const quantity = product.available_quantity ?? product.available ?? 0;
  const availStatus = getAvailabilityStatus(quantity);
  const productState = product.state;

  return (
    <Link to={`/products/id/${product.id}`} className="group block bg-card rounded-xl border border-border overflow-hidden hover:shadow-card-hover hover:border-primary/20 transition-all duration-200">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img src={imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        {/* Verified badge */}
        {isVerified && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          </div>
        )}
        {/* Availability chip */}
        <div className="absolute top-2 right-2">
          <Badge className={`${getAvailabilityColor(availStatus)} text-[10px] px-1.5 py-0`}>{availStatus}</Badge>
        </div>
        {isNegotiable && (
          <span className="absolute bottom-2 left-2 bg-accent text-accent-foreground text-[10px] px-2 py-0.5 rounded font-medium">
            Negotiable
          </span>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-foreground">{formatPrice(product.price)}</span>
          <span className="text-xs text-muted-foreground">/{product.unit}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="truncate">{farmName}</span>
          {showState && productState && (
            <span className="flex items-center gap-0.5 shrink-0 ml-2 text-primary font-medium">
              <MapPin className="h-3 w-3" />
              {formatLocation(productState, product.area)}
            </span>
          )}
        </div>

        <Button size="sm" variant="outline" className="w-full mt-1.5 gap-1.5 text-xs h-8" onClick={(e) => e.preventDefault()}>
          <MessageCircle className="h-3.5 w-3.5" /> Contact Farmer
        </Button>
      </div>
    </Link>
  );
};
