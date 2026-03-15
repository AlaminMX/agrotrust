import { ShieldCheck, Users, MessageCircle, Leaf } from 'lucide-react';

const trustItems = [
  { icon: ShieldCheck, title: 'Verified Farmers', description: 'ID-checked & approved' },
  { icon: Users, title: 'No Middlemen', description: 'Buy direct' },
  { icon: MessageCircle, title: 'Direct Contact', description: 'WhatsApp & call' },
  { icon: Leaf, title: 'Fresh & Local', description: 'Farm to table' },
];

export const TrustBanner = () => {
  return (
    <section className="py-3 md:py-5 bg-card border-y border-border">
      <div className="container">
        <div className="flex overflow-x-auto gap-4 md:grid md:grid-cols-4 md:gap-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2.5 md:gap-3 snap-start shrink-0 min-w-[140px] md:min-w-0">
              <div className="shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary/8 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-xs md:text-sm leading-tight">{item.title}</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
