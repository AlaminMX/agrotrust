import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Leaf, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Browse' },
  { href: '/how-it-works', label: 'How It Works' },
];

export const Header = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) { setUserRoles([]); return; }
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      setUserRoles(data?.map(r => r.role) || []);
    };
    fetchUserRoles();
  }, [user]);

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  const isFarmer = userRoles.includes('farmer');
  const isAdmin = userRoles.includes('admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">AgroTrust</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link key={link.href} to={link.href}
              className={cn("text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.href ? "text-primary" : "text-muted-foreground")}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild><Link to="/profile">My Profile</Link></DropdownMenuItem>
                {isAdmin && <DropdownMenuItem asChild><Link to="/admin">Admin Dashboard</Link></DropdownMenuItem>}
                {isFarmer && <DropdownMenuItem asChild><Link to="/farmer/dashboard">Farmer Dashboard</Link></DropdownMenuItem>}
                {!isFarmer && !isAdmin && <DropdownMenuItem asChild><Link to="/farmer/onboarding">Become a Farmer</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild><Link to="/auth">Sign In</Link></Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMenuOpen(false)} />
          <div ref={menuRef} className="fixed top-16 left-0 right-0 z-50 md:hidden border-b border-border bg-card shadow-lg">
            <nav className="container py-4 flex flex-col gap-3">
              {navLinks.map(link => (
                <Link key={link.href} to={link.href} onClick={() => setIsMenuOpen(false)}
                  className={cn("text-sm font-medium py-2 transition-colors hover:text-primary",
                    location.pathname === link.href ? "text-primary" : "text-muted-foreground")}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
