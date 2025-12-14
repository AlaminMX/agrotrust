import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText,
  MapPin,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';

type FarmerProfile = Tables<'farmer_profiles'>;

export default function FarmerVerifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

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

      await fetchFarmers();
      setLoading(false);
    };

    if (!authLoading) {
      checkAdminAndFetch();
    }
  }, [user, authLoading, navigate]);

  const fetchFarmers = async () => {
    const { data, error } = await supabase
      .from('farmer_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch farmers');
      return;
    }

    setFarmers(data || []);
  };

  const handleViewDetails = (farmer: FarmerProfile) => {
    setSelectedFarmer(farmer);
    setVerificationNotes(farmer.verification_notes || '');
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (
    farmerId: string,
    status: 'approved' | 'rejected' | 'under_review'
  ) => {
    setProcessingId(farmerId);

    const updateData: Partial<FarmerProfile> = {
      verification_status: status,
      verification_notes: verificationNotes,
    };

    if (status === 'approved') {
      updateData.verified_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('farmer_profiles')
      .update(updateData)
      .eq('id', farmerId);

    if (error) {
      toast.error('Failed to update verification status');
      setProcessingId(null);
      return;
    }

    // If approving, also add farmer role
    if (status === 'approved' && selectedFarmer) {
      await supabase.from('user_roles').upsert({
        user_id: selectedFarmer.user_id,
        role: 'farmer',
      }, { onConflict: 'user_id,role' });
    }

    toast.success(`Farmer ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'marked for review'}`);
    setIsDialogOpen(false);
    setProcessingId(null);
    await fetchFarmers();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      under_review: { variant: 'outline', label: 'Under Review' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const { variant, label } = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredFarmers = farmers.filter((farmer) => {
    if (activeTab === 'pending') {
      return farmer.verification_status === 'pending' || farmer.verification_status === 'under_review';
    }
    return farmer.verification_status === activeTab;
  });

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
          <h1 className="text-3xl font-bold text-foreground">Farmer Verifications</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve farmer applications
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">
              Pending ({farmers.filter(f => f.verification_status === 'pending' || f.verification_status === 'under_review').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({farmers.filter(f => f.verification_status === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({farmers.filter(f => f.verification_status === 'rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Farm Name</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFarmers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No farmers in this category
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFarmers.map((farmer) => (
                        <TableRow key={farmer.id}>
                          <TableCell className="font-medium">{farmer.farm_name}</TableCell>
                          <TableCell className="capitalize">{farmer.state}</TableCell>
                          <TableCell>{format(new Date(farmer.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{getStatusBadge(farmer.verification_status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(farmer)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Farmer Application Details</DialogTitle>
            </DialogHeader>

            {selectedFarmer && (
              <div className="space-y-6">
                {/* Farm Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Farm Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {selectedFarmer.farm_name}</p>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{selectedFarmer.state}</span>
                      </p>
                      <p><span className="text-muted-foreground">Size:</span> {selectedFarmer.farm_size || 'Not specified'}</p>
                      <p><span className="text-muted-foreground">Address:</span> {selectedFarmer.address || 'Not specified'}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Application Info</h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Applied: {format(new Date(selectedFarmer.created_at), 'PPP')}
                      </p>
                      <p><span className="text-muted-foreground">Status:</span> {getStatusBadge(selectedFarmer.verification_status)}</p>
                      {selectedFarmer.verified_at && (
                        <p><span className="text-muted-foreground">Verified:</span> {format(new Date(selectedFarmer.verified_at), 'PPP')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedFarmer.farm_description && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Farm Description</h3>
                    <p className="text-sm text-muted-foreground">{selectedFarmer.farm_description}</p>
                  </div>
                )}

                {/* Produce Types */}
                {selectedFarmer.produce_types && selectedFarmer.produce_types.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Produce Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedFarmer.produce_types.map((type) => (
                        <Badge key={type} variant="secondary">{type}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Verification Documents</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFarmer.id_document_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedFarmer.id_document_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-1" />
                          ID Document
                        </a>
                      </Button>
                    )}
                    {selectedFarmer.farm_registration_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedFarmer.farm_registration_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-1" />
                          Farm Registration
                        </a>
                      </Button>
                    )}
                    {selectedFarmer.certification_urls?.map((url, i) => (
                      <Button key={i} variant="outline" size="sm" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-1" />
                          Certificate {i + 1}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Bank Details */}
                {selectedFarmer.bank_name && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Bank Details</h3>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Bank:</span> {selectedFarmer.bank_name}</p>
                      <p><span className="text-muted-foreground">Account Name:</span> {selectedFarmer.bank_account_name}</p>
                      <p><span className="text-muted-foreground">Account Number:</span> {selectedFarmer.bank_account_number}</p>
                    </div>
                  </div>
                )}

                {/* Verification Notes */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Verification Notes</h3>
                  <Textarea
                    placeholder="Add notes about this application..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:gap-0">
              {selectedFarmer?.verification_status !== 'approved' && (
                <Button
                  onClick={() => handleUpdateStatus(selectedFarmer!.id, 'approved')}
                  disabled={processingId === selectedFarmer?.id}
                  className="gap-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
              )}
              {selectedFarmer?.verification_status === 'pending' && (
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedFarmer!.id, 'under_review')}
                  disabled={processingId === selectedFarmer?.id}
                >
                  Mark Under Review
                </Button>
              )}
              {selectedFarmer?.verification_status !== 'rejected' && (
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatus(selectedFarmer!.id, 'rejected')}
                  disabled={processingId === selectedFarmer?.id}
                  className="gap-1"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
