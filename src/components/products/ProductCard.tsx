import { Link } from 'react-router-dom';
import { Star, MapPin, ShoppingCart, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Product, STATES } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  showState?: boolean;
}

export const ProductCard = ({ product, showState = false }: ProductCardProps) => {
  const { addToCart } = useCart();
  const stateLabel = STATES.find(s => s.value === product.state)?.label || product.state;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = addToCart(product);
    if (success) {
      toast.success(`${product.name} added to cart`);
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Verified Farmer Badge - Prominent */}
        {product.isVerified && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 shadow-lg">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Verified Farmer</span>
          </div>
        )}
        
        {/* State Badge when showing all states */}
        {showState && (
          <div className="absolute top-3 right-3 rounded-full bg-card/95 backdrop-blur px-2.5 py-1 shadow">
            <span className="text-xs font-medium text-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {stateLabel}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Farm Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className={cn(
            "font-medium flex items-center gap-1",
            product.isVerified ? "text-primary" : "text-earth"
          )}>
            {product.isVerified && <BadgeCheck className="h-3.5 w-3.5" />}
            {product.farmName}
          </span>
          {!showState && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {stateLabel}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-gold text-gold" />
          <span className="text-sm font-medium text-foreground">{product.rating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
            <span className="text-sm text-muted-foreground">/{product.unit}</span>
          </div>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
};
