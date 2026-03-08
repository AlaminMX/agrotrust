import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/BackButton';
import { Loader2, Package, Plus, LogOut, Leaf, Home, ChevronDown, MapPin, Phone, MessageCircle, Mail, Save, Edit, X } from 'lucide-react';
import { CATEGORIES } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { formatNaira } from '@/lib/format';
import { formatLocation } from '@/lib/location';
import { getAvailabilityStatus, getAvailabilityColor } from '@/types';
import { normalizeNigerianPhone } from '@/lib/phone';
import { FarmerBottomNav } from '@/components/layout/FarmerBottomNav';
import { useToast } from '@/hooks/use-toast';
import { useStates } from '@/hooks/useStates';
import { AreaInput } from '@/components/ui/AreaInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function FarmerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [farmerProfile, setFarmerProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Contact edit state
  const [editingContact, setEditingContact] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [callPhone, setCallPhone] = useState('');
  const [farmerEmail, setFarmerEmail] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  // Location edit state
  const [editingLocation, setEditingLocation] = useState(false);
  const [editState, setEditState] = useState('');
  const [editArea, setEditArea] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const { states } = useStates();

  // Profile details edit state
  const [editingDetails, setEditingDetails] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editProduceTypes, setEditProduceTypes] = useState<string[]>([]);
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) loadFarmerData();
  }, [user]);

  const loadFarmerData = async () => {
    try {
      const { data: profile } = await supabase.from('farmer_profiles').select('*').eq('user_id', user!.id).maybeSingle();
      if (!profile || profile.verification_status !== 'approved') { navigate('/farmer/onboarding'); return; }
      setFarmerProfile(profile);
      setWhatsapp(profile.whatsapp_phone || '');
      setCallPhone(profile.secondary_phone || '');
      setFarmerEmail((profile as any).email || '');
      setEditState(profile.state || '');
      setEditArea(profile.area || '');
      const { data: productsData } = await supabase.from('products').select('*').eq('farmer_id', profile.id).order('created_at', { ascending: false });
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading farmer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContactInfo = async () => {
    if (!farmerProfile) return;
    setSavingContact(true);
    try {
      const { error } = await supabase.from('farmer_profiles').update({
        whatsapp_phone: normalizeNigerianPhone(whatsapp) || null,
        secondary_phone: normalizeNigerianPhone(callPhone) || null,
        email: farmerEmail || null,
      } as any).eq('id', farmerProfile.id);
      if (error) throw error;
      toast({ title: 'Contact info updated' });
      setEditingContact(false);
      loadFarmerData();
    } catch (error: any) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    } finally {
      setSavingContact(false);
    }
  };

  const saveLocationInfo = async () => {
    if (!farmerProfile || !editState) {
      toast({ title: 'State is required', variant: 'destructive' });
      return;
    }
    setSavingLocation(true);
    try {
      const { error } = await supabase.from('farmer_profiles').update({
        state: editState,
        area: editArea || null,
      }).eq('id', farmerProfile.id);
      if (error) throw error;
      // Also update all farmer's products to match new location
      await supabase.from('products').update({
        state: editState,
        area: editArea || null,
      }).eq('farmer_id', farmerProfile.id);
      toast({ title: 'Location updated' });
      setEditingLocation(false);
      loadFarmerData();
    } catch (error: any) {
      toast({ title: 'Failed to update location', description: error.message, variant: 'destructive' });
    } finally {
      setSavingLocation(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const activeProducts = products.filter(p => p.is_active).length;

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Home className="h-4 w-4 mr-2" />Navigate<ChevronDown className="h-4 w-4 ml-2" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                <DropdownMenuItem asChild><Link to="/">Homepage</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/products">Browse Listings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/farmer/products/add" className="flex items-center gap-2"><Plus className="h-4 w-4" />Add Product</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate('/'); }}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Package className="h-4 w-4" /> Active</CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-bold">{activeProducts}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription className="flex items-center gap-2"><Package className="h-4 w-4" /> Total</CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-bold">{products.length}</div></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Listings</h2>
              <Link to="/farmer/products/add"><Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Product</Button></Link>
            </div>

            {products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4 text-sm">Start by adding your first product</p>
                  <Link to="/farmer/products/add"><Button><Plus className="h-4 w-4 mr-2" /> Add Your First Product</Button></Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => {
                  const avail = getAvailabilityStatus(product.available_quantity);
                  return (
                    <Card key={product.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
                          <Badge className={getAvailabilityColor(avail)}>{avail}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-bold text-primary mb-1">{formatNaira(product.price)} / {product.unit}</p>
                        <p className="text-sm text-muted-foreground">Stock: {product.available_quantity} {product.unit}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{product.is_negotiable ? 'Negotiable' : 'Fixed price'}</p>
                        <Link to={`/farmer/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm" className="mt-3 w-full text-sm">Edit Listing</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{farmerProfile?.farm_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {formatLocation(farmerProfile?.state, farmerProfile?.area)}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-primary/10 text-primary">Verified</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Location editing */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Location</p>
                    {!editingLocation && (
                      <Button variant="ghost" size="sm" onClick={() => setEditingLocation(true)}>
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                  {editingLocation ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>State <span className="text-destructive">*</span></Label>
                        <Select value={editState} onValueChange={(val) => { setEditState(val); setEditArea(''); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {states.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Area</Label>
                        <AreaInput value={editArea} onChange={setEditArea} state={editState} placeholder="e.g., Gwarimpa" />
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={saveLocationInfo} disabled={savingLocation || !editState} size="sm">
                          <Save className="h-4 w-4 mr-2" />{savingLocation ? 'Saving...' : 'Save Location'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setEditingLocation(false); setEditState(farmerProfile?.state || ''); setEditArea(farmerProfile?.area || ''); }}>Cancel</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Changing your location will also update all your existing product listings.</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">{formatLocation(farmerProfile?.state, farmerProfile?.area)}</p>
                  )}
                </div>

                {farmerProfile?.farm_description && (
                  <div>
                    <p className="text-sm font-medium mb-1">About</p>
                    <p className="text-muted-foreground text-sm">{farmerProfile.farm_description}</p>
                  </div>
                )}
                {farmerProfile?.address && (
                  <div>
                    <p className="text-sm font-medium mb-1">Address</p>
                    <p className="text-muted-foreground text-sm">{farmerProfile.address}</p>
                  </div>
                )}
                {farmerProfile?.produce_types?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Produce Types</p>
                    <div className="flex flex-wrap gap-2">
                      {farmerProfile.produce_types.map((type: string) => <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Contact Information</CardTitle>
                <CardDescription>Your contact details are shown publicly on your profile and product pages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingContact ? (
                  <>
                    <div className="space-y-2">
                      <Label>WhatsApp Number</Label>
                      <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="08012345678" />
                    </div>
                    <div className="space-y-2">
                      <Label>Call Number</Label>
                      <Input value={callPhone} onChange={e => setCallPhone(e.target.value)} placeholder="08012345678" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input type="email" value={farmerEmail} onChange={e => setFarmerEmail(e.target.value)} placeholder="farmer@example.com" />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={saveContactInfo} disabled={savingContact}>
                        <Save className="h-4 w-4 mr-2" />{savingContact ? 'Saving...' : 'Save'}
                      </Button>
                      <Button variant="outline" onClick={() => setEditingContact(false)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <MessageCircle className="h-5 w-5 text-[hsl(var(--whatsapp))]" />
                        <div><p className="text-xs text-muted-foreground">WhatsApp</p><p className="font-medium">{farmerProfile?.whatsapp_phone || 'Not set'}</p></div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <Phone className="h-5 w-5 text-primary" />
                        <div><p className="text-xs text-muted-foreground">Call Number</p><p className="font-medium">{farmerProfile?.secondary_phone || 'Not set'}</p></div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <Mail className="h-5 w-5 text-primary" />
                        <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{(farmerProfile as any)?.email || 'Not set'}</p></div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setEditingContact(true)}>Edit Contact Info</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <FarmerBottomNav />
    </div>
  );
}
