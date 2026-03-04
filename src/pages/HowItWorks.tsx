import { Layout } from '@/components/layout/Layout';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { EscrowExplainer } from '@/components/home/EscrowExplainer';
import { BackButton } from '@/components/ui/BackButton';
import { Shield, Users, Truck, Star, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Shield,
    title: 'Verified Farmers Only',
    description: 'Every farmer on AgroTrust goes through a multi-step verification process. We check farm documentation, conduct virtual inspections, and verify identity before approval.',
  },
  {
    icon: Users,
    title: 'Direct Connection',
    description: 'Farmers manage their own listings directly, including stock, pricing, and listing status. Buyers can shop confidently with full visibility.',
  },
  {
    icon: Truck,
    title: 'Platform Logistics',
    description: 'Buyers browse by location to see what can be delivered nearby, while farmers list produce with clear availability and status.',
  },
  {
    icon: Star,
    title: 'Ratings & Reviews',
    description: 'See genuine reviews from other buyers. Rate your experience to help the community make informed decisions.',
  },
];

const faqs = [
  {
    question: 'What happens if my order arrives damaged?',
    answer: 'If your produce arrives damaged or doesn\'t match what was ordered, you can raise a dispute before confirming delivery. Our team will investigate and ensure you\'re treated fairly—whether that means a refund, replacement, or partial compensation.',
  },
  {
    question: 'How long do deliveries take?',
    answer: 'Delivery times vary by location. Orders within Abuja typically arrive within 24 hours. For Kaduna, Bauchi, and Kano, expect 1-3 business days depending on the farmer\'s location.',
  },
  {
    question: 'When do farmers get paid?',
    answer: 'Farmers receive payment only after you confirm delivery. The funds are held securely in escrow from the moment you pay until you verify you\'ve received your order.',
  },
  {
    question: 'Can I cancel an order?',
    answer: 'You can cancel an order before the farmer marks it as "processing." Once the farmer begins preparing your order, cancellation may not be possible. Contact support for assistance.',
  },
];

const HowItWorks = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center gap-2 mb-6">
            <BackButton fallbackPath="/" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              How AgroTrust Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A trusted produce marketplace for buyers and farmers. Learn how listings, delivery, and protected payments work together.
            </p>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <HowItWorksSection />

      {/* Escrow Explainer */}
      <EscrowExplainer />

      {/* Features */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose AgroTrust</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're not just another marketplace. We're infrastructure for fair agricultural trade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

      {/* FAQs */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-sm text-primary font-medium mb-4">
              <HelpCircle className="h-4 w-4" />
              FAQs
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Common Questions</h2>
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

      {/* CTA */}
      <section className="py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Start Buying or Listing?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Shop fresh produce or join as a farmer to create listings and grow your reach.
          </p>
          <Link to="/products">
            <Button size="lg">Browse Products</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
