import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertTriangle, 
  Eye, 
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Store,
  MapPin
} from 'lucide-react';
import { formatNaira } from '@/lib/format';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'> & {
  farmer_profiles: { farm_name: string } | null;
};
type OrderItem = Tables<'order_items'>;

export default function DisputeResolution() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Order[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Order | null>(null);
  const [disputeItems, setDisputeItems] = useState<OrderItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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

      await fetchDisputes();
      setLoading(false);
    };

    if (!authLoading) {
      checkAdminAndFetch();
    }
  }, [user, authLoading, navigate]);

  const fetchDisputes = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, farmer_profiles (farm_name)`)
      .eq('status', 'disputed')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch disputes');
      return;
    }

    setDisputes(data || []);
  };

  const handleViewDispute = async (dispute: Order) => {
    setSelectedDispute(dispute);
    setResolution('');

    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', dispute.id);

    setDisputeItems(data || []);
    setIsDialogOpen(true);
  };

  const handleResolve = async (outcome: 'refund' | 'release' | 'partial') => {
    if (!selectedDispute) return;

    setProcessing(true);

    let newStatus: 'confirmed' | 'pending' = 'confirmed';
    let escrowReleased = false;
    let description = '';

    switch (outcome) {
      case 'refund':
        newStatus = 'pending';
        description = `Dispute resolved: Full refund to customer. ${resolution}`;
        break;
      case 'release':
        newStatus = 'confirmed';
        escrowReleased = true;
        description = `Dispute resolved: Payment released to farmer. ${resolution}`;
        break;
      case 'partial':
        newStatus = 'confirmed';
        escrowReleased = true;
        description = `Dispute resolved: Partial resolution. ${resolution}`;
        break;
    }

    const updateData: Partial<Tables<'orders'>> = {
      status: newStatus,
      escrow_released: escrowReleased,
    };

    if (escrowReleased) {
      updateData.escrow_released_at = new Date().toISOString();
      updateData.confirmed_at = new Date().toISOString();
    }

    const { error: orderError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', selectedDispute.id);

    if (orderError) {
      toast.error('Failed to resolve dispute');
      setProcessing(false);
      return;
    }

    // Add tracking event
    await supabase.from('order_tracking').insert({
      order_id: selectedDispute.id,
      status: newStatus,
      description,
    });

    toast.success('Dispute resolved successfully');
    setIsDialogOpen(false);
    setProcessing(false);
    await fetchDisputes();
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

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            Dispute Resolution
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and resolve customer disputes
          </p>
        </div>

        {disputes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Disputes</h3>
              <p className="text-muted-foreground">
                All disputes have been resolved. Great job!
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Active Disputes ({disputes.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Disputed On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-mono text-sm">
                        {dispute.order_number}
                      </TableCell>
                      <TableCell>{dispute.consumer_name || 'N/A'}</TableCell>
                      <TableCell>{dispute.farmer_profiles?.farm_name || 'N/A'}</TableCell>
                      <TableCell>{formatNaira(Number(dispute.total_amount))}</TableCell>
                      <TableCell>{format(new Date(dispute.updated_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDispute(dispute)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Dispute Resolution Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Dispute Resolution
              </DialogTitle>
              <DialogDescription>
                Order #{selectedDispute?.order_number}
              </DialogDescription>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer
                    </h3>
                    <div className="text-sm space-y-1">
                      <p>{selectedDispute.consumer_name}</p>
                      <p className="text-muted-foreground">{selectedDispute.consumer_email}</p>
                      <p className="text-muted-foreground">{selectedDispute.consumer_phone}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Farmer
                    </h3>
                    <div className="text-sm">
                      <p>{selectedDispute.farmer_profiles?.farm_name}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedDispute.delivery_address}</p>
                  <p className="text-sm text-muted-foreground capitalize">{selectedDispute.delivery_state}</p>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Order Items</h3>
                  <div className="space-y-2">
                    {disputeItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-2 border-b">
                        <div>
                          <span>{item.product_name}</span>
                          <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                        </div>
                        <span>{formatNaira(Number(item.total_price))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold pt-2">
                      <span>Total</span>
                      <span>{formatNaira(Number(selectedDispute.total_amount))}</span>
                    </div>
                  </div>
                </div>

                {/* Escrow Status */}
                <div className="p-4 rounded-lg bg-muted">
                  <h3 className="font-semibold text-foreground mb-2">Escrow Status</h3>
                  <Badge variant={selectedDispute.escrow_released ? 'default' : 'secondary'}>
                    {selectedDispute.escrow_released ? 'Released' : 'Held in Escrow'}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedDispute.escrow_released
                      ? 'Funds have already been released to the farmer.'
                      : 'Funds are currently held securely and have not been released.'}
                  </p>
                </div>

                {/* Resolution Notes */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Resolution Notes</h3>
                  <Textarea
                    placeholder="Document the resolution decision and reasoning..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="destructive"
                onClick={() => handleResolve('refund')}
                disabled={processing || selectedDispute?.escrow_released}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                Full Refund
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResolve('partial')}
                disabled={processing}
                className="gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Partial Resolution
              </Button>
              <Button
                onClick={() => handleResolve('release')}
                disabled={processing || selectedDispute?.escrow_released}
                className="gap-1"
              >
                <CheckCircle className="h-4 w-4" />
                Release to Farmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
