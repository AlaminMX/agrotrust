import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, ArrowLeft, TrendingUp, TrendingDown, DollarSign, 
  ShoppingCart, Users, Package, BarChart3 
} from 'lucide-react';
import { formatNaira } from '@/lib/format';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { OrderTrendsChart } from '@/components/admin/OrderTrendsChart';
import { TopProductsChart } from '@/components/admin/TopProductsChart';
import { CategoryDistributionChart } from '@/components/admin/CategoryDistributionChart';
import { FarmerPerformanceTable } from '@/components/admin/FarmerPerformanceTable';

interface AnalyticsData {
  totalRevenue: number;
  platformFees: number;
  farmerPayouts: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  disputedOrders: number;
  totalFarmers: number;
  totalProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
  revenueByDate: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  categoryDistribution: { category: string; revenue: number; count: number }[];
  farmerPerformance: { 
    id: string;
    farmName: string; 
    state: string;
    orders: number; 
    revenue: number; 
    rating: number;
    products: number;
  }[];
}

export default function AdminAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      checkAdminAndLoad();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [dateRange, isAdmin]);

  const checkAdminAndLoad = async () => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        navigate('/');
        return;
      }
      setIsAdmin(true);
      await loadAnalytics();
    } catch (error) {
      console.error('Error checking admin:', error);
      navigate('/');
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      const startDateStr = startDate.toISOString();

      const previousStartDate = new Date();
      previousStartDate.setDate(previousStartDate.getDate() - (daysAgo * 2));
      const previousStartStr = previousStartDate.toISOString();

      // Fetch orders for current period
      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true });

      // Fetch orders for previous period (for growth calculation)
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', previousStartStr)
        .lt('created_at', startDateStr);

      // Fetch all farmers
      const { data: farmers } = await supabase
        .from('farmer_profiles')
        .select('*, products(*)');

      // Fetch all products
      const { data: products } = await supabase
        .from('products')
        .select('*');

      // Calculate metrics
      const currentRevenue = orders?.filter(o => o.status !== 'pending' && o.status !== 'disputed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      
      const previousRevenue = previousOrders?.filter(o => o.status !== 'pending' && o.status !== 'disputed')
        .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      const currentOrderCount = orders?.length || 0;
      const previousOrderCount = previousOrders?.length || 0;
      const orderGrowth = previousOrderCount > 0 
        ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100 
        : 0;

      // Revenue by date
      const revenueByDate: { [key: string]: { revenue: number; orders: number } } = {};
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        if (!revenueByDate[date]) {
          revenueByDate[date] = { revenue: 0, orders: 0 };
        }
        if (order.status !== 'pending' && order.status !== 'disputed') {
          revenueByDate[date].revenue += Number(order.total_amount);
        }
        revenueByDate[date].orders += 1;
      });

      // Orders by status
      const statusCounts: { [key: string]: number } = {};
      orders?.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      // Top products by revenue
      const productRevenue: { [key: string]: { name: string; revenue: number; quantity: number } } = {};
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          if (!productRevenue[item.product_name]) {
            productRevenue[item.product_name] = { name: item.product_name, revenue: 0, quantity: 0 };
          }
          productRevenue[item.product_name].revenue += Number(item.total_price);
          productRevenue[item.product_name].quantity += item.quantity;
        });
      });

      // Category distribution
      const categoryRevenue: { [key: string]: { revenue: number; count: number } } = {};
      products?.forEach(product => {
        const category = product.category || 'other';
        if (!categoryRevenue[category]) {
          categoryRevenue[category] = { revenue: 0, count: 0 };
        }
        categoryRevenue[category].count += 1;
      });

      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const product = products?.find(p => p.id === item.product_id);
          if (product) {
            const category = product.category || 'other';
            categoryRevenue[category].revenue += Number(item.total_price);
          }
        });
      });

      // Farmer performance
      const farmerPerformance = farmers?.map(farmer => {
        const farmerOrders = orders?.filter(o => o.farmer_id === farmer.id) || [];
        const revenue = farmerOrders
          .filter(o => o.status !== 'pending' && o.status !== 'disputed')
          .reduce((sum, o) => sum + Number(o.total_amount), 0);
        
        return {
          id: farmer.id,
          farmName: farmer.farm_name,
          state: farmer.state,
          orders: farmerOrders.length,
          revenue,
          rating: 4.5, // TODO: Calculate from reviews
          products: farmer.products?.length || 0,
        };
      }).sort((a, b) => b.revenue - a.revenue) || [];

      setAnalytics({
        totalRevenue: currentRevenue,
        platformFees: currentRevenue * 0.1,
        farmerPayouts: currentRevenue * 0.9,
        totalOrders: currentOrderCount,
        completedOrders: orders?.filter(o => o.status === 'confirmed' || o.status === 'delivered').length || 0,
        pendingOrders: orders?.filter(o => ['pending', 'paid', 'processing', 'dispatched', 'out_for_delivery'].includes(o.status)).length || 0,
        disputedOrders: orders?.filter(o => o.status === 'disputed').length || 0,
        totalFarmers: farmers?.filter(f => f.verification_status === 'approved').length || 0,
        totalProducts: products?.filter(p => p.is_active).length || 0,
        revenueGrowth,
        orderGrowth,
        revenueByDate: Object.entries(revenueByDate).map(([date, data]) => ({ date, ...data })),
        ordersByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        topProducts: Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        categoryDistribution: Object.entries(categoryRevenue).map(([category, data]) => ({ category, ...data })),
        farmerPerformance,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin || !analytics) return null;

  return (
    <Layout>
      <div className="bg-muted/30 py-6">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Platform Analytics
                </h1>
                <p className="text-sm text-muted-foreground">Comprehensive business insights</p>
              </div>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Total Revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNaira(analytics.totalRevenue)}</div>
              <div className="flex items-center gap-1 mt-1">
                {analytics.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={analytics.revenueGrowth >= 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
                  {analytics.revenueGrowth >= 0 ? '+' : ''}{analytics.revenueGrowth.toFixed(1)}%
                </span>
                <span className="text-muted-foreground text-xs">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Total Orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalOrders}</div>
              <div className="flex items-center gap-1 mt-1">
                {analytics.orderGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={analytics.orderGrowth >= 0 ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
                  {analytics.orderGrowth >= 0 ? '+' : ''}{analytics.orderGrowth.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Active Farmers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalFarmers}</div>
              <p className="text-xs text-muted-foreground mt-1">Verified farmers on platform</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Active Products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Products listed</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription>Platform Fees (10%)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-primary">{formatNaira(analytics.platformFees)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Farmer Payouts (90%)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNaira(analytics.farmerPayouts)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Order Status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="default">{analytics.completedOrders} Completed</Badge>
                <Badge variant="secondary">{analytics.pendingOrders} Pending</Badge>
                {analytics.disputedOrders > 0 && (
                  <Badge variant="destructive">{analytics.disputedOrders} Disputed</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
            <TabsTrigger value="orders">Order Trends</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="farmers">Farmer Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Daily revenue for the selected period</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <RevenueChart data={analytics.revenueByDate} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Trends</CardTitle>
                <CardDescription>Daily order count for the selected period</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <OrderTrendsChart data={analytics.revenueByDate} statusData={analytics.ordersByStatus} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Products by Revenue</CardTitle>
                <CardDescription>Best performing products</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <TopProductsChart data={analytics.topProducts} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Revenue by product category</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <CategoryDistributionChart data={analytics.categoryDistribution} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="farmers">
            <Card>
              <CardHeader>
                <CardTitle>Farmer Performance</CardTitle>
                <CardDescription>Top farmers by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <FarmerPerformanceTable data={analytics.farmerPerformance} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
