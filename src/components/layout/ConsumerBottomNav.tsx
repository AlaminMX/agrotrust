import { Link, useLocation } from 'react-router-dom';
import { Home, Search, User, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Browse', icon: Search, href: '/products' },
  { label: 'Sell', icon: Store, href: '/farmer/onboarding' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export const ConsumerBottomNav = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <Link key={item.href} to={item.href} className={cn("flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
