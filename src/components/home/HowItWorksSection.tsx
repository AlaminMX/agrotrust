import { Search, Filter, Phone, ShieldCheck } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Browse & Select',
    description: 'Explore fresh produce from verified farmers in your state. Every farmer is vetted and approved.',
  },
  {
    icon: Filter,
    title: 'Filter by State & Category',
    description: 'Narrow results to the produce and location you want, including verified farmers only.'
  },
  {
    icon: Phone,
    title: 'Contact the Farmer',
    description: 'Open WhatsApp, call, or email the farmer directly to negotiate and arrange fulfillment.'
  },
  {
    icon: ShieldCheck,
    title: 'Stay Safe',
    description: 'Use verified profiles and report suspicious listings so admins can review quickly.'
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How AgroTrust Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple directory flow for discovery, trust, and direct farmer contact
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[calc(100%-60%+2rem)] h-0.5 bg-border" />
              )}
              
              <div className="bg-card rounded-xl p-6 border border-border shadow-card relative">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                
                {/* Content */}
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
