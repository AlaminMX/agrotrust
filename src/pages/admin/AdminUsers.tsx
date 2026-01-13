import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Search, 
  Users, 
  ShieldCheck, 
  Tractor, 
  Trash2, 
  UserX,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface User {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  onboarding_completed: boolean;
  roles: string[];
  farmerStatus?: 'pending' | 'under_review' | 'approved' | 'rejected' | null;
  farmName?: string | null;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Load profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Load roles and farmer profiles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);

          // Check if user has farmer profile
          const { data: farmerProfile } = await supabase
            .from('farmer_profiles')
            .select('verification_status, farm_name')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          return {
            ...profile,
            roles: roles?.map(r => r.role) || ['consumer'],
            farmerStatus: farmerProfile?.verification_status || null,
            farmName: farmerProfile?.farm_name || null,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;

      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, roles: [...u.roles, 'admin'] } : u
      ));

      toast({
        title: 'User Promoted',
        description: 'User has been granted admin access',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const promoteToFarmer = async (userId: string) => {
    try {
      // Add farmer role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'farmer' });

      if (roleError) throw roleError;

      // Get user profile for default values
      const user = users.find(u => u.user_id === userId);

      // Create a basic farmer profile
      const { error: profileError } = await supabase
        .from('farmer_profiles')
        .insert({
          user_id: userId,
          farm_name: user?.full_name ? `${user.full_name}'s Farm` : 'New Farm',
          state: 'kaduna',
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, roles: [...u.roles, 'farmer'], farmerStatus: 'approved' } : u
      ));

      toast({
        title: 'User Promoted to Farmer',
        description: 'User has been granted farmer access and a farmer profile has been created',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      // Delete user roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Delete farmer profile if exists
      await supabase
        .from('farmer_profiles')
        .delete()
        .eq('user_id', userId);

      // Delete delivery addresses
      await supabase
        .from('delivery_addresses')
        .delete()
        .eq('user_id', userId);

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Note: We can't delete from auth.users table directly from client
      // The user's auth account will remain but they won't have a profile

      setUsers(users.filter(u => u.user_id !== userId));

      toast({
        title: 'User Deleted',
        description: 'User profile and associated data have been removed',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      // If removing farmer role, also update local farmer status
      if (role === 'farmer') {
        setUsers(users.map(u => 
          u.user_id === userId 
            ? { ...u, roles: u.roles.filter(r => r !== role), farmerStatus: null } 
            : u
        ));
      } else {
        setUsers(users.map(u => 
          u.user_id === userId ? { ...u, roles: u.roles.filter(r => r !== role) } : u
        ));
      }

      toast({
        title: 'Role Removed',
        description: `${role} role has been removed from user`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const getFarmerStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;
    
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
      under_review: { variant: 'outline', icon: <AlertTriangle className="h-3 w-3" />, label: 'Under Review' },
      approved: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Approved' },
      rejected: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
    };
    
    const config = statusConfig[status];
    if (!config) return null;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        Farmer: {config.label}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.farmName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'farmers') return matchesSearch && (user.roles.includes('farmer') || user.farmerStatus);
    if (activeTab === 'consumers') return matchesSearch && !user.roles.includes('farmer') && !user.farmerStatus;
    if (activeTab === 'admins') return matchesSearch && user.roles.includes('admin');
    if (activeTab === 'pending') return matchesSearch && user.farmerStatus && user.farmerStatus !== 'approved';
    
    return matchesSearch;
  });

  const consumers = users.filter(u => !u.roles.includes('farmer') && !u.farmerStatus);
  const farmers = users.filter(u => u.roles.includes('farmer') || u.farmerStatus);
  const pendingFarmers = users.filter(u => u.farmerStatus && u.farmerStatus !== 'approved');
  const admins = users.filter(u => u.roles.includes('admin'));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <BackButton fallbackPath="/admin" />
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">User Management</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-2xl">{users.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Consumers Only</CardDescription>
              <CardTitle className="text-2xl">{consumers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Farmers</CardDescription>
              <CardTitle className="text-2xl">{farmers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={pendingFarmers.length > 0 ? "border-orange-500" : ""}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                {pendingFarmers.length > 0 && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                Pending Farmers
              </CardDescription>
              <CardTitle className="text-2xl">{pendingFarmers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Admins</CardDescription>
              <CardTitle className="text-2xl">{admins.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({users.length})</TabsTrigger>
            <TabsTrigger value="consumers">Consumers ({consumers.length})</TabsTrigger>
            <TabsTrigger value="farmers">Farmers ({farmers.length})</TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingFarmers.length > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                  {pendingFarmers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
          </TabsList>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>
                    {activeTab === 'all' && 'All Users'}
                    {activeTab === 'consumers' && 'Consumer Accounts'}
                    {activeTab === 'farmers' && 'Farmer Accounts'}
                    {activeTab === 'pending' && 'Pending Farmer Applications'}
                    {activeTab === 'admins' && 'Admin Accounts'}
                  </CardTitle>
                  <CardDescription>Manage user accounts and roles</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type & Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.farmName && (
                              <p className="text-xs text-primary flex items-center gap-1 mt-1">
                                <Tractor className="h-3 w-3" />
                                {user.farmName}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.phone || 'No phone'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {/* Show farmer status prominently if exists */}
                            {user.farmerStatus && getFarmerStatusBadge(user.farmerStatus)}
                            
                            {/* Show other roles */}
                            <div className="flex flex-wrap gap-1">
                              {user.roles.includes('admin') && (
                                <Badge variant="default" className="gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  Admin
                                </Badge>
                              )}
                              {!user.farmerStatus && !user.roles.includes('farmer') && (
                                <Badge variant="outline">Consumer</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {/* View farmer details for pending farmers */}
                            {user.farmerStatus && user.farmerStatus !== 'approved' && (
                              <Button
                                size="sm"
                                variant="default"
                                asChild
                              >
                                <Link to="/admin/verifications">
                                  Review
                                </Link>
                              </Button>
                            )}
                            
                            {/* Promote to farmer if not already */}
                            {!user.roles.includes('farmer') && !user.farmerStatus && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => promoteToFarmer(user.user_id)}
                              >
                                <Tractor className="h-4 w-4 mr-1" />
                                Make Farmer
                              </Button>
                            )}
                            
                            {/* Promote to admin */}
                            {!user.roles.includes('admin') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => promoteToAdmin(user.user_id)}
                              >
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                Make Admin
                              </Button>
                            )}
                            
                            {/* Remove admin role */}
                            {user.roles.includes('admin') && user.roles.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeRole(user.user_id, 'admin')}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Remove Admin
                              </Button>
                            )}
                                <UserX className="h-4 w-4 mr-1" />
                                Remove Admin
                              </Button>
                            )}
                            
                            {/* Delete user */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the user's profile, roles, and associated data.
                                    {user.farmName && (
                                      <span className="block mt-2 font-medium text-destructive">
                                        Warning: This user has a farm "{user.farmName}" which will also be deleted.
                                      </span>
                                    )}
                                    <span className="block mt-2">This action cannot be undone.</span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser(user.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deletingUserId === user.user_id}
                                  >
                                    {deletingUserId === user.user_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </main>
    </div>
  );
}
