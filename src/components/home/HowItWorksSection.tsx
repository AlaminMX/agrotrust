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
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How AgroTrust Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple, trusted way to connect with verified farmers
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {index < steps.length - 1 && <div className="hidden md:block absolute top-10 left-[60%] w-[calc(100%-60%+2rem)] h-0.5 bg-border" />}
              <div className="bg-card rounded-xl p-6 border border-border shadow-card relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{index + 1}</div>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><step.icon className="h-7 w-7 text-primary" /></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
