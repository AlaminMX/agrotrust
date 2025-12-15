import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, HelpCircle, ChevronDown, Search, Menu, X, Leaf, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { STATES } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const categories = [
  { label: 'Vegetables', value: 'vegetables', icon: '🥬' },
  { label: 'Fruits', value: 'fruits', icon: '🍎' },
  { label: 'Grains', value: 'grains', icon: '🌾' },
  { label: 'Tubers', value: 'tubers', icon: '🥔' },
  { label: 'Poultry', value: 'poultry', icon: '🍗' },
  { label: 'Dairy', value: 'dairy', icon: '🥛' },
  { label: 'Herbs & Spices', value: 'herbs', icon: '🌿' },
];

export const JumiaHeader = () => {
  const { items, totalItems, selectedState, setSelectedState } = useCart();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) {
        setUserRoles([]);
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      setUserRoles(data?.map(r => r.role) || []);
    };
    fetchUserRoles();
  }, [user]);

  const isFarmer = userRoles.includes('farmer');
  const isAdmin = userRoles.includes('admin');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full bg-card shadow-sm">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                📍 {STATES.find(s => s.value === selectedState)?.label || 'Select State'}
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-card">
                {STATES.map(state => (
                  <DropdownMenuItem 
                    key={state.value} 
                    onClick={() => setSelectedState(state.value as typeof selectedState)}
                    className={cn(selectedState === state.value && "bg-primary/10")}
                  >
                    {state.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Link to="/farmer/onboarding" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <Store className="h-3 w-3" />
              Sell on AgroTrust
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                <HelpCircle className="h-3 w-3" />
                Help
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                <DropdownMenuItem asChild>
                  <Link to="/how-it-works">How It Works</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/track-order">Track Order</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container py-3">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:block">AgroTrust</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, farms..."
                className="w-full h-11 pl-4 pr-12 rounded-lg border-2 border-orange bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-dark"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-11 w-12 flex items-center justify-center bg-orange rounded-r-lg hover:bg-orange-dark transition-colors"
              >
                <Search className="h-5 w-5 text-white" />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden sm:flex items-center gap-2 h-11">
                    <User className="h-5 w-5" />
                    <div className="text-left hidden md:block">
                      <p className="text-xs text-muted-foreground">Account</p>
                      <p className="text-sm font-medium text-foreground">Hi, User</p>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Orders</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  {isFarmer && (
                    <DropdownMenuItem asChild>
                      <Link to="/farmer/dashboard">Farmer Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  {!isFarmer && !isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/farmer/onboarding">Become a Farmer</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" className="hidden sm:flex items-center gap-2 h-11" asChild>
                <Link to="/auth">
                  <User className="h-5 w-5" />
                  <div className="text-left hidden md:block">
                    <p className="text-xs text-muted-foreground">Sign In</p>
                    <p className="text-sm font-medium text-foreground">Account</p>
                  </div>
                </Link>
              </Button>
            )}

            {/* Cart */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center gap-2 h-11">
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange text-xs font-bold text-white">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs text-muted-foreground">Cart</p>
                    <p className="text-sm font-medium text-foreground">₦{subtotal.toLocaleString()}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-card p-4">
                {items.length === 0 ? (
                  <div className="text-center py-6">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-64 overflow-auto space-y-3">
                      {items.slice(0, 3).map(({ product, quantity }) => (
                        <div key={product.id} className="flex gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-14 h-14 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {quantity}</p>
                            <p className="text-sm font-semibold text-orange">₦{(product.price * quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{items.length - 3} more items
                        </p>
                      )}
                    </div>
                    <div className="border-t border-border mt-4 pt-4">
                      <div className="flex justify-between mb-4">
                        <span className="font-medium text-foreground">Subtotal</span>
                        <span className="font-bold text-foreground">₦{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" asChild>
                          <Link to="/cart">View Cart</Link>
                        </Button>
                        <Button className="flex-1 bg-orange hover:bg-orange-dark" asChild>
                          <Link to="/checkout">Checkout</Link>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Category Bar */}
      <div className="border-t border-border bg-card hidden lg:block">
        <div className="container">
          <nav className="flex items-center gap-1 h-11 overflow-x-auto">
            {categories.map(category => (
              <Link
                key={category.value}
                to={`/products?category=${category.value}`}
                className={cn(
                  "flex items-center gap-1.5 px-4 h-full text-sm font-medium transition-colors whitespace-nowrap",
                  "text-foreground hover:text-orange hover:bg-orange/5"
                )}
              >
                <span>{category.icon}</span>
                {category.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <nav className="container py-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {categories.map(category => (
                <Link
                  key={category.value}
                  to={`/products?category=${category.value}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium text-foreground">{category.label}</span>
                </Link>
              ))}
            </div>
            <div className="pt-4 border-t border-border space-y-2">
              {!user && (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">Sign In / Register</Button>
                </Link>
              )}
              <Link to="/how-it-works" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full">How It Works</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
