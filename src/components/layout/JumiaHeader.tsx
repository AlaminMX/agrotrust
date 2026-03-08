import { Link, useNavigate } from 'react-router-dom';
import { User, Shield, ChevronDown, Search, Menu, X, Leaf, Store, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useStates } from '@/hooks/useStates';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const categories = [
  { label: 'Vegetables', value: 'vegetables', icon: '🥬' },
  { label: 'Fruits', value: 'fruits', icon: '🍎' },
  { label: 'Grains', value: 'grains', icon: '🌾' },
  { label: 'Tubers', value: 'tubers', icon: '🥔' },
  { label: 'Poultry', value: 'poultry', icon: '🍗' },
  { label: 'Dairy', value: 'dairy', icon: '🥛' },
  { label: 'Herbs & Spices', value: 'herbs', icon: '🌿' },
  { label: 'Meat', value: 'meat', icon: '🥩' },
];

export const JumiaHeader = () => {
  const { selectedState, setSelectedState } = useCart();
  const { user, signOut } = useAuth();
  const { allStates } = useStates();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) { setUserRoles([]); return; }
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      setUserRoles(data?.map(r => r.role) || []);
    };
    fetchRoles();
  }, [user]);

  const isFarmer = userRoles.includes('farmer');
  const isAdmin = userRoles.includes('admin');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b border-border">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container flex h-9 items-center justify-between text-xs">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              📍 {allStates.find(s => s.value === selectedState)?.label || 'All Nigeria'}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-card">
              {allStates.map(state => (
                <DropdownMenuItem
                  key={state.value}
                  onClick={() => setSelectedState(state.value as typeof selectedState)}
                  className={cn(selectedState === state.value && "bg-primary/10 font-medium")}
                >
                  {state.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/farmer/onboarding" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <Store className="h-3 w-3" /> List on AgroTrust
            </Link>
            <Link to="/trust-and-safety" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <Shield className="h-3 w-3" /> Trust & Safety
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="container py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:block">AgroTrust</span>
          </Link>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
            <div className="relative flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search produce, farmers, areas..."
                className="w-full h-10 pl-4 pr-12 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <button type="submit" className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-r-lg hover:bg-primary/90 transition-colors">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
          
          <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <Search className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            {isFarmer && (
              <Link to="/farmer/products/add" className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" /> Add Listing
              </Link>
            )}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden sm:flex items-center gap-2 h-10">
                    <User className="h-5 w-5" />
                    <div className="text-left hidden md:block">
                      <p className="text-xs text-muted-foreground">Account</p>
                    </div>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-card">
                  {!isAdmin && <DropdownMenuItem asChild><Link to="/profile">My Account</Link></DropdownMenuItem>}
                  {isAdmin && <DropdownMenuItem asChild><Link to="/admin">Admin Dashboard</Link></DropdownMenuItem>}
                  {isFarmer && (
                    <>
                      <DropdownMenuItem asChild><Link to="/farmer/dashboard">Farmer Dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/farmer/products/add"><Plus className="h-4 w-4 mr-2" />Add Listing</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isFarmer && !isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/farmer/onboarding" className="text-primary font-medium">
                          <Store className="h-4 w-4 mr-2" /> Become a Farmer
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" className="hidden sm:flex items-center gap-2 h-10" asChild>
                <Link to="/auth">
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">Sign In</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div className="border-t border-border bg-card hidden lg:block">
        <div className="container">
          <nav className="flex items-center gap-0.5 h-10 overflow-x-auto">
            {categories.map(c => (
              <Link
                key={c.value}
                to={`/products?category=${c.value}`}
                className="flex items-center gap-1.5 px-3 h-full text-sm font-medium transition-colors whitespace-nowrap text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md"
              >
                <span className="text-base">{c.icon}</span>{c.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile search */}
      {isSearchOpen && (
        <div className="md:hidden border-t border-border bg-card p-3">
          <form onSubmit={handleSearch} className="relative flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search produce, farmers..."
              autoFocus
              className="w-full h-10 pl-4 pr-12 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
            <button type="submit" className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center bg-primary text-primary-foreground rounded-r-lg">
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <nav className="container py-4 space-y-4">
            {user && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex-1"><Button variant="outline" className="w-full text-sm">Admin</Button></Link>}
                  {isFarmer && <Link to="/farmer/dashboard" onClick={() => setIsMenuOpen(false)} className="flex-1"><Button variant="outline" className="w-full text-sm">Dashboard</Button></Link>}
                  {!isAdmin && !isFarmer && <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex-1"><Button variant="outline" className="w-full text-sm"><User className="h-4 w-4 mr-2" />Profile</Button></Link>}
                </div>
                {isFarmer && (
                  <Link to="/farmer/products/add" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full text-sm"><Plus className="h-4 w-4 mr-2" />Add Listing</Button>
                  </Link>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {categories.map(c => (
                <Link
                  key={c.value}
                  to={`/products?category=${c.value}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <span>{c.icon}</span>{c.label}
                </Link>
              ))}
            </div>
            {!user && (
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">Sign In / Register</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
