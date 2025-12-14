import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, MapPin, Phone, Mail, User, Store, Clock } from 'lucide-react';
import { formatNaira } from '@/lib/format';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Tables, Enums } from '@/integrations/supabase/types';

type Order = Tables<'orders'> & {
  farmer_profiles: { farm_name: string; state: string } | null;
};
type OrderItem = Tables<'order_items'>;
type OrderTracking = Tables<'order_tracking'>;

const ORDER_STATUSES: Enums<'order_status'>[] = [
  'pending',
  'paid',
  'processing',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'confirmed',
  'disputed',
];

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [tracking, setTracking] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        navigate('/');
        return;
      }

      await fetchOrderDetails();
      setLoading(false);
    };

    if (!authLoading && orderId) {
      checkAdminAndFetch();
    }
  }, [user, authLoading, orderId, navigate]);

  const fetchOrderDetails = async () => {
    const [orderRes, itemsRes, trackingRes] = await Promise.all([
      supabase
        .from('orders')
        .select(`*, farmer_profiles (farm_name, state)`)
        .eq('id', orderId!)
        .single(),
      supabase.from('order_items').select('*').eq('order_id', orderId!),
      supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId!)
        .order('created_at', { ascending: false }),
    ]);

    if (orderRes.error) {
      toast.error('Failed to load order');
      navigate('/admin/orders');
      return;
    }

    setOrder(orderRes.data);
    setItems(itemsRes.data || []);
    setTracking(trackingRes.data || []);
  };

  const handleStatusChange = async (newStatus: Enums<'order_status'>) => {
    if (!order) return;

    setUpdating(true);

    const updateData: Partial<Tables<'orders'>> = { status: newStatus };

    if (newStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }
    if (newStatus === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
      updateData.escrow_released = true;
      updateData.escrow_released_at = new Date().toISOString();
    }

    const { error: orderError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (orderError) {
      toast.error('Failed to update order status');
      setUpdating(false);
      return;
    }

    // Add tracking event
    await supabase.from('order_tracking').insert({
      order_id: order.id,
      status: newStatus,
      description: `Order status updated to ${newStatus.replace('_', ' ')} by admin`,
    });

    toast.success('Order status updated');
    await fetchOrderDetails();
    setUpdating(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      pending: { variant: 'secondary' },
      paid: { variant: 'outline', className: 'border-blue-500 text-blue-600' },
      processing: { variant: 'outline', className: 'border-amber-500 text-amber-600' },
      dispatched: { variant: 'outline', className: 'border-purple-500 text-purple-600' },
      out_for_delivery: { variant: 'outline', className: 'border-indigo-500 text-indigo-600' },
      delivered: { variant: 'default' },
      confirmed: { variant: 'default', className: 'bg-primary' },
      disputed: { variant: 'destructive' },
    };
    const { variant, className } = variants[status] || { variant: 'secondary' };
    return (
      <Badge variant={variant} className={className}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Order not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Order Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Order #{order.order_number}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Placed {format(new Date(order.created_at), 'PPP p')}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </CardHeader>
              <CardContent>
                {/* Order Items */}
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNaira(Number(item.unit_price))} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">{formatNaira(Number(item.total_price))}</p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatNaira(Number(order.subtotal))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>{formatNaira(Number(order.delivery_fee))}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatNaira(Number(order.total_amount))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{order.consumer_name || 'N/A'}</span>
                </div>
                {order.consumer_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{order.consumer_email}</span>
                  </div>
                )}
                {order.consumer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.consumer_phone}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{order.delivery_address}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.delivery_state}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Farmer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Farmer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{order.farmer_profiles?.farm_name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {order.farmer_profiles?.state || 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Update Status</label>
                  <Select
                    value={order.status}
                    onValueChange={handleStatusChange}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {order.status === 'disputed' && (
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/admin/disputes`)}
                  >
                    Go to Dispute Resolution
                  </Button>
                )}

                <div className="text-sm space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escrow Released</span>
                    <span>{order.escrow_released ? 'Yes' : 'No'}</span>
                  </div>
                  {order.escrow_released_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Released At</span>
                      <span>{format(new Date(order.escrow_released_at), 'PPp')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tracking History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tracking.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tracking events yet</p>
                  ) : (
                    tracking.map((event, index) => (
                      <div key={event.id} className="relative pl-6">
                        <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-primary' : 'bg-muted'
                        }`} />
                        {index < tracking.length - 1 && (
                          <div className="absolute left-1.5 top-4 w-0.5 h-full -translate-x-1/2 bg-border" />
                        )}
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {event.status.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), 'PPp')}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
