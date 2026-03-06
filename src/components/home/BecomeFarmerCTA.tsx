import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BadgeCheck, TrendingUp, Users } from 'lucide-react';

export const BecomeFarmerCTA = () => {
  return (
    <section className="py-12 bg-gradient-to-br from-primary via-primary/90 to-primary-foreground/10">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="text-primary-foreground space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium"><BadgeCheck className="h-4 w-4" />Join Verified Farmers</div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">List Your Fresh Produce on AgroTrust</h2>
            <p className="text-lg text-primary-foreground/90">Get verified, list your produce, and connect directly with buyers across Nigeria.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20"><Users className="h-5 w-5" /></div><div><p className="font-semibold">Direct Access</p><p className="text-sm text-primary-foreground/80">Connect with buyers directly</p></div></div>
              <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20"><TrendingUp className="h-5 w-5" /></div><div><p className="font-semibold">Grow Sales</p><p className="text-sm text-primary-foreground/80">Reach more customers online</p></div></div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold" asChild><Link to="/farmer/onboarding"><BadgeCheck className="h-5 w-5 mr-2" />Become a Verified Farmer</Link></Button>
              <Button size="lg" variant="outline" className="border-white/40 text-primary-foreground hover:bg-white/10" asChild><Link to="/trust-and-safety">Learn More</Link></Button>
            </div>
          </div>
          <div className="hidden lg:flex justify-center">
            <div className="w-72 h-72 rounded-full bg-white/10 flex items-center justify-center">
              <div className="w-56 h-56 rounded-full bg-white/15 flex items-center justify-center">
                <div className="text-center text-primary-foreground"><p className="text-6xl mb-2">🌾</p><p className="text-xl font-bold">Your Farm</p><p className="text-sm text-primary-foreground/80">Verified & Trusted</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
