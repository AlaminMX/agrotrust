import { Link } from 'react-router-dom';
import { STATES } from '@/types';
import { MapPin } from 'lucide-react';

export const BrowseByStateSection = () => {
  const states = STATES.filter((state) => state.value !== 'all');

  return (
    <section className="py-12 bg-muted/20">
      <div className="container">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Browse by State</h2>
          <p className="text-muted-foreground">Find produce listings from farmers in your state.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {states.map((state) => (
            <Link
              key={state.value}
              to={`/products/${state.value}`}
              className="rounded-lg border bg-card p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{state.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
