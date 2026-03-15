import { Search, ShieldCheck, MessageCircle } from 'lucide-react';

const steps = [
  {
    icon: Search,
    number: '1',
    title: 'Browse Farmers',
    description: 'Explore verified farmers across Nigeria by location and category.',
  },
  {
    icon: ShieldCheck,
    number: '2',
    title: 'Check Verification',
    description: 'Every farmer is ID-verified. Look for the green badge.',
  },
  {
    icon: MessageCircle,
    number: '3',
    title: 'Contact Directly',
    description: 'Reach farmers via WhatsApp or phone. Negotiate and buy direct.',
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-10 md:py-16 bg-card border-y border-border">
      <div className="container">
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-lg md:text-2xl font-bold text-foreground">How AgroTrust Works</h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2">Simple, transparent, and direct</p>
        </div>
        <div className="flex gap-4 overflow-x-auto -mx-4 px-4 pb-2 snap-x md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible max-w-4xl md:mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-3 relative snap-start shrink-0 w-[220px] md:w-auto">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-px bg-border" />
              )}
              <div className="relative mx-auto w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary text-primary-foreground text-[10px] md:text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>
              <h3 className="text-sm md:text-base font-semibold text-foreground">{step.title}</h3>
              <p className="text-muted-foreground text-xs md:text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
