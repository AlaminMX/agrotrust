import { Link } from 'react-router-dom';
import { Star, MapPin, ShoppingCart } from 'lucide-react';
import { Product, STATES } from '@/types';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const stateLabel = STATES.find(s => s.value === product.state)?.label || product.state;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
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
        {product.isVerified && (
          <div className="absolute top-3 left-3 rounded-full bg-card/95 backdrop-blur px-2.5 py-1">
            <VerifiedBadge size="sm" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Farm Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-earth">{product.farmName}</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {stateLabel}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-gold text-gold" />
          <span className="text-sm font-medium text-foreground">{product.rating}</span>
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
