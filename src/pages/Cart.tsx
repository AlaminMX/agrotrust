import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { STATES } from '@/types';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Shield } from 'lucide-react';

const Cart = () => {
  const {
    items,
    selectedState,
    setSelectedState,
    updateQuantity,
    removeFromCart,
    subtotal,
    deliveryFee,
    total,
  } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Browse our products and add items to your cart</p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 p-4 bg-card rounded-xl border border-border"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      <p className="text-sm text-earth">{product.farmName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium text-foreground">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.available}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-semibold text-foreground">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">Order Summary</h2>

              {/* Delivery Location */}
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Delivery State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value as typeof selectedState)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground"
                >
                  {STATES.map(state => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Totals */}
              <div className="space-y-3 py-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="text-foreground">{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-3 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link to="/checkout">
                <Button className="w-full mt-4" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              {/* Escrow Notice */}
              <div className="mt-4 p-3 bg-primary/5 rounded-lg flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Your payment is protected by escrow. Funds are only released to the farmer after you confirm delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
