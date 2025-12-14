import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock,
  ArrowLeft,
  Phone,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock order data
const mockOrder = {
  id: 'AGT-M1K2N3',
  status: 'out_for_delivery',
  createdAt: '2024-01-15T10:30:00',
  estimatedDelivery: '2024-01-16T14:00:00',
  deliveryAddress: '12 Ibrahim Taiwo Road, Kano',
  items: [
    { name: 'Fresh Tomatoes', quantity: 2, price: 2500 },
    { name: 'Free-Range Eggs', quantity: 1, price: 3000 },
  ],
  subtotal: 8000,
  deliveryFee: 2000,
  total: 10000,
  trackingEvents: [
    {
      status: 'paid',
      timestamp: '2024-01-15T10:30:00',
      description: 'Payment received and held in escrow',
      completed: true,
    },
    {
      status: 'processing',
      timestamp: '2024-01-15T11:45:00',
      description: 'Order confirmed by farmer, preparing produce',
      completed: true,
    },
    {
      status: 'dispatched',
      timestamp: '2024-01-15T16:00:00',
      description: 'Package picked up by delivery partner',
      completed: true,
    },
    {
      status: 'out_for_delivery',
      timestamp: '2024-01-16T09:00:00',
      description: 'Out for delivery to your location',
      completed: true,
    },
    {
      status: 'delivered',
      timestamp: '',
      description: 'Awaiting delivery confirmation',
      completed: false,
    },
  ],
};

const statusIcons = {
  paid: Check,
  processing: Package,
  dispatched: Truck,
  out_for_delivery: MapPin,
  delivered: CheckCircle2,
};

const OrderTracking = () => {
  const { orderId } = useParams<{ orderId: string }>();
  
  // In real app, fetch order by ID
  const order = mockOrder;

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

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
              <h1 className="text-3xl font-bold text-foreground">Order #{orderId || order.id}</h1>
              <p className="text-muted-foreground">Placed on {formatDateTime(order.createdAt)}</p>
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
              
              <div className="relative">
                {order.trackingEvents.map((event, index) => {
                  const Icon = statusIcons[event.status as keyof typeof statusIcons] || Clock;
                  const isLast = index === order.trackingEvents.length - 1;
                  
                  return (
                    <div key={event.status} className="flex gap-4 pb-8 last:pb-0">
                      {/* Timeline Line */}
                      {!isLast && (
                        <div 
                          className={cn(
                            "absolute left-[19px] w-0.5 h-[calc(100%-2rem)]",
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
              {order.status === 'out_for_delivery' && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="bg-primary/5 rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground">
                      Once you receive your order, click the button below to confirm delivery. 
                      This will release the payment to the farmer.
                    </p>
                  </div>
                  <Button size="lg" className="w-full">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Confirm Delivery Received
                  </Button>
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
                <p className="text-foreground">{order.deliveryAddress}</p>
              </div>

              {/* Estimated Delivery */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Estimated Delivery</h3>
                <p className="text-foreground font-medium">{formatDateTime(order.estimatedDelivery)}</p>
              </div>

              {/* Items */}
              <div className="space-y-3 py-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground">Items</h3>
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-foreground">₦{item.price.toLocaleString()}</span>
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
                  <span className="text-foreground">₦{order.deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-border">
                  <span className="text-foreground">Total (in escrow)</span>
                  <span className="text-foreground">₦{order.total.toLocaleString()}</span>
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
