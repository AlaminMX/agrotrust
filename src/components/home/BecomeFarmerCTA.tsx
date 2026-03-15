import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const BecomeFarmerCTA = () => {
  return (
    <section className="py-10 md:py-16">
      <div className="container">
        <div className="rounded-2xl gradient-hero p-6 md:p-12 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs md:text-sm font-medium mb-4 md:mb-6">
            <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
            For Farmers
          </div>
          <h2 className="text-xl md:text-3xl font-bold text-primary-foreground mb-3 md:mb-4 leading-tight">
            List Your Produce on AgroTrust
          </h2>
          <p className="text-primary-foreground/85 mb-6 md:mb-8 max-w-xl mx-auto text-sm md:text-base">
            Get verified, list your produce, and connect directly with buyers across Nigeria. It's free to join.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 md:gap-3">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold w-full sm:w-auto text-sm md:text-base" asChild>
              <Link to="/farmer/onboarding">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Become a Verified Farmer
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 w-full sm:w-auto text-sm md:text-base" asChild>
              <Link to="/trust-and-safety">
                Learn More <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
