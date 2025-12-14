import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Package, ShoppingCart, DollarSign, TrendingUp, 
  Plus, LogOut, Leaf, AlertCircle
} from 'lucide-react';
import { formatNaira } from '@/lib/format';

export default function FarmerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [farmerProfile, setFarmerProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadFarmerData();
    }
  }, [user]);

  const loadFarmerData = async () => {
    try {
      // Load farmer profile
      const { data: profile } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!profile) {
        navigate('/farmer/onboarding');
        return;
      }

      if (profile.verification_status !== 'approved') {
        navigate('/farmer/onboarding');
        return;
      }

      setFarmerProfile(profile);

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', profile.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);

      // Load orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('farmer_id', profile.id)
        .order('created_at', { ascending: false });

      setOrders(ordersData || []);

    } catch (error) {
      console.error('Error loading farmer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    activeProducts: products.filter(p => p.is_active).length,
    pendingOrders: orders.filter(o => ['paid', 'processing'].includes(o.status)).length,
    totalEarnings: farmerProfile?.total_earnings || 0,
    pendingPayout: farmerProfile?.pending_payout || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">Farmer Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {farmerProfile?.farm_name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Active Products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProducts}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Pending Orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Total Earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(stats.totalEarnings)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Pending Payout
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatNaira(stats.pendingPayout)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Products</h2>
              <Link to="/farmer/products/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Button>
              </Link>
            </div>

            {products.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No products yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by adding your first product to reach customers
                  </p>
                  <Link to="/farmer/products/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Add Your First Product
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold text-primary mb-2">
                        {formatNaira(product.price)} / {product.unit}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.available_quantity} {product.unit}
                      </p>
                      <Link to={`/farmer/products/${product.id}/edit`}>
                        <Button variant="outline" size="sm" className="mt-3 w-full">
                          Edit Product
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-lg font-semibold">Orders</h2>
            
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">
                    Orders will appear here once customers start purchasing your products
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Order #{order.order_number}</CardTitle>
                        <Badge variant={
                          order.status === 'delivered' ? 'default' :
                          order.status === 'disputed' ? 'destructive' : 'secondary'
                        }>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription>
                        {new Date(order.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {order.order_items?.length || 0} items • {order.delivery_state}
                          </p>
                          <p className="font-semibold">{formatNaira(order.total_amount)}</p>
                        </div>
                        <Link to={`/farmer/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <h2 className="text-lg font-semibold">Payouts</h2>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payout Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-xl font-bold">{formatNaira(farmerProfile?.total_earnings || 0)}</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pending Payout</p>
                    <p className="text-xl font-bold text-primary">{formatNaira(farmerProfile?.pending_payout || 0)}</p>
                  </div>
                </div>
                
                {!farmerProfile?.bank_account_number && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Bank details not set</p>
                      <p className="text-sm text-amber-700">
                        Add your bank details in your profile to receive payouts
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {farmerProfile?.farm_description && (
                  <div>
                    <p className="text-sm font-medium mb-1">About</p>
                    <p className="text-muted-foreground">{farmerProfile.farm_description}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium mb-1">Address</p>
                  <p className="text-muted-foreground">{farmerProfile?.address}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Produce Types</p>
                  <div className="flex flex-wrap gap-2">
                    {farmerProfile?.produce_types?.map((type: string) => (
                      <Badge key={type} variant="secondary">{type}</Badge>
                    ))}
                  </div>
                </div>

                <Link to="/farmer/profile/edit">
                  <Button variant="outline" className="mt-4">
                    Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
