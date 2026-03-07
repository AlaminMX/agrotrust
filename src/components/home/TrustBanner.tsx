import { ShieldCheck, Users, MessageCircle, Leaf } from 'lucide-react';

const trustItems = [
  { icon: ShieldCheck, title: 'Verified Farmers', description: 'ID-checked & admin approved' },
  { icon: Users, title: 'No Middlemen', description: 'Buy directly from the source' },
  { icon: MessageCircle, title: 'Direct Contact', description: 'WhatsApp, call, or email' },
  { icon: Leaf, title: 'Fresh & Local', description: 'Farm to your table' },
];

export const TrustBanner = () => {
  return (
    <section className="py-5 bg-card border-y border-border">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center">
                <item.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm leading-tight">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-tight">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
