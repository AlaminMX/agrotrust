import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { BackButton } from '@/components/ui/BackButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Flag, CheckCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Report {
  id: string;
  product_id: string | null;
  farmer_profile_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

export default function AdminReports() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (!authLoading && user) fetchReports();
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('listing_reports')
      .select('*')
      .order('created_at', { ascending: false }) as { data: Report[] | null; error: any };

    if (error) { toast.error('Failed to load reports'); return; }
    setReports(data || []);
    setLoading(false);
  };

  const handleResolve = async (reportId: string) => {
    const { error } = await supabase
      .from('listing_reports')
      .update({ status: 'resolved', admin_notes: adminNotes, resolved_at: new Date().toISOString() } as any)
      .eq('id', reportId);

    if (error) { toast.error('Failed to resolve report'); return; }
    toast.success('Report resolved');
    setSelectedReport(null);
    fetchReports();
  };

  const filtered = reports.filter(r => activeTab === 'pending' ? r.status === 'pending' : r.status === 'resolved');

  if (authLoading || loading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8 flex items-center gap-3">
          <BackButton fallbackPath="/admin" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports Inbox</h1>
            <p className="text-muted-foreground">Review flagged listings and farmer profiles</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending ({reports.filter(r => r.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({reports.filter(r => r.status === 'resolved').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No reports</TableCell></TableRow>
                    ) : filtered.map(report => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant="outline">{report.product_id ? 'Product' : 'Farmer'}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{report.reason.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{format(new Date(report.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={report.status === 'pending' ? 'secondary' : 'default'}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedReport(report); setAdminNotes(report.admin_notes || ''); }}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Report Details</DialogTitle></DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div><strong>Type:</strong> {selectedReport.product_id ? 'Product' : 'Farmer'}</div>
                <div><strong>Reason:</strong> {selectedReport.reason.replace(/_/g, ' ')}</div>
                {selectedReport.details && <div><strong>Details:</strong> {selectedReport.details}</div>}
                <div><strong>Submitted:</strong> {format(new Date(selectedReport.created_at), 'PPP')}</div>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Admin notes..." rows={3} />
              </div>
            )}
            <DialogFooter>
              {selectedReport?.status === 'pending' && (
                <Button onClick={() => handleResolve(selectedReport.id)} className="gap-1">
                  <CheckCircle className="h-4 w-4" /> Mark Resolved
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
