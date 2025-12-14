import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId.trim()) {
      toast({
        title: "Order ID required",
        description: "Please enter your order ID to track your order",
        variant: "destructive",
      });
      return;
    }

    navigate(`/order/${orderId.trim().toUpperCase()}`);
  };

  return (
    <Layout>
      <div className="container py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Track Your Order</h1>
          <p className="text-muted-foreground mb-8">
            Enter your order ID to see the current status and tracking information
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., AGT-M1K2N3"
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Track Order
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6">
            Your order ID was sent to your email after checkout
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default TrackOrder;
