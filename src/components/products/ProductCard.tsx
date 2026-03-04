import { Link } from 'react-router-dom';
import { Star, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { Product, STATES } from '@/types';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { formatPrice } from '@/lib/format';

interface ProductCardProps {
  product: Product;
  showState?: boolean;
}

export const ProductCard = ({ product, showState = false }: ProductCardProps) => {
  const stateLabel = product.state && product.state !== 'all' 
    ? STATES.find(s => s.value === product.state)?.label 
    : null;

  const productUrl = `/products/${product.state}/${product.slug || product.id}`;

  return (
    <Link
      to={productUrl}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        {product.isVerified && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold px-2.5 py-1 rounded-full text-xs shadow-lg">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Farmer
            </span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-earth">{product.farmName}</span>
          {showState && stateLabel && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <MapPin className="h-3 w-3" />
              {stateLabel}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-gold text-gold" />
          <span className="text-sm font-medium text-foreground">{product.rating}</span>
          <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
            <span className="text-sm text-muted-foreground">/{product.unit}</span>
          </div>
          <Button size="sm" variant="secondary" className="rounded-full gap-1.5" onClick={(e) => e.preventDefault()}>
            <MessageCircle className="h-3.5 w-3.5" />
            Contact
          </Button>
        </div>
      </div>
    </Link>
  );
};
