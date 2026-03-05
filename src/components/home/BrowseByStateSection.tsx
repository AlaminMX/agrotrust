import { Link } from 'react-router-dom';
import { STATES } from '@/types';
import { MapPin } from 'lucide-react';

export const BrowseByStateSection = () => {
  const states = STATES.filter((state) => state.value !== 'all');

  return (
    <section className="py-8 bg-muted/30">
      <div className="container">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Browse by State
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {states.map((state) => (
            <Link
              key={state.value}
              to={`/products?state=${state.value}`}
              className="p-3 rounded-lg border bg-card text-center hover:border-primary hover:shadow-sm transition-all text-sm font-medium text-foreground"
            >
              {state.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
