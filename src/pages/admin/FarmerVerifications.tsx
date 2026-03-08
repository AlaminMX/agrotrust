import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Eye, FileText, MapPin, Calendar, Loader2, Trash2, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatLocation } from '@/lib/location';

export default function FarmerVerifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState<any[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) return navigate('/auth');
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (!roleData) return navigate('/');
      await fetchFarmers();
      setLoading(false);
    };
    if (!authLoading) init();
  }, [user, authLoading, navigate]);

  const fetchFarmers = async () => {
    const { data } = await supabase.from('farmer_profiles').select('*').order('created_at', { ascending: false });
    setFarmers(data || []);
  };

  const getSignedUrl = useCallback(async (filePath: string | null): Promise<string | null> => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    const { data } = await supabase.storage.from('farmer-documents').createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  }, []);

  const loadDocumentUrls = useCallback(async (farmer: any) => {
    setLoadingDocs(true);
    const urls: Record<string, string> = {};
    if (farmer.id_document_url) { const u = await getSignedUrl(farmer.id_document_url); if (u) urls.id_document = u; }
    if (farmer.farm_registration_url) { const u = await getSignedUrl(farmer.farm_registration_url); if (u) urls.farm_registration = u; }
    if (farmer.certification_urls) {
      for (let i = 0; i < farmer.certification_urls.length; i++) { const u = await getSignedUrl(farmer.certification_urls[i]); if (u) urls[`cert_${i}`] = u; }
    }
    setDocumentUrls(urls);
    setLoadingDocs(false);
  }, [getSignedUrl]);

  const handleViewDetails = async (farmer: any) => {
    setSelectedFarmer(farmer); setVerificationNotes(farmer.verification_notes || '');
    setIsDialogOpen(true); await loadDocumentUrls(farmer);
  };

  const handleUpdateStatus = async (farmerId: string, status: 'approved' | 'rejected' | 'under_review') => {
    setProcessingId(farmerId);
    const updateData: any = { verification_status: status, verification_notes: verificationNotes };
    if (status === 'approved') updateData.verified_at = new Date().toISOString();
    const { error } = await supabase.from('farmer_profiles').update(updateData).eq('id', farmerId);
    if (error) { toast.error('Failed to update status'); setProcessingId(null); return; }
    if (status === 'approved' && selectedFarmer) {
      await supabase.from('user_roles').upsert({ user_id: selectedFarmer.user_id, role: 'farmer' }, { onConflict: 'user_id,role' });
    }
    try { await supabase.functions.invoke('send-farmer-verification-email', { body: { farmerId, status, farmName: selectedFarmer?.farm_name, verificationNotes } }); } catch {}
    toast.success(`Farmer ${status}`);
    setIsDialogOpen(false); setProcessingId(null); await fetchFarmers();
  };

  const handleDeleteFarmer = async (farmerId: string, userId: string) => {
    if (!confirm('Remove this farmer?')) return;
    setProcessingId(farmerId);
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'farmer');
      await supabase.from('farmer_profiles').delete().eq('id', farmerId);
      toast.success('Farmer removed'); setIsDialogOpen(false); await fetchFarmers();
    } catch (e: any) { toast.error(e.message); }
    setProcessingId(null);
  };

  const getStatusBadge = (status: string) => {
    const v: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' }, under_review: { variant: 'outline', label: 'Under Review' },
      approved: { variant: 'default', label: 'Approved' }, rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const { variant, label } = v[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredFarmers = farmers.filter(f => activeTab === 'pending' ? f.verification_status === 'pending' || f.verification_status === 'under_review' : f.verification_status === activeTab);

  if (authLoading || loading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8"><h1 className="text-3xl font-bold text-foreground">Farmer Verifications</h1><p className="text-muted-foreground mt-1">Review and approve farmer applications</p></div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending ({farmers.filter(f => f.verification_status === 'pending' || f.verification_status === 'under_review').length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({farmers.filter(f => f.verification_status === 'approved').length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({farmers.filter(f => f.verification_status === 'rejected').length})</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Farm Name</TableHead><TableHead>State</TableHead><TableHead>Applied</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredFarmers.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No farmers</TableCell></TableRow> : filteredFarmers.map(farmer => (
                    <TableRow key={farmer.id}>
                      <TableCell className="font-medium">{farmer.farm_name}</TableCell>
                      <TableCell className="capitalize">{farmer.state}</TableCell>
                      <TableCell>{format(new Date(farmer.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(farmer.verification_status)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleViewDetails(farmer)}><Eye className="h-4 w-4 mr-1" />View</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Farmer Application Details</DialogTitle></DialogHeader>
            {selectedFarmer && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div><h3 className="font-semibold mb-2">Farm Details</h3><div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedFarmer.farm_name}</p>
                    <p className="flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" />{formatLocation(selectedFarmer.state, selectedFarmer.area)}</p>
                    <p><span className="text-muted-foreground">Size:</span> {selectedFarmer.farm_size || 'N/A'}</p>
                    <p><span className="text-muted-foreground">Address:</span> {selectedFarmer.address || 'N/A'}</p>
                    {selectedFarmer.whatsapp_phone && <p><span className="text-muted-foreground">WhatsApp:</span> {selectedFarmer.whatsapp_phone}</p>}
                  </div></div>
                  <div><h3 className="font-semibold mb-2">Application Info</h3><div className="space-y-2 text-sm">
                    <p className="flex items-center gap-1"><Calendar className="h-4 w-4 text-muted-foreground" />Applied: {format(new Date(selectedFarmer.created_at), 'PPP')}</p>
                    <p>{getStatusBadge(selectedFarmer.verification_status)}</p>
                  </div></div>
                </div>

                {selectedFarmer.farm_description && <div><h3 className="font-semibold mb-2">Description</h3><p className="text-sm text-muted-foreground">{selectedFarmer.farm_description}</p></div>}
                {selectedFarmer.produce_types?.length > 0 && <div><h3 className="font-semibold mb-2">Produce Types</h3><div className="flex flex-wrap gap-2">{selectedFarmer.produce_types.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}</div></div>}

                <div><h3 className="font-semibold mb-2">Documents</h3>
                  {loadingDocs ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading...</div> : (
                    <div className="flex flex-wrap gap-2">
                      {documentUrls.id_document && <Button variant="outline" size="sm" asChild><a href={documentUrls.id_document} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4 mr-1" />ID Document</a></Button>}
                      {documentUrls.farm_registration && <Button variant="outline" size="sm" asChild><a href={documentUrls.farm_registration} target="_blank" rel="noopener noreferrer"><FileText className="h-4 w-4 mr-1" />Farm Registration</a></Button>}
                      {!documentUrls.id_document && !documentUrls.farm_registration && <p className="text-sm text-muted-foreground">No documents uploaded</p>}
                    </div>
                  )}
                </div>

                <div><h3 className="font-semibold mb-2">Verification Notes</h3><Textarea value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} placeholder="Add notes..." rows={3} /></div>
              </div>
            )}
            <DialogFooter className="flex flex-wrap gap-2">
              {selectedFarmer?.verification_status !== 'approved' && <Button onClick={() => handleUpdateStatus(selectedFarmer!.id, 'approved')} disabled={!!processingId} className="gap-1"><CheckCircle className="h-4 w-4" />Approve</Button>}
              {selectedFarmer?.verification_status === 'pending' && <Button variant="outline" onClick={() => handleUpdateStatus(selectedFarmer!.id, 'under_review')} disabled={!!processingId}>Mark Under Review</Button>}
              {selectedFarmer?.verification_status !== 'rejected' && <Button variant="destructive" onClick={() => handleUpdateStatus(selectedFarmer!.id, 'rejected')} disabled={!!processingId} className="gap-1"><XCircle className="h-4 w-4" />Reject</Button>}
              {selectedFarmer?.verification_status === 'approved' && (
                <Button variant="destructive" onClick={() => handleDeleteFarmer(selectedFarmer!.id, selectedFarmer!.user_id)} disabled={!!processingId} className="gap-1"><Trash2 className="h-4 w-4" />Delete</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
