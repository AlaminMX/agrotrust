import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Truck, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden gradient-hero py-20 lg:py-28">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur rounded-full px-4 py-2 text-sm text-primary-foreground/90">
            <Leaf className="h-4 w-4" />
            <span>Serving Abuja, Kaduna, Bauchi & Kano</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
            Fresh Produce, Directly from{' '}
            <span className="text-gold-light">Verified Farmers</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Skip the middlemen. Buy directly from trusted local farmers with secure escrow payments. 
            Your money is safe until you confirm delivery.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/products">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-accent-foreground font-semibold px-8">
                Browse Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                How It Works
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-primary-foreground/70">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gold" />
              <span className="text-sm font-medium">Escrow Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary-foreground">150+</span>
              <span className="text-sm font-medium">Verified Farmers</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-gold" />
              <span className="text-sm font-medium">Platform Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
