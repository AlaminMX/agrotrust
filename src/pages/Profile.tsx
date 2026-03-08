import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/ui/BackButton';
import { toast } from 'sonner';
import { User, Settings, Phone, Mail, HelpCircle, LogOut } from 'lucide-react';
import { CATEGORIES, State, ProductCategory } from '@/types';
import { useStates } from '@/hooks/useStates';
import { cn } from '@/lib/utils';

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_state: string | null;
  produce_interests: string[] | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { states } = useStates();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredState, setPreferredState] = useState<State | null>(null);
  const [produceInterests, setProduceInterests] = useState<ProductCategory[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user?.id).maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setPreferredState((data.preferred_state as State) || null);
        setProduceInterests((data.produce_interests as ProductCategory[]) || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, phone: phone || null, preferred_state: preferredState, produce_interests: produceInterests }).eq('user_id', user?.id);
      if (error) throw error;
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryToggle = (category: ProductCategory) => {
    setProduceInterests((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  if (authLoading || isLoading) {
    return <Layout><div className="container py-8"><Skeleton className="h-8 w-48 mb-6" /><Skeleton className="h-[400px] w-full" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          <div className="flex items-center gap-4">
            <BackButton fallbackPath="/" />
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-8 w-8 text-primary" /></div>
            <div>
              <h1 className="text-2xl font-bold">{profile?.full_name || 'My Profile'}</h1>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="preferences" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="preferences" className="gap-2"><Settings className="h-4 w-4" /><span className="hidden sm:inline">Preferences</span></TabsTrigger>
            <TabsTrigger value="account" className="gap-2"><User className="h-4 w-4" /><span className="hidden sm:inline">Account</span></TabsTrigger>
            <TabsTrigger value="support" className="gap-2"><HelpCircle className="h-4 w-4" /><span className="hidden sm:inline">Help</span></TabsTrigger>
          </TabsList>

          <TabsContent value="preferences">
            <Card>
              <CardHeader><CardTitle>Browse Preferences</CardTitle><CardDescription>Customize your AgroTrust experience</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Preferred State</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{states.map((state) => <button key={state.value} onClick={() => setPreferredState(state.value as State)} className={cn('flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left', preferredState === state.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}><span>{state.label}</span></button>)}</div>
                </div>
                <div className="space-y-3">
                  <Label>Produce Interests</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{CATEGORIES.map((category) => <button key={category.value} onClick={() => handleCategoryToggle(category.value as ProductCategory)} className={cn('flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left', produceInterests.includes(category.value as ProductCategory) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}><span>{category.icon}</span><span>{category.label}</span></button>)}</div>
                </div>
                <Button onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Preferences'}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="fullName">Full Name</Label><Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="email">Email Address</Label><Input id="email" value={profile?.email || ''} disabled /><p className="text-xs text-muted-foreground">Email cannot be changed</p></div>
                <div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 08012345678" /></div>
                <Button onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader><CardTitle>Help & Support</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border"><Mail className="h-5 w-5 text-primary mt-0.5" /><div><h4 className="font-medium">Email Support</h4><p className="text-sm text-muted-foreground">support@agrotrust.ng</p></div></div>
                <div className="flex items-start gap-3 p-4 rounded-lg border"><Phone className="h-5 w-5 text-primary mt-0.5" /><div><h4 className="font-medium">Phone Support</h4><p className="text-sm text-muted-foreground">+234 800 AGROTRUST</p></div></div>
                <Button variant="outline" onClick={async () => { await signOut(); navigate('/'); }}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
