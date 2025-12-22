import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Search, Wallet, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface Payout {
  id: string;
  amount: number;
  platform_fee: number | null;
  farmer_payout: number | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  payout_reference: string | null;
  order_id: string | null;
  farmer_profiles: {
    farm_name: string;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    paystack_recipient_code: string | null;
  };
}

export default function AdminPayouts() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select(`
          *,
          farmer_profiles (
            farm_name,
            bank_name,
            bank_account_number,
            bank_account_name,
            paystack_recipient_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts(data || []);
    } catch (error: any) {
      console.error('Error loading payouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payouts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const processPayout = async (payoutId: string) => {
    setProcessingId(payoutId);
    try {
      // Generate a payout reference
      const reference = `PAY-${Date.now()}`;
      
      const { error } = await supabase
        .from('payouts')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString(),
          payout_reference: reference,
        })
        .eq('id', payoutId);

      if (error) throw error;

      // Update farmer's earnings
      const payout = payouts.find(p => p.id === payoutId);
      if (payout) {
        // Get farmer's current earnings
        const { data: farmerData } = await supabase
          .from('farmer_profiles')
          .select('pending_payout, total_earnings')
          .eq('farm_name', payout.farmer_profiles.farm_name)
          .single();

        if (farmerData) {
          await supabase
            .from('farmer_profiles')
            .update({
              pending_payout: Math.max(0, (farmerData.pending_payout || 0) - payout.amount),
              total_earnings: (farmerData.total_earnings || 0) + payout.amount,
            })
            .eq('farm_name', payout.farmer_profiles.farm_name);
        }
      }

      setPayouts(payouts.map(p => 
        p.id === payoutId 
          ? { ...p, status: 'completed', processed_at: new Date().toISOString(), payout_reference: reference }
          : p
      ));

      toast({
        title: 'Payout Processed',
        description: `Payout marked as completed with reference: ${reference}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const awaitingPayoutOrders = payouts.filter(p => p.status === 'awaiting_payout');
  const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'processing');
  const completedPayouts = payouts.filter(p => p.status === 'completed');
  const totalPending = pendingPayouts.reduce((sum, p) => sum + (p.farmer_payout || p.amount), 0);
  const totalAwaitingPayout = awaitingPayoutOrders.reduce((sum, p) => sum + (p.farmer_payout || p.amount), 0);
  const totalPlatformFees = completedPayouts.reduce((sum, p) => sum + (p.platform_fee || 0), 0);

  const filteredPayouts = payouts.filter(payout =>
    payout.farmer_profiles?.farm_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.payout_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">Payouts</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950">
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-700 dark:text-amber-300">Awaiting Payout</CardDescription>
              <CardTitle className="text-2xl text-amber-700 dark:text-amber-300">{formatPrice(totalAwaitingPayout)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-600 dark:text-amber-400">{awaitingPayoutOrders.length} orders ready</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Payouts</CardDescription>
              <CardTitle className="text-2xl">{formatPrice(totalPending)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{pendingPayouts.length} payouts waiting</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Platform Fees Earned</CardDescription>
              <CardTitle className="text-2xl text-primary">{formatPrice(totalPlatformFees)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">10% commission</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed Payouts</CardDescription>
              <CardTitle className="text-2xl">{completedPayouts.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Transfers completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Payouts</CardDescription>
              <CardTitle className="text-2xl">{payouts.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Payout Management</CardTitle>
                <CardDescription>Process farmer payouts after delivery confirmation</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payouts..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farm</TableHead>
                    <TableHead>Order Total</TableHead>
                    <TableHead>Platform Fee (10%)</TableHead>
                    <TableHead>Farmer Payout (90%)</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <p className="font-medium">{payout.farmer_profiles?.farm_name}</p>
                        {payout.farmer_profiles?.paystack_recipient_code && (
                          <span className="text-xs text-green-600">Auto-transfer enabled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-muted-foreground">{formatPrice(payout.amount)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-primary font-medium">{formatPrice(payout.platform_fee || payout.amount * 0.1)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-green-600">{formatPrice(payout.farmer_payout || payout.amount * 0.9)}</p>
                      </TableCell>
                      <TableCell>
                        {payout.farmer_profiles?.bank_name ? (
                          <div className="text-sm">
                            <p>{payout.farmer_profiles.bank_name}</p>
                            <p className="text-muted-foreground">{payout.farmer_profiles.bank_account_number}</p>
                            <p className="text-muted-foreground">{payout.farmer_profiles.bank_account_name}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No bank details</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p>{formatDate(payout.created_at)}</p>
                        {payout.processed_at && (
                          <p className="text-xs text-muted-foreground">
                            Processed: {formatDate(payout.processed_at)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'}>
                          {payout.status}
                        </Badge>
                        {payout.payout_reference && (
                          <p className="text-xs text-muted-foreground mt-1">{payout.payout_reference}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {payout.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => processPayout(payout.id)}
                            disabled={processingId === payout.id}
                          >
                            {processingId === payout.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Mark Paid
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredPayouts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No payouts found
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
