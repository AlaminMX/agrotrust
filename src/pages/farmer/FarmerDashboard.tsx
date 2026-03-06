import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/BackButton';
import { Loader2, Package, DollarSign, TrendingUp, Plus, LogOut, Leaf, Home, ChevronDown, BarChart3 } from 'lucide-react';
import { formatNaira } from '@/lib/format';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
    if (user) {
      loadFarmerData();
    }
  }, [user]);

  const loadFarmerData = async () => {
    try {
      const { data: profile } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!profile || profile.verification_status !== 'approved') {
        navigate('/farmer/onboarding');
        return;
      }

      setFarmerProfile(profile);

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', profile.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading farmer data:', error);
    } finally {
      setLoading(false);
    };
    loadFarmerData();
  }, [user, navigate]);

  const listingStatusCounts = products.reduce(
    (acc, product) => {
      const status = product.listing_status || (product.is_active ? 'published' : 'draft');
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const listingChartData = [
    { name: 'Published', value: listingStatusCounts.published || 0 },
    { name: 'Draft', value: listingStatusCounts.draft || 0 },
    { name: 'Paused', value: listingStatusCounts.paused || 0 },
    { name: 'Sold Out', value: listingStatusCounts.sold_out || 0 },
  ];

  const stats = {
    activeProducts: products.filter((p) => p.is_active).length,
    totalListings: products.length,
    totalEarnings: farmerProfile?.total_earnings || 0,
    pendingPayout: farmerProfile?.pending_payout || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/" />
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">Farmer Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Navigate
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Go to Homepage
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/products">Browse Products</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">My Consumer Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/farmer/products/add" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Product
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-muted-foreground hidden sm:inline">{farmerProfile?.farm_name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><Package className="h-4 w-4" /> Active Products</CardDescription>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.activeProducts}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Total Listings</CardDescription>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.totalListings}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Total Earnings</CardDescription>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatNaira(stats.totalEarnings)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Pending Payout</CardDescription>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-primary">{formatNaira(stats.pendingPayout)}</div></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="listings">Listing Management</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Listings</h2>
              <Link to="/farmer/products/add">
                <Button><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Listing Status Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['published', 'draft', 'paused', 'sold_out'].map((status) => (
                  <div key={status} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground uppercase">{status.replace('_', ' ')}</p>
                    <p className="text-xl font-semibold">{listingStatusCounts[status] || 0}</p>
                  </div>
                ))}
              </CardContent>
            </Card>



            <Card>
              <CardHeader>
                <CardTitle className="text-base">Listings Chart</CardTitle>
                <CardDescription>Quick distribution of your listing statuses</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={listingChartData}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4">Start by adding your first product to reach customers</p>
                  <Link to="/farmer/products/add"><Button><Plus className="h-4 w-4 mr-2" /> Add Your First Product</Button></Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.listing_status || (product.is_active ? 'published' : 'draft')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold text-primary mb-2">{formatNaira(product.price)} / {product.unit}</p>
                      <p className="text-sm text-muted-foreground">Stock: {product.available_quantity} {product.unit}</p>
                      <p className="text-sm text-muted-foreground mt-1">{product.is_negotiable ? 'Negotiable' : 'Fixed price'}</p>
                      <Link to={`/farmer/products/${product.id}/edit`}>
                        <Button variant="outline" size="sm" className="mt-3 w-full">Edit Listing</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <h2 className="text-lg font-semibold">Farm Profile</h2>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{farmerProfile?.farm_name}</CardTitle>
                    <CardDescription>{farmerProfile?.state}</CardDescription>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {farmerProfile?.farm_description && <div><p className="text-sm font-medium mb-1">About</p><p className="text-muted-foreground">{farmerProfile.farm_description}</p></div>}
                <div><p className="text-sm font-medium mb-1">Address</p><p className="text-muted-foreground">{farmerProfile?.address}</p></div>
                <div>
                  <p className="text-sm font-medium mb-1">Produce Types</p>
                  <div className="flex flex-wrap gap-2">
                    {farmerProfile?.produce_types?.map((type: string) => <Badge key={type} variant="secondary">{type}</Badge>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
