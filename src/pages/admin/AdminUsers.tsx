import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Search, Users, ShieldCheck, Tractor, UserX, 
  CheckCircle, XCircle, AlertTriangle, Trash2 
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

interface FarmerProfile {
  id: string;
  farm_name: string;
  state: string;
  verification_status: string;
}

interface User {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  onboarding_completed: boolean;
  roles: string[];
  farmerProfile?: FarmerProfile | null;
  preferred_state: string | null;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

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

      // Load all farmer profiles
      const { data: farmerProfiles } = await supabase
        .from('farmer_profiles')
        .select('id, user_id, farm_name, state, verification_status');

      // Create farmer profile lookup by user_id
      const farmerProfileMap = new Map<string, FarmerProfile>();
      farmerProfiles?.forEach(fp => {
        farmerProfileMap.set(fp.user_id, {
          id: fp.id,
          farm_name: fp.farm_name,
          state: fp.state,
          verification_status: fp.verification_status,
        });
      });

      // Load roles for each user
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);

          const userRoles = roles?.map(r => r.role) || [];
          
          // Check if user has farmer profile (even without farmer role)
          const farmerProfile = farmerProfileMap.get(profile.user_id) || null;
          
          // If user has farmer profile but no farmer role, they're a self-registered farmer
          if (farmerProfile && !userRoles.includes('farmer')) {
            userRoles.push('farmer');
          }

          return {
            ...profile,
            roles: userRoles.length > 0 ? userRoles : ['consumer'],
            farmerProfile,
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
      const { data: newProfile, error: profileError } = await supabase
        .from('farmer_profiles')
        .insert({
          user_id: userId,
          farm_name: user?.full_name ? `${user.full_name}'s Farm` : 'New Farm',
          state: 'kaduna',
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) throw profileError;

      setUsers(users.map(u => 
        u.user_id === userId ? { 
          ...u, 
          roles: [...u.roles, 'farmer'],
          farmerProfile: {
            id: newProfile.id,
            farm_name: newProfile.farm_name,
            state: newProfile.state,
            verification_status: newProfile.verification_status,
          }
        } : u
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

  const approveFarmer = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('farmer_profiles')
        .update({ 
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Also ensure farmer role exists
      await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'farmer' }, { onConflict: 'user_id,role' });

      setUsers(users.map(u => 
        u.user_id === userId ? { 
          ...u, 
          farmerProfile: u.farmerProfile ? { ...u.farmerProfile, verification_status: 'approved' } : null 
        } : u
      ));

      toast({
        title: 'Farmer Approved',
        description: 'The farmer has been verified and can now list products',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const rejectFarmer = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('farmer_profiles')
        .update({ verification_status: 'rejected' })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.user_id === userId ? { 
          ...u, 
          farmerProfile: u.farmerProfile ? { ...u.farmerProfile, verification_status: 'rejected' } : null 
        } : u
      ));

      toast({
        title: 'Farmer Rejected',
        description: 'The farmer application has been rejected',
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
    try {
      // Delete user roles first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Delete farmer profile if exists
      await supabase
        .from('farmer_profiles')
        .delete()
        .eq('user_id', userId);

      // Delete user profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.filter(u => u.user_id !== userId));

      toast({
        title: 'User Deleted',
        description: 'The user account has been permanently deleted',
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

  const getUserType = (user: User): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode } => {
    if (user.roles.includes('admin')) {
      return { label: 'Admin', variant: 'default', icon: <ShieldCheck className="h-3 w-3" /> };
    }
    if (user.farmerProfile) {
      const status = user.farmerProfile.verification_status;
      if (status === 'approved') {
        return { label: 'Farmer (Approved)', variant: 'secondary', icon: <CheckCircle className="h-3 w-3" /> };
      }
      if (status === 'pending' || status === 'under_review') {
        return { label: 'Farmer (Pending)', variant: 'outline', icon: <AlertTriangle className="h-3 w-3" /> };
      }
      if (status === 'rejected') {
        return { label: 'Farmer (Rejected)', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> };
      }
    }
    return { label: 'Consumer', variant: 'outline', icon: <Users className="h-3 w-3" /> };
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.farmerProfile?.farm_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'consumers') return matchesSearch && !user.farmerProfile && !user.roles.includes('admin');
    if (activeTab === 'farmers') return matchesSearch && user.farmerProfile;
    if (activeTab === 'admins') return matchesSearch && user.roles.includes('admin');
    return matchesSearch;
  });

  const consumers = users.filter(u => !u.farmerProfile && !u.roles.includes('admin'));
  const farmers = users.filter(u => u.farmerProfile);
  const pendingFarmers = farmers.filter(f => f.farmerProfile?.verification_status === 'pending' || f.farmerProfile?.verification_status === 'under_review');
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
              <CardDescription>Consumers</CardDescription>
              <CardTitle className="text-2xl">{consumers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Farmers</CardDescription>
              <CardTitle className="text-2xl">{farmers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardDescription className="text-amber-700">Pending Approval</CardDescription>
              <CardTitle className="text-2xl text-amber-700">{pendingFarmers.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Admins</CardDescription>
              <CardTitle className="text-2xl">{admins.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all user accounts</CardDescription>
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">All ({users.length})</TabsTrigger>
                <TabsTrigger value="consumers">Consumers ({consumers.length})</TabsTrigger>
                <TabsTrigger value="farmers">
                  Farmers ({farmers.length})
                  {pendingFarmers.length > 0 && (
                    <span className="ml-1 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                      {pendingFarmers.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Farm Details</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const userType = getUserType(user);
                    const isPendingFarmer = user.farmerProfile && 
                      (user.farmerProfile.verification_status === 'pending' || 
                       user.farmerProfile.verification_status === 'under_review');

                    return (
                      <TableRow key={user.id} className={isPendingFarmer ? 'bg-amber-50' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            {user.phone && (
                              <p className="text-xs text-muted-foreground">{user.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">
                            {user.preferred_state ? (
                              <span className="flex items-center gap-1">
                                📍 {user.preferred_state}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not set</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={userType.variant} className="flex items-center gap-1 w-fit">
                            {userType.icon}
                            {userType.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.farmerProfile ? (
                            <div className="text-sm">
                              <p className="font-medium">{user.farmerProfile.farm_name}</p>
                              <p className="text-muted-foreground capitalize">{user.farmerProfile.state}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            {/* Farmer Approval Actions */}
                            {isPendingFarmer && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => approveFarmer(user.user_id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectFarmer(user.user_id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {/* Convert to Farmer */}
                            {!user.farmerProfile && !user.roles.includes('farmer') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => promoteToFarmer(user.user_id)}
                              >
                                <Tractor className="h-4 w-4 mr-1" />
                                Make Farmer
                              </Button>
                            )}

                            {/* Promote to Admin */}
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

                            {/* Delete User */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete this user account? 
                                    This action cannot be undone and will remove all associated data including:
                                    <ul className="list-disc ml-4 mt-2">
                                      <li>User profile</li>
                                      <li>User roles</li>
                                      {user.farmerProfile && <li>Farmer profile and products</li>}
                                    </ul>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser(user.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
      </main>
    </div>
  );
}
