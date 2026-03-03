import { Shield, Users, CheckCircle2 } from 'lucide-react';

export const EscrowExplainer = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-sm text-primary font-medium mb-4">
              <Shield className="h-4 w-4" />
              Trust & Transparency
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Connect Directly with Verified Farmers
            </h2>
            <p className="text-lg text-muted-foreground">
              No middlemen. No hidden fees. Just verified farmers and fresh produce at fair prices.
            </p>
          </div>

          <div className="relative bg-muted/50 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Browse Listings</h3>
                <p className="text-sm text-muted-foreground">Discover fresh produce from verified farmers across Nigeria.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Verified Trust</h3>
                <p className="text-sm text-muted-foreground">Every farmer goes through ID verification and admin approval.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-gold" />
                </div>
                <h3 className="font-semibold text-foreground">Contact Directly</h3>
                <p className="text-sm text-muted-foreground">Reach farmers via WhatsApp or phone to negotiate and buy directly.</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">100% Transparent:</strong> Connect directly with verified farmers. No middlemen. No hidden fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
