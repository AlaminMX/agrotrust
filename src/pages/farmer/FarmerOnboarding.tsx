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
import { Loader2, Upload, CheckCircle2, ArrowRight, ArrowLeft, Leaf, Building2 } from 'lucide-react';
import { STATES, CATEGORIES } from '@/types';

type Step = 'details' | 'bank' | 'documents' | 'review';

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '063', name: 'Diamond Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '084', name: 'Enterprise Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Parallex Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '999991', name: 'Opay' },
  { code: '999992', name: 'Palmpay' },
  { code: '999993', name: 'Moniepoint' },
];

export default function FarmerOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  
  // Form state
  const [farmName, setFarmName] = useState('');
  const [farmDescription, setFarmDescription] = useState('');
  const [state, setState] = useState('');
  const [areaId, setAreaId] = useState('');
  const [areas, setAreas] = useState<Array<{ id: string; area_name: string }>>([]);
  const [address, setAddress] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [produceTypes, setProduceTypes] = useState<string[]>([]);
  
  // Bank details
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankVerified, setBankVerified] = useState(false);
  
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
      ensureFarmerRole();
    }
  }, [user]);

  const ensureFarmerRole = async () => {
    if (!user) return;
    
    // Check if user already has farmer role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'farmer')
      .maybeSingle();
    
    // Add farmer role if not already present (needed for bank verification during onboarding)
    if (!existingRole) {
      await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'farmer' });
    }
  };

  // Load areas when state is Abuja
  useEffect(() => {
    if (state === 'abuja') {
      loadAreas();
    } else {
      setAreas([]);
      setAreaId('');
    }
  }, [state]);

  const loadAreas = async () => {
    const { data } = await supabase
      .from('delivery_areas')
      .select('id, area_name')
      .eq('state', 'abuja')
      .eq('is_active', true)
      .order('area_name');
    
    if (data) {
      setAreas(data);
    }
  };

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
    
    // Return file path instead of public URL for private bucket
    // Signed URLs will be generated on-demand when viewing documents
    return fileName;
  };

  const verifyBankAccount = async () => {
    if (!bankCode || !accountNumber || accountNumber.length !== 10) {
      toast({
        title: 'Invalid Details',
        description: 'Please enter a valid bank and 10-digit account number',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifyingBank(true);
    setAccountName('');
    setBankVerified(false);

    try {
      const { data, error } = await supabase.functions.invoke('verify-bank-account', {
        body: { accountNumber, bankCode },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Could not verify account');
      }

      // Set the account name from Paystack verification
      setAccountName(data.accountName);
      setBankVerified(true);
      
      toast({
        title: 'Account Verified!',
        description: `Account holder: ${data.accountName}`,
      });
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Could not verify bank account. Please check your details.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingBank(false);
    }
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
          id_document_url: idDocUrl,
          farm_registration_url: farmRegUrl,
          verification_status: 'pending',
          bank_name: NIGERIAN_BANKS.find(b => b.code === bankCode)?.name || null,
          bank_account_number: accountNumber || null,
          bank_account_name: accountName || null,
        });
      
      if (error) throw error;

      // Create transfer recipient with Paystack if bank details provided
      if (bankCode && accountNumber && accountName) {
        try {
          const { data, error: recipientError } = await supabase.functions.invoke('create-transfer-recipient', {
            body: { bankCode, accountNumber, accountName },
          });

          if (recipientError) {
            console.error('Failed to create transfer recipient:', recipientError);
          } else {
            console.log('Transfer recipient created successfully');
          }
        } catch (err) {
          console.error('Error creating transfer recipient:', err);
        }
      }
      
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
            <Button variant="outline" onClick={() => navigate('/home')}>
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
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`flex items-center gap-2 ${step === 'details' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 'details' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="hidden sm:inline text-sm">Details</span>
            </div>
            <div className="w-6 sm:w-12 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step === 'bank' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 'bank' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="hidden sm:inline text-sm">Bank</span>
            </div>
            <div className="w-6 sm:w-12 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step === 'documents' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 'documents' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="hidden sm:inline text-sm">Documents</span>
            </div>
            <div className="w-6 sm:w-12 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${step === 'review' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline text-sm">Done</span>
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
                      <SelectContent className="bg-background border z-50">
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
                      <SelectContent className="bg-background border z-50">
                        <SelectItem value="small">Small (&lt; 1 hectare)</SelectItem>
                        <SelectItem value="medium">Medium (1-5 hectares)</SelectItem>
                        <SelectItem value="large">Large (5-20 hectares)</SelectItem>
                        <SelectItem value="xlarge">Extra Large (&gt; 20 hectares)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Area selection for Abuja */}
                {state === 'abuja' && areas.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="area">Delivery Area *</Label>
                    <Select value={areaId} onValueChange={setAreaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your area" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border z-50 max-h-60">
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.area_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">This helps calculate accurate delivery fees</p>
                  </div>
                )}
                
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
                    onClick={() => setStep('bank')}
                    disabled={!farmName || !state || !address || produceTypes.length === 0 || (state === 'abuja' && !areaId)}
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
                  <Button variant="outline" onClick={() => setStep('bank')}>
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
                <Button onClick={() => navigate('/home')}>
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
