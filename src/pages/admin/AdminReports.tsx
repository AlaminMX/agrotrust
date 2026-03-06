import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReports() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Array<{ id: string; reason: string; details: string | null; status: string; product_id: string }>>([]);

  const loadReports = async () => {
    const { data, error } = await supabase.from('listing_reports').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to fetch reports');
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => {
    const boot = async () => {
      if (!user) return navigate('/auth');
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (!data) return navigate('/');
      loadReports();
    };
    if (!authLoading) boot();
  }, [user, authLoading, navigate]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('listing_reports').update({ status }).eq('id', id);
    if (error) return toast.error('Failed to update status');
    toast.success('Status updated');
    loadReports();
  };

  if (loading || authLoading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-6"><Link to="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link><h1 className="text-2xl font-bold">Reports Inbox</h1></div>
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center justify-between"><span>{report.reason}</span><Badge>{report.status}</Badge></CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{report.details || 'No details provided'}</p>
                <div className="flex gap-3 items-center">
                  <span className="text-xs text-muted-foreground">Reported product: {report.product_id}</span>
                  <Select value={report.status} onValueChange={(status) => updateStatus(report.id, status)}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No reports found.</CardContent></Card>}
        </div>
      </div>
    </Layout>
  );
}
