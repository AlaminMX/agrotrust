import { Shield, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export const EscrowExplainer = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 text-sm text-primary font-medium mb-4">
              <Shield className="h-4 w-4" />
              Payment Protection
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Money is Safe with Escrow
            </h2>
            <p className="text-lg text-muted-foreground">
              We never release payment to farmers until you confirm you've received your order. 
              It's that simple.
            </p>
          </div>

          {/* Escrow Flow Diagram */}
          <div className="relative bg-muted/50 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
              {/* Step 1 */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">You Pay</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment goes into a secure escrow account, not directly to the farmer.
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground/50" />
              </div>

              {/* Step 2 (Mobile Arrow) */}
              <div className="md:hidden flex justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground/50 rotate-90" />
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-4 md:order-3">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-gold" />
                </div>
                <h3 className="font-semibold text-foreground">You Confirm</h3>
                <p className="text-sm text-muted-foreground">
                  Only when you confirm delivery, the payment is released to the farmer.
                </p>
              </div>
            </div>

            {/* Trust Message */}
            <div className="mt-10 pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">100% Protection:</strong> If there's an issue with your order, 
                you can raise a dispute and we'll help resolve it before any payment is released.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
