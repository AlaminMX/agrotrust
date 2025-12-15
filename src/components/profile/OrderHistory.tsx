import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPrice } from '@/lib/format';
import { Package, ChevronRight, Star, Search, Filter, XCircle, AlertTriangle, Truck, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import { ComplaintDialog } from '@/components/profile/ComplaintDialog';
import { CancelOrderDialog } from '@/components/profile/CancelOrderDialog';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_state: string;
  escrow_released: boolean;
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

const statusLabels: Record<string, string> = {
  pending: 'Pending Payment',
  paid: 'Payment Received',
  processing: 'Being Prepared',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  confirmed: 'Completed',
  disputed: 'Under Review',
};

export function OrderHistory({ userId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set());
  const [complainingOrder, setComplainingOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
          escrow_released,
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
  const canCancel = (order: Order) => ['pending', 'paid'].includes(order.status);
  const canComplain = (order: Order) => ['delivered', 'out_for_delivery', 'dispatched'].includes(order.status) && !order.escrow_released;
  const canTrack = (order: Order) => !['pending', 'confirmed', 'disputed'].includes(order.status);

  const hasReviewedProduct = (orderId: string, productId: string) => {
    return reviewedProducts.has(`${orderId}-${productId}`);
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items.some(item => item.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders by number or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="confirmed">Completed</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchOrders} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'confirmed').length}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{orders.filter(o => ['processing', 'dispatched', 'out_for_delivery'].includes(o.status)).length}</p>
          <p className="text-xs text-muted-foreground">In Transit</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No orders match your search</p>
          </CardContent>
        </Card>
      ) : (
        filteredOrders.map((order) => (
        <Card key={order.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">Order #{order.order_number}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.created_at), 'PPP')} • {order.delivery_state}
                </p>
              </div>
              <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                {statusLabels[order.status] || order.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {order.order_items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="flex-1 truncate">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {formatPrice(item.unit_price * item.quantity)}
                  </span>
                  {canReview(order) && !hasReviewedProduct(order.id, item.product_id || '') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      onClick={() => setReviewingOrder(order)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Review
                    </Button>
                  )}
                  {hasReviewedProduct(order.id, item.product_id || '') && (
                    <Badge variant="outline" className="text-xs shrink-0">Reviewed</Badge>
                  )}
                </div>
              ))}
              {order.order_items.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{order.order_items.length - 3} more items
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t gap-2 flex-wrap">
              <div className="font-semibold">
                Total: {formatPrice(order.total_amount)}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {canCancel(order) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => setCancellingOrder(order)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}
                {canComplain(order) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setComplainingOrder(order)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Report Issue
                  </Button>
                )}
                {canTrack(order) && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/order/${order.id}`}>
                      <Truck className="h-4 w-4 mr-1" />
                      Track
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/order/${order.id}`}>
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        ))
      )}

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

      {complainingOrder && (
        <ComplaintDialog
          orderId={complainingOrder.id}
          orderNumber={complainingOrder.order_number}
          open={!!complainingOrder}
          onOpenChange={(open) => !open && setComplainingOrder(null)}
          onComplaintFiled={fetchOrders}
        />
      )}

      {cancellingOrder && (
        <CancelOrderDialog
          orderId={cancellingOrder.id}
          orderNumber={cancellingOrder.order_number}
          open={!!cancellingOrder}
          onOpenChange={(open) => !open && setCancellingOrder(null)}
          onOrderCancelled={fetchOrders}
        />
      )}
    </div>
  );
}
