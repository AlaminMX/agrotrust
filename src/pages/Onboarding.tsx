import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { STATES, CATEGORIES, State, ProductCategory } from '@/types';
import { MapPin, ShoppingBag, Phone, ChevronRight, ChevronLeft, Leaf, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Welcome', icon: Leaf },
  { id: 2, title: 'Your Location', icon: MapPin },
  { id: 3, title: 'Interests', icon: ShoppingBag },
  { id: 4, title: 'Contact', icon: Phone },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleCategoryToggle = (category: ProductCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleComplete = async () => {
    if (!selectedState) {
      toast.error('Please select your state');
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_state: selectedState,
          produce_interests: selectedCategories,
          phone: phone || null,
          onboarding_completed: true,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Welcome to AgroTrust!');
      navigate(`/products?state=${selectedState}`);
    } catch (error: any) {
      toast.error('Failed to save preferences');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 2 && !selectedState) {
      toast.error('Please select your state to continue');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-muted/50 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all",
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-1 mx-2 rounded",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Step {currentStep} of 4: {STEPS[currentStep - 1].title}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-0 shadow-xl">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <>
              <CardHeader className="text-center space-y-4 pb-2">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Leaf className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Welcome to AgroTrust</CardTitle>
                <CardDescription className="text-base max-w-md mx-auto">
                  Nigeria's trusted farm-to-table marketplace. Buy fresh produce directly from verified local farmers with our secure escrow payment protection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl mb-2">🌾</div>
                    <h4 className="font-semibold">Fresh & Local</h4>
                    <p className="text-sm text-muted-foreground">Directly from farms in your state</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl mb-2">🔒</div>
                    <h4 className="font-semibold">Escrow Protected</h4>
                    <p className="text-sm text-muted-foreground">Payment held until you confirm delivery</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl mb-2">✓</div>
                    <h4 className="font-semibold">Verified Farmers</h4>
                    <p className="text-sm text-muted-foreground">All farmers are vetted & approved</p>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: State Selection */}
          {currentStep === 2 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Where are you located?</CardTitle>
                <CardDescription>
                  Select your state to see products available for delivery in your area
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {STATES.map(state => (
                    <button
                      key={state.value}
                      onClick={() => setSelectedState(state.value)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                        selectedState === state.value
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        selectedState === state.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{state.label}</h4>
                        <p className="text-sm text-muted-foreground">
                          {state.value === 'abuja' && 'FCT & Environs'}
                          {state.value === 'kaduna' && 'Kaduna State'}
                          {state.value === 'bauchi' && 'Bauchi State'}
                          {state.value === 'kano' && 'Kano State'}
                        </p>
                      </div>
                      {selectedState === state.value && (
                        <CheckCircle className="ml-auto h-6 w-6 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground text-center pt-2">
                  <strong>Note:</strong> Products you see are only available for delivery within your selected state.
                  You can change this later.
                </p>
              </CardContent>
            </>
          )}

          {/* Step 3: Category Interests */}
          {currentStep === 3 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">What produce interests you?</CardTitle>
                <CardDescription>
                  Select categories to personalize your experience (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {CATEGORIES.map(category => (
                    <button
                      key={category.value}
                      onClick={() => handleCategoryToggle(category.value)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                        selectedCategories.includes(category.value)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-medium">{category.label}</span>
                      {selectedCategories.includes(category.value) && (
                        <CheckCircle className="ml-auto h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Phone (Optional) */}
          {currentStep === 4 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Stay updated on your orders</CardTitle>
                <CardDescription>
                  Add your phone number for delivery notifications (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="max-w-sm mx-auto space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll only use this for order updates and delivery notifications.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-xl p-6 text-center space-y-3">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto" />
                  <h4 className="font-semibold text-lg">You're all set!</h4>
                  <p className="text-sm text-muted-foreground">
                    Click complete to start exploring fresh produce from verified farmers in{' '}
                    <strong>{STATES.find(s => s.value === selectedState)?.label}</strong>
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep} className="flex-1">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {currentStep < 4 ? (
              <Button onClick={nextStep} className="flex-1">
                Continue
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Saving...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
