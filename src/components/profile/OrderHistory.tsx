import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import { Package, ChevronRight, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_state: string;
  order_items: {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
}

interface OrderHistoryProps {
  userId: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  dispatched: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  disputed: 'bg-red-100 text-red-800',
};

export function OrderHistory({ userId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
    fetchReviewedProducts();
  }, [userId]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          created_at,
          delivery_state,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('consumer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviewedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('product_id, order_id')
        .eq('user_id', userId);

      if (error) throw error;
      
      // Create a set of "orderId-productId" combinations
      const reviewed = new Set(data?.map(r => `${r.order_id}-${r.product_id}`) || []);
      setReviewedProducts(reviewed);
    } catch (error) {
      console.error('Error fetching reviewed products:', error);
    }
  };

  const canReview = (order: Order) => order.status === 'confirmed';

  const hasReviewedProduct = (orderId: string, productId: string) => {
    return reviewedProducts.has(`${orderId}-${productId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-lg mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-4">
            Start shopping to see your order history here
          </p>
          <Button asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Order #{order.order_number}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.created_at), 'PPP')}
                </p>
              </div>
              <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {order.order_items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="flex-1">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="text-muted-foreground">
                    {formatPrice(item.unit_price * item.quantity)}
                  </span>
                  {canReview(order) && !hasReviewedProduct(order.id, item.product_id || '') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-7 text-xs"
                      onClick={() => setReviewingOrder(order)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Review
                    </Button>
                  )}
                  {hasReviewedProduct(order.id, item.product_id || '') && (
                    <Badge variant="outline" className="ml-2 text-xs">Reviewed</Badge>
                  )}
                </div>
              ))}
              {order.order_items.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{order.order_items.length - 3} more items
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="font-semibold">
                Total: {formatPrice(order.total_amount)}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/order/${order.id}`}>
                  View Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {reviewingOrder && (
        <ReviewDialog
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onReviewSubmitted={() => {
            fetchReviewedProducts();
            setReviewingOrder(null);
          }}
        />
      )}
    </div>
  );
}
