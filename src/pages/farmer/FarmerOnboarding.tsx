import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, CheckCircle2, ArrowRight, ArrowLeft, Leaf } from 'lucide-react';
import { STATES, CATEGORIES } from '@/types';

type Step = 'details' | 'documents' | 'review';

export default function FarmerOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  
  // Form state
  const [farmName, setFarmName] = useState('');
  const [farmDescription, setFarmDescription] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [produceTypes, setProduceTypes] = useState<string[]>([]);
  
  // Document state
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [farmRegistration, setFarmRegistration] = useState<File | null>(null);
  
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkExistingProfile();
    }
  }, [user]);

  const checkExistingProfile = async () => {
    const { data } = await supabase
      .from('farmer_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    
    if (data) {
      setExistingProfile(data);
      if (data.verification_status === 'approved') {
        navigate('/farmer/dashboard');
      }
    }
  };

  const handleProduceTypeChange = (category: string, checked: boolean) => {
    if (checked) {
      setProduceTypes([...produceTypes, category]);
    } else {
      setProduceTypes(produceTypes.filter(t => t !== category));
    }
  };

  const uploadDocument = async (file: File, type: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${type}-${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('farmer-documents')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('farmer-documents')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      let idDocUrl = null;
      let farmRegUrl = null;
      
      if (idDocument) {
        idDocUrl = await uploadDocument(idDocument, 'id-document');
      }
      
      if (farmRegistration) {
        farmRegUrl = await uploadDocument(farmRegistration, 'farm-registration');
      }
      
      // Add farmer role
      await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'farmer' });
      
      // Create farmer profile
      const { error } = await supabase
        .from('farmer_profiles')
        .insert({
          user_id: user.id,
          farm_name: farmName,
          farm_description: farmDescription,
          state: state,
          address: address,
          farm_size: farmSize,
          produce_types: produceTypes,
          id_document_url: idDocUrl,
          farm_registration_url: farmRegUrl,
          verification_status: 'pending',
        });
      
      if (error) throw error;
      
      toast({
        title: 'Application Submitted!',
        description: 'Your farmer application is under review. We\'ll notify you once approved.',
      });
      
      setStep('review');
      checkExistingProfile();
      
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (existingProfile?.verification_status === 'pending' || existingProfile?.verification_status === 'under_review') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
            <CardTitle>Application Under Review</CardTitle>
            <CardDescription>
              Your farmer application is being reviewed by our team. This usually takes 1-2 business days.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              We'll notify you via email once your application is approved.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Become a Farmer</span>
          </div>
          <p className="text-muted-foreground">Join AgroTrust and reach customers across Nigeria</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'details' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 'details' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="hidden sm:inline">Farm Details</span>
            </div>
            <div className="w-12 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step === 'documents' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 'documents' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="hidden sm:inline">Documents</span>
            </div>
            <div className="w-12 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline">Review</span>
            </div>
          </div>
        </div>

        <Card>
          {step === 'details' && (
            <>
              <CardHeader>
                <CardTitle>Farm Details</CardTitle>
                <CardDescription>Tell us about your farm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="farmName">Farm Name *</Label>
                  <Input
                    id="farmName"
                    placeholder="e.g., Green Valley Farm"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="farmDescription">Farm Description</Label>
                  <Textarea
                    id="farmDescription"
                    placeholder="Tell customers about your farm, farming practices, etc."
                    value={farmDescription}
                    onChange={(e) => setFarmDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="farmSize">Farm Size</Label>
                    <Select value={farmSize} onValueChange={setFarmSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small (&lt; 1 hectare)</SelectItem>
                        <SelectItem value="medium">Medium (1-5 hectares)</SelectItem>
                        <SelectItem value="large">Large (5-20 hectares)</SelectItem>
                        <SelectItem value="xlarge">Extra Large (&gt; 20 hectares)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Farm Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Full farm address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>What do you produce? *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                      <div key={cat.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={cat.value}
                          checked={produceTypes.includes(cat.value)}
                          onCheckedChange={(checked) => handleProduceTypeChange(cat.value, checked as boolean)}
                        />
                        <label htmlFor={cat.value} className="text-sm cursor-pointer">
                          {cat.icon} {cat.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setStep('documents')}
                    disabled={!farmName || !state || !address || produceTypes.length === 0}
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 'documents' && (
            <>
              <CardHeader>
                <CardTitle>Verification Documents</CardTitle>
                <CardDescription>Upload documents to verify your identity and farm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Government ID (NIN, Voter's Card, or Driver's License) *</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {idDocument ? (
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>{idDocument.name}</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="h-8 w-8 mx-auto mb-2" />
                        <p>Upload your ID document</p>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      className="mt-4"
                      onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Farm Registration Document (Optional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {farmRegistration ? (
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>{farmRegistration.name}</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="h-8 w-8 mx-auto mb-2" />
                        <p>Upload farm registration (if available)</p>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      className="mt-4"
                      onChange={(e) => setFarmRegistration(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep('details')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!idDocument || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 'review' && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Application Submitted!</CardTitle>
                <CardDescription>
                  Your application is now under review
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Our team will review your documents and verify your farm. This usually takes 1-2 business days.
                  You'll receive an email notification once approved.
                </p>
                <Button onClick={() => navigate('/')}>
                  Return Home
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
