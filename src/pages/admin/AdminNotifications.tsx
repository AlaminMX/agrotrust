import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/ui/BackButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Bell, User, Tractor, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  user_id: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export default function AdminNotifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    if (user) loadNotifications();
  }, [user, authLoading]);

  const loadNotifications = async () => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user!.id).eq('role', 'admin').maybeSingle();
    if (!roleData) return navigate('/');
    const { data } = await supabase.from('admin_notifications' as any).select('*').order('created_at', { ascending: false }).limit(100);
    setNotifications((data as any[] || []) as Notification[]);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('admin_notifications' as any).update({ is_read: true } as any).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    await supabase.from('admin_notifications' as any).update({ is_read: true } as any).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'users') return n.type === 'new_user';
    if (activeTab === 'farmers') return n.type === 'new_farmer';
    if (activeTab === 'unread') return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (authLoading || loading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/admin" />
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Bell className="h-7 w-7" /> Notifications
                {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
              </h1>
              <p className="text-muted-foreground mt-1">Recent signups and farmer registrations</p>
            </div>
          </div>
          {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllAsRead}><Check className="h-4 w-4 mr-2" />Mark all read</Button>}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({notifications.filter(n => n.type === 'new_user').length})</TabsTrigger>
            <TabsTrigger value="farmers">Farmers ({notifications.filter(n => n.type === 'new_farmer').length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {filtered.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No notifications</div>
                ) : filtered.map(n => (
                  <div key={n.id} className={`flex items-start gap-4 p-4 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === 'new_farmer' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {n.type === 'new_farmer' ? <Tractor className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {n.type === 'new_farmer' ? 'New Farmer Registration' : 'New User Signup'}
                        </p>
                        {!n.is_read && <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {n.type === 'new_farmer'
                          ? `${n.metadata?.farm_name || 'Unknown'} from ${n.metadata?.state || 'Unknown'}`
                          : `${n.metadata?.full_name || 'Unknown'} (${n.metadata?.email || 'no email'})`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), 'MMM d, yyyy • h:mm a')}</p>
                    </div>
                    {!n.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)} className="shrink-0">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
