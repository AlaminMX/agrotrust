import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface JumiaProductCardProps {
  product: Product;
  showDiscount?: boolean;
}

export const JumiaProductCard = ({ product, showDiscount = false }: JumiaProductCardProps) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Generate random discount for demo
  const discountPercent = showDiscount ? Math.floor(Math.random() * 20) + 5 : 0;
  const originalPrice = showDiscount ? Math.round(product.price * (100 / (100 - discountPercent))) : product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
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
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-orange text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercent}%
          </span>
        )}

        {/* Verified Badge */}
        {product.isVerified && (
          <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
            ✓ Verified
          </span>
        )}

        {/* Low Stock Warning */}
        {product.available <= 5 && (
          <span className="absolute bottom-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
            Only {product.available} left!
          </span>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full shadow-lg bg-card hover:bg-orange hover:text-white"
            onClick={handleWishlist}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-orange text-orange")} />
          </Button>
          <Button
            size="icon"
            className="h-9 w-9 rounded-full shadow-lg bg-orange hover:bg-orange-dark"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Product Name */}
        <h3 className="font-medium text-foreground text-sm line-clamp-2 min-h-[40px] group-hover:text-orange transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
            <span className="text-xs text-muted-foreground">/{product.unit}</span>
          </div>
          {discountPercent > 0 && (
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
          <span className="text-sm font-medium text-foreground">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>

        {/* Farm Name */}
        <p className="text-xs text-muted-foreground truncate">
          by {product.farmName}
        </p>
      </div>
    </Link>
  );
};
