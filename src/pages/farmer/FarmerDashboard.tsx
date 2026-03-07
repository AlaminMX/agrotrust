import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/BackButton';
import { Loader2, Package, Plus, LogOut, Leaf, Home, ChevronDown, MapPin } from 'lucide-react';
import { formatNaira } from '@/lib/format';
import { formatLocation } from '@/lib/location';
import { getAvailabilityStatus, getAvailabilityColor } from '@/types';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function FarmerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [farmerProfile, setFarmerProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      const { data: productsData } = await supabase.from('products').select('*').eq('farmer_id', profile.id).order('created_at', { ascending: false });
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading farmer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const activeProducts = products.filter(p => p.is_active).length;

  return (
    <div className="min-h-screen bg-background">
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
        </Tabs>
      </main>
    </div>
  );
}
