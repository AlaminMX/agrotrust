import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/BackButton';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/format';
import { STATES } from '@/types';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Shield, Store, LogIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    selectedState,
    setSelectedState,
    updateQuantity,
    removeFromCart,
    subtotal,
    total,
    itemsByFarmer,
    farmerCount,
    getDeliveryFeePerFarmer,
    getTotalDeliveryFee,
    isGuestCart,
  } = useCart();
  
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const deliveryFeePerFarmer = getDeliveryFeePerFarmer();
  const totalDeliveryFee = getTotalDeliveryFee();

  const handleProceedToCheckout = () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }
    navigate('/checkout');
  };

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
          <div className="flex items-center gap-3 mb-2">
            <BackButton fallbackPath="/products" />
            <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
          </div>
          {farmerCount > 1 && (
            <p className="text-muted-foreground mt-1">
              Items from {farmerCount} different farms • Separate orders will be created
            </p>
          )}
          {isGuestCart && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              You're shopping as a guest. Sign in to save your cart and checkout.
            </p>
          )}
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Grouped by Farmer */}
          <div className="lg:col-span-2 space-y-6">
            {itemsByFarmer.map((group) => (
              <div key={group.farmerId} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Farmer Header */}
                <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{group.farmName}</span>
                  <span className="text-sm text-muted-foreground">by {group.farmerName}</span>
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {group.items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex gap-4 p-4"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground">{product.name}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                            onClick={() => removeFromCart(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
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

                {/* Farmer Subtotal */}
                <div className="bg-muted/30 px-4 py-3 border-t border-border flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Subtotal ({group.items.length} item{group.items.length > 1 ? 's' : ''})
                  </span>
                  <span className="font-semibold">{formatPrice(group.subtotal)}</span>
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

              {/* Farmer Breakdown */}
              {farmerCount > 1 && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Orders breakdown:</p>
                  {itemsByFarmer.map((group) => (
                    <div key={group.farmerId} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground truncate mr-2">{group.farmName}</span>
                      <span>{formatPrice(group.subtotal + deliveryFeePerFarmer)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-3 py-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Delivery Fee {farmerCount > 1 && `(${farmerCount} orders)`}
                  </span>
                  <span className="text-foreground">{formatPrice(totalDeliveryFee)}</span>
                </div>
                {farmerCount > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(deliveryFeePerFarmer)} per farm order
                  </p>
                )}
                <div className="flex justify-between font-semibold pt-3 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button 
                className="w-full mt-4" 
                size="lg"
                onClick={handleProceedToCheckout}
              >
                {user ? (
                  <>
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Sign In to Checkout
                    <LogIn className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Guest notice */}
              {!user && (
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Your cart will be saved when you sign in
                </p>
              )}

              {/* Multi-order notice */}
              {farmerCount > 1 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-800">
                  <Store className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Your cart contains items from {farmerCount} different farms. 
                    {farmerCount} separate orders will be created and tracked individually.
                  </p>
                </div>
              )}

              {/* Escrow Notice */}
              <div className="mt-4 p-3 bg-primary/5 rounded-lg flex items-start gap-2">
                <Shield className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Your payment is protected by escrow. Funds are only released to farmers after you confirm delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Required Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in or create an account to complete your purchase. 
              Don't worry, your cart items will be saved!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Continue Shopping
            </Button>
            <Button onClick={() => navigate('/auth')}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In / Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Cart;
