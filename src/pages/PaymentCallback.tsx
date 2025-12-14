import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/context/CartContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      
      if (!reference) {
        setStatus('failed');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('paystack-verify', {
          body: { reference },
        });

        if (error || !data.success) {
          setStatus('failed');
          return;
        }

        setOrderId(data.order_id);
        setStatus('success');
        clearCart();
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [searchParams, clearCart]);

  return (
    <Layout>
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Verifying Payment</h1>
              <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground mb-6">
                Your funds are now held securely in escrow. They will be released to the farmer once you confirm delivery.
              </p>
              <Button onClick={() => navigate(`/order/${orderId}`)}>
                Track Your Order
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h1>
              <p className="text-muted-foreground mb-6">
                We couldn't verify your payment. Please try again or contact support.
              </p>
              <Button onClick={() => navigate('/cart')}>
                Return to Cart
              </Button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PaymentCallback;
