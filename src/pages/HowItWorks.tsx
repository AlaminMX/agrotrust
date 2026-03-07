import { Layout } from '@/components/layout/Layout';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { BackButton } from '@/components/ui/BackButton';
import { Shield, Users, MessageCircle, ShieldCheck, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Shield,
    title: 'Verified Farmers Only',
    description: 'Every farmer on AgroTrust goes through a multi-step verification process. We check farm documentation and verify identity before approval.',
  },
  {
    icon: Users,
    title: 'Direct Connection',
    description: 'No middlemen. Contact farmers directly via WhatsApp, phone, or email. Negotiate prices and arrange pickup or delivery yourself.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Contact',
    description: 'Reach farmers instantly via WhatsApp. Discuss produce quality, negotiate pricing, and arrange transactions directly.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust & Transparency',
    description: 'See verified badges, specific locations, and real farm information. Know exactly who you\'re buying from.',
  },
];

const faqs = [
  {
    question: 'How are farmers verified?',
    answer: 'Farmers submit ID documents and farm details. Our team reviews each application, verifies identity, and approves only legitimate farmers.',
  },
  {
    question: 'How do I contact a farmer?',
    answer: 'Every verified farmer has WhatsApp and phone contact buttons on their profile and product listings. Click to reach them directly.',
  },
  {
    question: 'Is it safe to buy directly from farmers?',
    answer: 'AgroTrust verifies every farmer\'s identity and farm details. Look for the green verified badge. Always exercise caution with any direct transaction.',
  },
  {
    question: 'How do I become a verified farmer?',
    answer: 'Click "Become a Verified Farmer" and submit your farm details and ID documents. Our team will review your application within 1-2 business days.',
  },
];

const HowItWorks = () => {
  return (
    <Layout>
      <section className="py-16 bg-secondary/50">
        <div className="container">
          <div className="flex items-center gap-2 mb-6"><BackButton fallbackPath="/" /></div>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Trust & Safety</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              How AgroTrust ensures a safe, transparent marketplace connecting buyers directly with verified farmers.
            </p>
          </div>
        </div>
      </section>

      <HowItWorksSection />

      <section className="py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-3">Why Choose AgroTrust</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map(feature => (
              <div key={feature.title} className="flex gap-4 p-5 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1 text-sm">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-card border-y border-border">
        <div className="container">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-4">
              <HelpCircle className="h-4 w-4" /> FAQs
            </div>
            <h2 className="text-2xl font-bold text-foreground">Common Questions</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map(faq => (
              <div key={faq.question} className="bg-background rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground mb-2 text-sm">{faq.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Browse fresh produce from verified farmers or join as a farmer to list your produce.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/products"><Button size="lg">Browse Listings</Button></Link>
            <Link to="/farmer/onboarding"><Button size="lg" variant="outline">Become a Farmer</Button></Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
