import { Users, ShoppingBag, MapPin, Star } from 'lucide-react';

const stats = [
  { icon: Users, value: '150+', label: 'Verified Farmers' },
  { icon: ShoppingBag, value: '5,000+', label: 'Orders Delivered' },
  { icon: MapPin, value: '4', label: 'States Covered' },
  { icon: Star, value: '4.8', label: 'Average Rating' },
];

export const TrustStats = () => {
  return (
    <section className="py-16 bg-primary">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="h-6 w-6 text-gold" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-primary-foreground/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
