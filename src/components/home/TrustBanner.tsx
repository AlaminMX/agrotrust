import { Shield, Truck, Users, Leaf } from 'lucide-react';

const trustItems = [
  {
    icon: Shield,
    title: 'Escrow Protection',
    description: 'Payment held until delivery confirmed',
  },
  {
    icon: Users,
    title: 'Verified Farmers',
    description: 'All farmers are vetted and approved',
  },
  {
    icon: Truck,
    title: 'Platform Delivery',
    description: 'We handle logistics for you',
  },
  {
    icon: Leaf,
    title: 'Fresh Produce',
    description: 'Direct from farm to your table',
  },
];

export const TrustBanner = () => {
  return (
    <section className="py-6 bg-primary/5 border-y border-border">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
