import { Layout } from '@/components/layout/Layout';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { BackButton } from '@/components/ui/BackButton';
import { Shield, Users, Phone, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Shield,
    title: 'Verified Farmer Badges',
    description: 'Only approved farmers get the verified badge so buyers can quickly identify trusted listings.',
  },
  {
    icon: Users,
    title: 'Browse by State & Category',
    description: 'Guests can explore produce listings openly and filter by state, category, and availability.',
  },
  {
    icon: Phone,
    title: 'Direct Contact',
    description: 'Buyers connect directly with farmers through WhatsApp, call, or email—no checkout in the app.',
  },
];

const faqs = [
  {
    question: 'Does AgroTrust process payments?',
    answer: 'No. AgroTrust is a directory marketplace. Buyers and farmers handle agreements directly outside the platform.',
  },
  {
    question: 'How do I stay safe when buying?',
    answer: 'Always confirm the farmer profile, ask for current photos/videos, and use the report button if a listing looks suspicious.',
  },
  {
    question: 'How are farmers verified?',
    answer: 'Admins review submitted documents and profile details before approving verification status.',
  },
  {
    question: 'How can I report a listing?',
    answer: 'Open any product page and use the “Report this listing” form. Admins review reports and take action.',
  },
];

const HowItWorks = () => {
  return (
    <Layout>
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center gap-2 mb-6">
            <BackButton fallbackPath="/" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">How AgroTrust Works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover produce, verify trusted farmers, and connect directly.
            </p>
          </div>
        </div>
      </section>

      <HowItWorksSection />

      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose AgroTrust</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(feature => (
              <div key={feature.title} className="flex gap-4 p-6 bg-card rounded-xl border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-sm text-primary font-medium mb-4">
              <HelpCircle className="h-4 w-4" />FAQs
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Trust & Safety</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map(faq => (
              <div key={faq.question} className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to browse listings?</h2>
          <Link to="/products"><Button size="lg">Browse Products</Button></Link>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
