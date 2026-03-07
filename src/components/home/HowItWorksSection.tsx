import { Search, ShieldCheck, MessageCircle } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Browse Farmers',
    description: 'Explore produce from verified farmers across Nigeria. Filter by location, category, and availability.',
  },
  {
    icon: ShieldCheck,
    title: 'Verify Trust',
    description: 'Every farmer is ID-verified and admin-approved. Look for the green "Verified Farmer" badge.',
  },
  {
    icon: MessageCircle,
    title: 'Contact Directly',
    description: 'Reach farmers via WhatsApp or phone. Negotiate price, arrange delivery, and buy directly.',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <h2 className="text-2xl font-bold text-foreground text-center mb-10">How AgroTrust Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
