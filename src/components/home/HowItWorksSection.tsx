import { Search, ShieldCheck, MessageCircle } from 'lucide-react';

const steps = [
  {
    icon: Search,
    number: '1',
    title: 'Browse Farmers',
    description: 'Explore produce from verified farmers across Nigeria. Filter by location, category, and availability.',
  },
  {
    icon: ShieldCheck,
    number: '2',
    title: 'Check Verification',
    description: 'Every farmer is ID-verified and admin-approved. Look for the green verified badge.',
  },
  {
    icon: MessageCircle,
    number: '3',
    title: 'Contact Directly',
    description: 'Reach farmers via WhatsApp or phone. Negotiate price, arrange pickup, and buy directly.',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-16 bg-card border-y border-border">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">How AgroTrust Works</h2>
          <p className="text-sm text-muted-foreground mt-2">Simple, transparent, and direct</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-4 relative">
              {/* Connecting line on desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-px bg-border" />
              )}
              <div className="relative mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="h-6 w-6 text-primary" />
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
