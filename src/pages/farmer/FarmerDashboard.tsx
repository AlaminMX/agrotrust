import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/BackButton';
import { Loader2, Package, Plus, LogOut, Leaf } from 'lucide-react';
import { formatNaira } from '@/lib/format';

export default function FarmerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [farmerProfile, setFarmerProfile] = useState<{ farm_name?: string; state?: string; farm_description?: string; whatsapp_phone?: string } | null>(null);
  const [products, setProducts] = useState<Array<{ id: string; name: string; is_active: boolean; available_quantity: number; availability_status?: string; price: number; unit: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const loadFarmerData = async () => {
      const { data: profile } = await supabase.from('farmer_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (!profile || profile.verification_status !== 'approved') return navigate('/farmer/onboarding');
      setFarmerProfile(profile);
      const { data: productsData } = await supabase.from('products').select('*').eq('farmer_id', profile.id).order('created_at', { ascending: false });
      setProducts(productsData || []);
      setLoading(false);
    };
    loadFarmerData();
  }, [user, navigate]);

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><BackButton fallbackPath="/" /><Leaf className="h-6 w-6 text-primary" /><span className="text-xl font-bold text-primary">Farmer Dashboard</span></div>
          <Button variant="outline" onClick={async () => { await signOut(); navigate('/'); }}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList><TabsTrigger value="listings">My Listings</TabsTrigger><TabsTrigger value="profile">Farm Profile</TabsTrigger></TabsList>

          <TabsContent value="listings" className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-lg font-semibold">Your Listings</h2><Link to="/farmer/products/add"><Button><Plus className="h-4 w-4 mr-2" />Add Product</Button></Link></div>
            {products.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h3 className="font-semibold mb-2">No listings yet</h3><p className="text-muted-foreground mb-4">Add your first product to start receiving buyer contacts.</p><Link to="/farmer/products/add"><Button><Plus className="h-4 w-4 mr-2" />Add Product</Button></Link></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader className="pb-2"><div className="flex justify-between items-start gap-2"><CardTitle className="text-base">{product.name}</CardTitle><Badge variant={product.is_active ? 'default' : 'secondary'}>{product.availability_status || (product.available_quantity > 10 ? 'In Stock' : product.available_quantity > 0 ? 'Limited' : 'Out of Stock')}</Badge></div></CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold text-primary mb-2">{product.price > 0 ? `${formatNaira(product.price)} / ${product.unit}` : 'Contact for price'}</p>
                      <p className="text-sm text-muted-foreground">Stock: {product.available_quantity}</p>
                      <Link to={`/farmer/products/${product.id}/edit`}><Button variant="outline" size="sm" className="mt-3 w-full">Edit Listing</Button></Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle>{farmerProfile?.farm_name}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{farmerProfile?.state}</p>
                <p>{farmerProfile?.farm_description || 'No description provided.'}</p>
                <p className="text-sm text-muted-foreground">WhatsApp: {farmerProfile?.whatsapp_phone || 'Not set'}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
