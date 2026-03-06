import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/BackButton';
import { Clock, CheckCircle, Users, Flag } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pendingVerifications: 0, totalFarmers: 0, pendingReports: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAndFetchStats = async () => {
      if (!user) return navigate('/auth');
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (!roleData) return navigate('/');
      setIsAdmin(true);

      const [pendingRes, farmersRes, reportsRes] = await Promise.all([
        supabase.from('farmer_profiles').select('id', { count: 'exact', head: true }).in('verification_status', ['pending', 'under_review']),
        supabase.from('farmer_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'approved'),
        supabase.from('listing_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending') as any,
      ]);

      setStats({ pendingVerifications: pendingRes.count || 0, totalFarmers: farmersRes.count || 0, pendingReports: reportsRes.count || 0 });
      setLoading(false);
    };
    if (!authLoading) checkAdminAndFetchStats();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></Layout>;
  if (!isAdmin) return null;

  const statCards = [
    { title: 'Pending Verifications', value: stats.pendingVerifications, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100', link: '/admin/verifications' },
    { title: 'Verified Farmers', value: stats.totalFarmers, icon: CheckCircle, color: 'text-primary', bgColor: 'bg-green-100', link: '/admin/verifications' },
    { title: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'text-red-600', bgColor: 'bg-red-100', link: '/admin/reports' },
    { title: 'User Management', value: 'Manage', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100', link: '/admin/users' },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2"><BackButton fallbackPath="/" /><h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1></div>
          <p className="text-muted-foreground mt-1 ml-12">Manage farmers, reports, and platform health.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {statCards.map((stat) => (
            <Link key={stat.title} to={stat.link}>
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}><stat.icon className={`h-4 w-4 ${stat.color}`} /></div>
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-foreground">{stat.value}</div></CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild><Link to="/admin/verifications">Review Farmer Applications</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/reports">Reports Inbox</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/users">User Management</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/products">Products</Link></Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
