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
import { Loader2, CheckCircle2, ArrowRight, ArrowLeft, Leaf } from 'lucide-react';
import { STATES, CATEGORIES } from '@/types';

type Step = 'details' | 'documents' | 'review';

export default function FarmerOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<{ verification_status?: string } | null>(null);

  const [farmName, setFarmName] = useState('');
  const [farmDescription, setFarmDescription] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [produceTypes, setProduceTypes] = useState<string[]>([]);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [contactVisibilityConsent, setContactVisibilityConsent] = useState(false);
  
  // Bank details
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  
  // Document state
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    checkExistingProfile();
    ensureFarmerRole();
  }, [user]);

  const ensureFarmerRole = async () => {
    if (!user) return;
    const { data } = await supabase.from('user_roles').select('id').eq('user_id', user.id).eq('role', 'farmer').maybeSingle();
    if (!data) {
      await supabase.from('user_roles').insert({ user_id: user.id, role: 'farmer' });
    }
  };

  const checkExistingProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('farmer_profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (data?.verification_status === 'approved') {
      navigate('/farmer/dashboard');
      return;
    }
    setExistingProfile(data);
  };

  const uploadDocument = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `${user!.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('farmer-documents').upload(key, file, { upsert: true });
    if (error) throw error;
    return key;
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!farmName || !state || !address || !whatsappPhone || !contactVisibilityConsent) {
      toast({ title: 'Missing required fields', description: 'Complete required profile fields and consent.', variant: 'destructive' });
      setStep('details');
      return;
    }

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
      
      // Create farmer profile with bank details
      const { error } = await supabase
        .from('farmer_profiles')
        .insert({
          user_id: user.id,
          farm_name: farmName,
          farm_description: farmDescription,
          state: state,
          area_id: areaId || null,
          address: address,
          farm_size: farmSize,
          produce_types: produceTypes,
          whatsapp_phone: whatsappPhone || null,
          id_document_url: idDocUrl,
          farm_registration_url: farmRegUrl,
          verification_status: 'pending',
          bank_name: NIGERIAN_BANKS.find(b => b.code === bankCode)?.name || null,
          bank_account_number: accountNumber || null,
          bank_account_name: accountName || null,
        });
      
      if (error) throw error;

      if (error) throw error;

      toast({ title: 'Application submitted', description: 'Your verification is now in review.' });
      setStep('review');
      checkExistingProfile();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({ title: 'Submission failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (existingProfile?.verification_status === 'pending' || existingProfile?.verification_status === 'under_review') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Application Under Review</CardTitle>
            <CardDescription>Your farmer profile is being reviewed by admins.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate('/home')}>Return Home</Button>
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
          <p className="text-muted-foreground">Create your profile and submit documents for verification.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'details' && 'Farm Details'}
              {step === 'documents' && 'Verification Documents'}
              {step === 'review' && 'Submitted'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'details' && (
              <>
                <div className="space-y-2"><Label>Farm Name *</Label><Input value={farmName} onChange={(e) => setFarmName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={farmDescription} onChange={(e) => setFarmDescription(e.target.value)} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>State *</Label><Select value={state} onValueChange={setState}><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger><SelectContent>{STATES.filter(s=>s.value!=='all').map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Farm Size</Label><Input value={farmSize} onChange={(e) => setFarmSize(e.target.value)} placeholder="e.g. 2 hectares" /></div>
                </div>
                <div className="space-y-2"><Label>Address *</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                <div className="space-y-2"><Label>WhatsApp Phone *</Label><Input value={whatsappPhone} onChange={(e) => setWhatsappPhone(e.target.value)} /></div>
                <div className="space-y-2"><Label>Secondary Phone</Label><Input value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} /></div>
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
                
                <div className="space-y-2">
                  <Label htmlFor="whatsappPhone">WhatsApp Phone *</Label>
                  <Input
                    id="whatsappPhone"
                    placeholder="e.g., 08012345678"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Used for order updates and quick communication.</p>
                </div>

                <div className="space-y-3">
                  <Label>What do you produce? *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                      <label key={cat.value} className="flex items-center gap-2 text-sm"><Checkbox checked={produceTypes.includes(cat.value)} onCheckedChange={(checked) => setProduceTypes(prev => checked ? [...prev, cat.value] : prev.filter(v => v !== cat.value))} />{cat.label}</label>
                    ))}
                  </div>
                </div>

                <div className="flex items-start space-x-2 rounded-lg border p-3">
                  <Checkbox
                    id="contact-visibility"
                    checked={contactVisibilityConsent}
                    onCheckedChange={(checked) => setContactVisibilityConsent(Boolean(checked))}
                  />
                  <label htmlFor="contact-visibility" className="text-sm cursor-pointer">
                    I understand my contact details (WhatsApp/phone) will be publicly visible on my listings so buyers can contact me directly.
                  </label>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => setStep('bank')}
                    disabled={!farmName || !state || !address || !whatsappPhone || produceTypes.length === 0 || (state === 'abuja' && !areaId)}
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 'bank' && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Bank Details
                </CardTitle>
                <CardDescription>Add your bank account to receive payments (90% of sales)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Commission Structure:</strong> AgroTrust takes a 10% platform fee. 
                    You receive 90% of each sale directly to your bank account after delivery confirmation.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank">Bank *</Label>
                  <Select value={bankCode} onValueChange={setBankCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accountNumber"
                      placeholder="10-digit account number"
                      value={accountNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setAccountNumber(val);
                        setBankVerified(false);
                        setAccountName('');
                      }}
                      maxLength={10}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={verifyBankAccount}
                      disabled={isVerifyingBank || !bankCode || accountNumber.length !== 10}
                    >
                      {isVerifyingBank ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your account number and click Verify to auto-fill account name
                  </p>
                </div>

                {accountName && (
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      value={accountName}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                )}

                {bankVerified && (
                  <div className="flex items-center gap-2 text-primary bg-primary/10 p-3 rounded-lg">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Account verified: {accountName}</span>
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep('details')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    onClick={() => setStep('documents')}
                    disabled={!bankVerified}
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 'review' && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-muted-foreground">Your profile has been submitted. We will notify you after review.</p>
                <Button className="mt-4" onClick={() => navigate('/home')}>Go Home</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
