import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BadgeCheck, TrendingUp, Wallet, Users } from 'lucide-react';

export const BecomeFarmerCTA = () => {
  return (
    <section className="py-12 bg-gradient-to-br from-primary via-primary/90 to-primary-foreground/10">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="text-primary-foreground space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
              <BadgeCheck className="h-4 w-4" />
              Join 500+ Verified Farmers
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Sell Your Fresh Produce on AgroTrust
            </h2>
            
            <p className="text-lg text-primary-foreground/90">
              Reach thousands of buyers across Nigeria. Get verified, list your products, and receive automatic payments when orders are delivered.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Direct Access</p>
                  <p className="text-sm text-primary-foreground/80">Sell to consumers directly</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Auto Payouts</p>
                  <p className="text-sm text-primary-foreground/80">90% goes to you</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Grow Sales</p>
                  <p className="text-sm text-primary-foreground/80">Platform handles logistics</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 font-semibold"
                asChild
              >
                <Link to="/farmer/onboarding">
                  <BadgeCheck className="h-5 w-5 mr-2" />
                  Become a Verified Farmer
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/40 text-primary-foreground hover:bg-white/10"
                asChild
              >
                <Link to="/how-it-works">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="w-72 h-72 rounded-full bg-white/10 flex items-center justify-center">
                <div className="w-56 h-56 rounded-full bg-white/15 flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <p className="text-6xl mb-2">🌾</p>
                    <p className="text-xl font-bold">Your Farm</p>
                    <p className="text-sm text-primary-foreground/80">Verified & Trusted</p>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute top-4 right-0 bg-white rounded-lg px-3 py-2 shadow-lg">
                <p className="text-xs text-muted-foreground">Daily Sales</p>
                <p className="text-lg font-bold text-primary">₦250K+</p>
              </div>
              <div className="absolute bottom-8 left-0 bg-white rounded-lg px-3 py-2 shadow-lg">
                <p className="text-xs text-muted-foreground">Avg. Rating</p>
                <p className="text-lg font-bold text-orange">⭐ 4.8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
