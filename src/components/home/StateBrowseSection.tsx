import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useStates } from '@/hooks/useStates';

export const StateBrowseSection = () => {
  const { states } = useStates();

  return (
    <section className="py-8 md:py-16">
      <div className="container">
        <div className="text-center mb-5 md:mb-8">
          <h2 className="text-lg md:text-3xl font-bold text-foreground mb-1 md:mb-2">Browse by State</h2>
          <p className="text-xs md:text-base text-muted-foreground">Discover farmers and produce in your state</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 md:gap-4">
          {states.map(s => (
            <Link
              key={s.value}
              to={`/products/${s.value}`}
              className="group flex items-center gap-2.5 md:gap-3 p-3 md:p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-card-hover transition-all duration-200"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">{s.label}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">View listings</p>
              </div>
            </Link>
          ))}
          <Link
            to="/products"
            className="group flex items-center gap-2.5 md:gap-3 p-3 md:p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-card-hover transition-all duration-200"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 md:h-5 md:w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">All Nigeria</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Browse all</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
