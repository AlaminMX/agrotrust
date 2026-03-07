import { Link } from 'react-router-dom';
import { MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { Product, STATES, getAvailabilityStatus, getAvailabilityColor } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/format';
import { formatLocation } from '@/lib/location';

interface ProductCardProps {
  product: Product & { area?: string | null };
  showState?: boolean;
}

export const ProductCard = ({ product, showState = false }: ProductCardProps) => {
  const availabilityStatus = getAvailabilityStatus(product.available);
  const availabilityColor = getAvailabilityColor(availabilityStatus);

  return (
    <Link
      to={`/products/id/${product.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-card-hover hover:border-primary/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        {product.isVerified && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground font-semibold px-2.5 py-1 rounded-full text-xs shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className={`${availabilityColor} text-xs`}>{availabilityStatus}</Badge>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium truncate">{product.farmName}</span>
          {showState && (
            <span className="flex items-center gap-1 text-primary font-medium shrink-0 ml-2">
              <MapPin className="h-3 w-3" />
              {formatLocation(product.state, product.area)}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
            <span className="text-sm text-muted-foreground">/{product.unit}</span>
          </div>
          <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={(e) => e.preventDefault()}>
            <MessageCircle className="h-3.5 w-3.5" /> Contact
          </Button>
        </div>
      </div>
    </Link>
  );
};
