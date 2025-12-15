import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Check, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock,
  ArrowLeft,
  Phone,
  MessageSquare,
  Loader2,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  estimated_delivery: string | null;
  delivery_address: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  escrow_released: boolean;
  consumer_name: string | null;
  consumer_phone: string | null;
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  paid: CreditCard,
  processing: Package,
  dispatched: Truck,
  out_for_delivery: MapPin,
  delivered: CheckCircle2,
  confirmed: Check,
};

const statusOrder = ['pending', 'paid', 'processing', 'dispatched', 'out_for_delivery', 'delivered', 'confirmed'];

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      // Load order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Load order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Load tracking events
      const { data: trackingData, error: trackingError } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (trackingError) throw trackingError;
      setTrackingEvents(trackingData || []);

    } catch (error: any) {
      console.error('Error loading order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order) return;
    
    setConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke('release-escrow', {
        body: { orderId: order.id }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: 'Delivery Confirmed!',
        description: 'Payment has been released to the farmer. Thank you!',
      });

      // Reload order to show updated status
      loadOrder();

    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to confirm delivery',
        variant: 'destructive',
      });
    } finally {
      setConfirming(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  // Build timeline from tracking events
  const buildTimeline = () => {
    const timeline = statusOrder.map(status => {
      const event = trackingEvents.find(e => e.status === status);
      const currentStatusIndex = statusOrder.indexOf(order?.status || 'pending');
      const thisStatusIndex = statusOrder.indexOf(status);
      
      return {
        status,
        timestamp: event?.created_at || '',
        description: event?.description || getDefaultDescription(status),
        completed: thisStatusIndex <= currentStatusIndex,
      };
    });
    return timeline;
  };

  const getDefaultDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      pending: 'Order placed, awaiting payment',
      paid: 'Payment received and held in escrow',
      processing: 'Farmer preparing your order',
      dispatched: 'Package picked up by delivery partner',
      out_for_delivery: 'Out for delivery to your location',
      delivered: 'Package delivered',
      confirmed: 'Delivery confirmed, payment released',
    };
    return descriptions[status] || 'Status update';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const timeline = buildTimeline();
  const canConfirmDelivery = ['out_for_delivery', 'delivered'].includes(order.status) && !order.escrow_released;

  return (
    <Layout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Order #{order.order_number}</h1>
              <p className="text-muted-foreground">Placed on {formatDateTime(order.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Raise Issue
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Order Progress</h2>
              
              {/* Status Badge */}
              <div className="mb-6">
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
                  order.escrow_released 
                    ? "bg-primary/10 text-primary" 
                    : "bg-accent/10 text-accent-foreground"
                )}>
                  {order.escrow_released ? '✓ Payment Released' : `₦${order.total_amount.toLocaleString()} in Escrow`}
                </span>
              </div>
              
              <div className="relative">
                {timeline.map((event, index) => {
                  const Icon = statusIcons[event.status] || Clock;
                  const isLast = index === timeline.length - 1;
                  
                  return (
                    <div key={event.status} className="flex gap-4 pb-8 last:pb-0">
                      {/* Timeline Line */}
                      {!isLast && (
                        <div 
                          className={cn(
                            "absolute left-[19px] w-0.5",
                            event.completed ? "bg-primary" : "bg-border"
                          )}
                          style={{ top: `${index * 80 + 40}px`, height: '48px' }}
                        />
                      )}
                      
                      {/* Icon */}
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          event.completed 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <h3 className={cn(
                            "font-medium capitalize",
                            event.completed ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {event.status.replace(/_/g, ' ')}
                          </h3>
                          {event.timestamp && (
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(event.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          "text-sm mt-1",
                          event.completed ? "text-muted-foreground" : "text-muted-foreground/60"
                        )}>
                          {event.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirm Delivery Button */}
              {canConfirmDelivery && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="bg-primary/5 rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground">
                      Once you receive your order, click the button below to confirm delivery. 
                      This will release the payment (₦{order.subtotal.toLocaleString()}) to the farmer.
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={handleConfirmDelivery}
                    disabled={confirming}
                  >
                    {confirming ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Confirm Delivery Received
                      </>
                    )}
                  </Button>
                </div>
              )}

              {order.escrow_released && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="bg-primary/10 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Delivery Confirmed</p>
                      <p className="text-sm text-muted-foreground">
                        Payment has been released to the farmer. Thank you for your order!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">Order Details</h2>

              {/* Delivery Address */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Delivery Address</h3>
                <p className="text-foreground">{order.delivery_address}</p>
              </div>

              {/* Estimated Delivery */}
              {order.estimated_delivery && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Estimated Delivery</h3>
                  <p className="text-foreground font-medium">{formatDateTime(order.estimated_delivery)}</p>
                </div>
              )}

              {/* Items */}
              <div className="space-y-3 py-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground">Items</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {item.product_name} × {item.quantity}
                    </span>
                    <span className="text-foreground">₦{item.total_price.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 py-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₦{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-foreground">₦{order.delivery_fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-border">
                  <span className="text-foreground">
                    Total {!order.escrow_released && '(in escrow)'}
                  </span>
                  <span className="text-foreground">₦{order.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderTracking;
