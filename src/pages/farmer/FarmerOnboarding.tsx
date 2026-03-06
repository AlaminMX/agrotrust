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
  
  const [farmName, setFarmName] = useState('');
  const [farmDescription, setFarmDescription] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [produceTypes, setProduceTypes] = useState<string[]>([]);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [contactVisibilityConsent, setContactVisibilityConsent] = useState(false);
  
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [farmRegistration, setFarmRegistration] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) { checkExistingProfile(); ensureFarmerRole(); }
  }, [user]);

  const ensureFarmerRole = async () => {
    if (!user) return;
    const { data: existingRole } = await supabase.from('user_roles').select('id').eq('user_id', user.id).eq('role', 'farmer').maybeSingle();
    if (!existingRole) await supabase.from('user_roles').insert({ user_id: user.id, role: 'farmer' });
  };

  const checkExistingProfile = async () => {
    const { data } = await supabase.from('farmer_profiles').select('*').eq('user_id', user!.id).maybeSingle();
    if (data) {
      setExistingProfile(data);
      if (data.verification_status === 'approved') navigate('/farmer/dashboard');
    }
  };

  const handleProduceTypeChange = (category: string, checked: boolean) => {
    if (checked) setProduceTypes([...produceTypes, category]);
    else setProduceTypes(produceTypes.filter(t => t !== category));
  };

  const uploadDocument = async (file: File, type: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${type}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('farmer-documents').upload(fileName, file);
    if (error) throw error;
    return fileName;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      let idDocUrl = null;
      let farmRegUrl = null;
      if (idDocument) idDocUrl = await uploadDocument(idDocument, 'id-document');
      if (farmRegistration) farmRegUrl = await uploadDocument(farmRegistration, 'farm-registration');
      
      const { error } = await supabase.from('farmer_profiles').insert({
        user_id: user.id,
        farm_name: farmName,
        farm_description: farmDescription,
        state, address,
        farm_size: farmSize,
        produce_types: produceTypes,
        whatsapp_phone: whatsappPhone || null,
        secondary_phone: secondaryPhone || null,
        years_of_experience: yearsExperience ? parseInt(yearsExperience) : null,
        id_document_url: idDocUrl,
        farm_registration_url: farmRegUrl,
        verification_status: 'pending',
      });
      if (error) throw error;
      toast({ title: 'Application Submitted!', description: 'Your farmer application is under review.' });
      setStep('review');
      checkExistingProfile();
    } catch (error: any) {
      toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (existingProfile?.verification_status === 'pending' || existingProfile?.verification_status === 'under_review') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
            <CardTitle>Application Under Review</CardTitle>
            <CardDescription>Your farmer application is being reviewed. This usually takes 1-2 business days.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4"><Leaf className="h-8 w-8 text-primary" /><span className="text-2xl font-bold text-primary">Become a Farmer</span></div>
          <p className="text-muted-foreground">Join AgroTrust and connect directly with buyers across Nigeria</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            {(['details', 'documents', 'review'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${step === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {step === 'review' && s !== 'review' ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </div>
                <span className="hidden sm:inline text-sm capitalize">{s}</span>
                {i < 2 && <div className="w-6 sm:w-12 h-0.5 bg-muted" />}
              </div>
            ))}
          </div>
        </div>

        <Card>
          {step === 'details' && (
            <>
              <CardHeader><CardTitle>Farm Details</CardTitle><CardDescription>Tell us about your farm</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Farm Name *</Label><Input value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="e.g., Green Valley Farm" required /></div>
                <div className="space-y-2"><Label>Farm Description</Label><Textarea value={farmDescription} onChange={(e) => setFarmDescription(e.target.value)} placeholder="Tell buyers about your farm..." rows={3} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        {STATES.filter(s => s.value !== 'all').map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Farm Size</Label>
                    <Select value={farmSize} onValueChange={setFarmSize}>
                      <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="small">Small (&lt; 1 hectare)</SelectItem>
                        <SelectItem value="medium">Medium (1-5 hectares)</SelectItem>
                        <SelectItem value="large">Large (5-20 hectares)</SelectItem>
                        <SelectItem value="xlarge">Extra Large (&gt; 20 hectares)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Farm Address *</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} required /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>WhatsApp Phone *</Label><Input value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} placeholder="+234..." /></div>
                  <div className="space-y-2"><Label>Secondary Phone</Label><Input value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} placeholder="+234..." /></div>
                </div>
                <div className="space-y-2"><Label>Years of Experience</Label><Input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="e.g., 5" /></div>
                <div className="space-y-2">
                  <Label>Main Produce Types *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <div key={cat.value} className="flex items-center gap-2">
                        <Checkbox id={cat.value} checked={produceTypes.includes(cat.value)} onCheckedChange={(checked) => handleProduceTypeChange(cat.value, !!checked)} />
                        <Label htmlFor={cat.value} className="text-sm cursor-pointer">{cat.icon} {cat.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-2">
                  <Checkbox id="consent" checked={contactVisibilityConsent} onCheckedChange={(c) => setContactVisibilityConsent(!!c)} />
                  <Label htmlFor="consent" className="text-sm cursor-pointer">I agree that my WhatsApp and phone number will be visible to buyers on my profile</Label>
                </div>
                <Button onClick={() => { if (!farmName || !state || !address || !whatsappPhone || !contactVisibilityConsent) { toast({ title: 'Missing Fields', description: 'Please fill in all required fields', variant: 'destructive' }); return; } setStep('documents'); }} className="w-full">
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </>
          )}

          {step === 'documents' && (
            <>
              <CardHeader><CardTitle>Upload Documents</CardTitle><CardDescription>Upload your ID and farm documents for verification</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>ID Document (NIN, Passport, Voter's Card) *</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {idDocument ? (
                      <div className="flex items-center justify-center gap-2 text-primary"><CheckCircle2 className="h-5 w-5" /><span>{idDocument.name}</span></div>
                    ) : (
                      <div className="text-muted-foreground"><Upload className="h-8 w-8 mx-auto mb-2" /><p>Upload your ID document</p></div>
                    )}
                    <Input type="file" accept="image/*,.pdf" className="mt-4" onChange={(e) => setIdDocument(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Farm Registration (optional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {farmRegistration ? (
                      <div className="flex items-center justify-center gap-2 text-primary"><CheckCircle2 className="h-5 w-5" /><span>{farmRegistration.name}</span></div>
                    ) : (
                      <div className="text-muted-foreground"><Upload className="h-8 w-8 mx-auto mb-2" /><p>Upload farm registration (if available)</p></div>
                    )}
                    <Input type="file" accept="image/*,.pdf" className="mt-4" onChange={(e) => setFarmRegistration(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('details')}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting || !idDocument} className="flex-1">
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Application'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 'review' && (
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground mb-6">Our team will review your application within 1-2 business days.</p>
              <Button onClick={() => navigate('/')}>Return Home</Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
