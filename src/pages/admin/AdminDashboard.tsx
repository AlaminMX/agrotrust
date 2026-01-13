import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/BackButton';
import { 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { formatNaira } from '@/lib/format';

interface DashboardStats {
  pendingVerifications: number;
  activeOrders: number;
  disputedOrders: number;
  totalFarmers: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    pendingVerifications: 0,
    activeOrders: 0,
    disputedOrders: 0,
    totalFarmers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAndFetchStats = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        navigate('/');
        return;
      }

      setIsAdmin(true);

      // Fetch dashboard stats
      const [
        pendingVerificationsRes,
        activeOrdersRes,
        disputedOrdersRes,
        totalFarmersRes,
        totalOrdersRes,
      ] = await Promise.all([
        supabase
          .from('farmer_profiles')
          .select('id', { count: 'exact', head: true })
          .in('verification_status', ['pending', 'under_review']),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['paid', 'processing', 'dispatched', 'out_for_delivery']),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'disputed'),
        supabase
          .from('farmer_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('verification_status', 'approved'),
        supabase.from('orders').select('total_amount'),
      ]);

      const totalRevenue = totalOrdersRes.data?.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0
      ) || 0;

      setStats({
        pendingVerifications: pendingVerificationsRes.count || 0,
        activeOrders: activeOrdersRes.count || 0,
        disputedOrders: disputedOrdersRes.count || 0,
        totalFarmers: totalFarmersRes.count || 0,
        totalOrders: totalOrdersRes.data?.length || 0,
        totalRevenue,
      });

      setLoading(false);
    };

    if (!authLoading) {
      checkAdminAndFetchStats();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statCards = [
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      link: '/admin/verifications',
    },
    {
      title: 'Active Orders',
      value: stats.activeOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/admin/orders',
    },
    {
      title: 'Disputed Orders',
      value: stats.disputedOrders,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-red-100',
      link: '/admin/disputes',
    },
    {
      title: 'Verified Farmers',
      value: stats.totalFarmers,
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-green-100',
      link: '/admin/verifications',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: TrendingUp,
      color: 'text-secondary',
      bgColor: 'bg-amber-50',
      link: '/admin/orders',
    },
    {
      title: 'Total Revenue',
      value: formatNaira(stats.totalRevenue),
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-green-50',
      link: '/admin/orders',
    },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BackButton fallbackPath="/" />
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-1 ml-12">
            Manage farmers, orders, and disputes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {statCards.map((stat) => (
            <Link key={stat.title} to={stat.link}>
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/admin/verifications">Review Farmer Applications</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/orders">Manage Orders</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/disputes">Resolve Disputes</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/users">User Management</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/products">Products</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/payouts">Payouts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
