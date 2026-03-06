import { Layout } from '@/components/layout/Layout';
import { BackButton } from '@/components/ui/BackButton';
import { Shield, Users, CheckCircle, HelpCircle, Flag, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Shield,
    title: 'Verified Farmers Only',
    description: 'Every farmer on AgroTrust goes through a multi-step verification process. We check farm documentation, verify identity, and approve profiles before they can list products.',
  },
  {
    icon: Users,
    title: 'Direct Connection',
    description: 'No middlemen. Buyers contact farmers directly via WhatsApp, phone call, or email. Negotiate prices, arrange delivery, and build direct relationships.',
  },
  {
    icon: Eye,
    title: 'Transparent Listings',
    description: 'Farmers manage their own listings with real photos, accurate pricing, and availability status. What you see is what the farmer offers.',
  },
  {
    icon: Flag,
    title: 'Report & Flag',
    description: 'See something suspicious? Report any listing or farmer profile. Our admin team reviews every report and takes action to keep the marketplace safe.',
  },
];

const faqs = [
  {
    question: 'How does farmer verification work?',
    answer: 'Farmers submit their farm details, location, and identification documents. Our admin team reviews each application, verifies the documents, and approves only legitimate farmers. Look for the green "Verified" badge on farmer profiles.',
  },
  {
    question: 'Is it safe to contact farmers directly?',
    answer: 'Yes. All farmers on AgroTrust are verified by our team. We recommend communicating via the WhatsApp or phone links on listings. Always arrange payment terms and delivery before sending money.',
  },
  {
    question: 'What if a farmer is unresponsive or dishonest?',
    answer: 'You can report any farmer or listing using the "Report" button on their profile or listing page. Our team will investigate and take action, including suspending or removing fraudulent accounts.',
  },
  {
    question: 'How do I know if a farmer is verified?',
    answer: 'Verified farmers display a green badge with a checkmark on their profile and product listings. Only admin-approved farmers receive this badge after document review.',
  },
  {
    question: 'Can I browse without creating an account?',
    answer: 'Yes! You can browse all listings and farmer profiles without signing up. An account is only needed if you want to save preferences or register as a farmer.',
  },
];

const TrustAndSafety = () => {
  return (
    <Layout>
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center gap-2 mb-6"><BackButton fallbackPath="/" /></div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Trust & Safety</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              How we verify farmers, protect buyers, and maintain a trustworthy marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* How Verification Works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">How Farmer Verification Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A rigorous process to ensure only legitimate farmers list products on AgroTrust.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Apply', desc: 'Farmer submits farm details, location, and produce types.' },
              { step: '2', title: 'Upload Documents', desc: 'ID verification and farm documentation are uploaded securely.' },
              { step: '3', title: 'Admin Review', desc: 'Our team reviews all documents and verifies the application.' },
              { step: '4', title: 'Verified Badge', desc: 'Approved farmers get the verified badge and can list products.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-3">{item.step}</div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose AgroTrust</h2>
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

      {/* Buyer Safety Tips */}
      <section className="py-20">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Buyer Safety Tips</h2>
          <div className="space-y-4">
            {[
              'Always check the "Verified Farmer" badge before contacting a seller.',
              'Use the WhatsApp or phone links on the listing to communicate directly.',
              'Agree on price, quantity, and delivery method before making any payment.',
              'Report any suspicious listing or farmer using the Report button.',
              'Don\'t share personal banking details unless you initiate the transaction.',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{tip}</p>
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
              <HelpCircle className="h-4 w-4" /> FAQs
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

      <section className="py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Explore?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Browse verified farmers and connect directly. No middlemen. No hidden fees.
          </p>
          <Link to="/products"><Button size="lg">Browse Listings</Button></Link>
        </div>
      </section>
    </Layout>
  );
};

export default TrustAndSafety;
