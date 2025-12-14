import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Leaf, Package, Truck, CheckCircle, MapPin, Phone, Mail } from 'lucide-react';
import { formatNaira, formatDate } from '@/lib/format';

const STATUS_FLOW = [
  { status: 'paid', label: 'Paid', next: 'processing' },
  { status: 'processing', label: 'Processing', next: 'dispatched' },
  { status: 'dispatched', label: 'Dispatched', next: 'out_for_delivery' },
  { status: 'out_for_delivery', label: 'Out for Delivery', next: 'delivered' },
  { status: 'delivered', label: 'Delivered', next: null },
];

export default function FarmerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      loadOrder();
    }
  }, [user, id]);

  const loadOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), order_tracking(*)')
      .eq('id', id)
      .single();
    
    if (!data) {
      navigate('/farmer/dashboard');
      return;
    }
    
    setOrder(data);
    setLoading(false);
  };

  const updateOrderStatus = async (newStatus: string) => {
    setUpdating(true);
    
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus as any,
          ...(newStatus === 'delivered' ? { delivered_at: new Date().toISOString() } : {})
        })
        .eq('id', id);
      
      if (orderError) throw orderError;
      
      // Add tracking event
      const { error: trackingError } = await supabase
        .from('order_tracking')
        .insert([{
          order_id: id!,
          status: newStatus as any,
          description: getStatusDescription(newStatus),
        }]);
      
      if (trackingError) throw trackingError;
      
      toast({
        title: 'Status Updated',
        description: `Order status changed to ${newStatus.replace('_', ' ')}`,
      });
      
      loadOrder();
      
    } catch (error: any) {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Order is being prepared by the farmer';
      case 'dispatched':
        return 'Order has been handed over to logistics';
      case 'out_for_delivery':
        return 'Order is out for delivery to customer';
      case 'delivered':
        return 'Order has been delivered to customer';
      default:
        return `Order status updated to ${status}`;
    }
  };

  const currentStatusIndex = STATUS_FLOW.findIndex(s => s.status === order?.status);
  const nextStatus = STATUS_FLOW[currentStatusIndex]?.next;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/farmer/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">Order #{order?.order_number}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Order Status Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>
                  Placed on {formatDate(order?.created_at)}
                </CardDescription>
              </div>
              <Badge variant={
                order?.status === 'delivered' ? 'default' :
                order?.status === 'disputed' ? 'destructive' : 'secondary'
              }>
                {order?.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Status Timeline */}
            <div className="flex items-center justify-between mb-6">
              {STATUS_FLOW.slice(0, 5).map((step, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                  <div key={step.status} className="flex flex-col items-center flex-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                      {index === 0 && <Package className="h-4 w-4" />}
                      {index === 1 && <Package className="h-4 w-4" />}
                      {index === 2 && <Truck className="h-4 w-4" />}
                      {index === 3 && <Truck className="h-4 w-4" />}
                      {index === 4 && <CheckCircle className="h-4 w-4" />}
                    </div>
                    <span className="text-xs text-center">{step.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Update Status Button */}
            {nextStatus && order?.status !== 'confirmed' && order?.status !== 'disputed' && (
              <Button 
                onClick={() => updateOrderStatus(nextStatus)}
                disabled={updating}
                className="w-full"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  `Mark as ${nextStatus.replace('_', ' ')}`
                )}
              </Button>
            )}

            {order?.status === 'delivered' && !order?.escrow_released && (
              <p className="text-sm text-center text-muted-foreground mt-4">
                Waiting for customer confirmation to release payment
              </p>
            )}

            {order?.escrow_released && (
              <div className="flex items-center justify-center gap-2 text-green-600 mt-4">
                <CheckCircle className="h-5 w-5" />
                <span>Payment released</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-sm font-medium">
                  {order?.consumer_name?.charAt(0) || 'C'}
                </span>
              </div>
              <span className="font-medium">{order?.consumer_name || 'Customer'}</span>
            </div>
            
            {order?.consumer_phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{order.consumer_phone}</span>
              </div>
            )}
            
            {order?.consumer_email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{order.consumer_email}</span>
              </div>
            )}
            
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5" />
              <span>{order?.delivery_address}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order?.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatNaira(item.unit_price)}
                  </p>
                </div>
                <p className="font-medium">{formatNaira(item.total_price)}</p>
              </div>
            ))}
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatNaira(order?.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>{formatNaira(order?.delivery_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatNaira(order?.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking History */}
        {order?.order_tracking?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tracking History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_tracking
                  .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((event: any) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="font-medium capitalize">{event.status.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(event.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
