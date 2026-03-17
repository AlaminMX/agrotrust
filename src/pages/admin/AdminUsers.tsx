import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Search, Users, ShieldCheck, Tractor, UserX,
  CheckCircle, XCircle, AlertTriangle, Trash2, ShieldOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [makeAdminDialog, setMakeAdminDialog] = useState<{ userId: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: farmerProfiles } = await supabase
        .from('farmer_profiles')
        .select('id, user_id, farm_name, state, verification_status');

      const farmerProfileMap = new Map<string, FarmerProfile>();
      farmerProfiles?.forEach(fp => {
        farmerProfileMap.set(fp.user_id, {
          id: fp.id,
          farm_name: fp.farm_name,
          state: fp.state,
          verification_status: fp.verification_status,
        });
      });

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);

          const userRoles = roles?.map(r => r.role) || [];
          const farmerProfile = farmerProfileMap.get(profile.user_id) || null;

          if (farmerProfile && farmerProfile.verification_status === 'approved' && !userRoles.includes('farmer')) {
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
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // keepFarmerRole: true = keep farmer role & listings, false = strip farmer role & hide listings
  const promoteToAdmin = async (userId: string, keepFarmerRole: boolean) => {
    try {
      const { error: adminError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (adminError && !adminError.message.includes('duplicate')) throw adminError;

      if (!keepFarmerRole) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'farmer');

        const target = users.find(u => u.user_id === userId);
        if (target?.farmerProfile?.id) {
          await supabase
            .from('products')
            .update({ is_active: false })
            .eq('farmer_id', target.farmerProfile.id);

          await supabase
            .from('farmer_profiles')
            .update({ verification_status: 'rejected' })
            .eq('user_id', userId);
        }
      }

      setUsers(prev => prev.map(u => {
        if (u.user_id !== userId) return u;
        const newRoles = [...u.roles.filter(r => keepFarmerRole || r !== 'farmer')];
        if (!newRoles.includes('admin')) newRoles.push('admin');
        return {
          ...u,
          roles: newRoles,
          farmerProfile: keepFarmerRole
            ? u.farmerProfile
            : u.farmerProfile
              ? { ...u.farmerProfile, verification_status: 'rejected' }
              : null,
        };
      }));

      setMakeAdminDialog(null);
      toast({
        title: 'User Promoted to Admin',
        description: keepFarmerRole
          ? 'User now has both Admin and Farmer access. Listings remain active.'
          : 'User is now Admin only. Farmer role and product listings have been hidden.',
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const revokeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;

      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, roles: u.roles.filter(r => r !== 'admin') } : u
      ));

      toast({ title: 'Admin Revoked', description: 'Admin access has been removed from this user.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const promoteToFarmer = async (userId: string) => {
    try {
      const target = users.find(u => u.user_id === userId);

      // Farmer profile exists but was revoked — re-approve and restore products
      if (target?.farmerProfile?.id) {
        const { error: updateError } = await supabase
          .from('farmer_profiles')
          .update({ verification_status: 'approved', verified_at: new Date().toISOString() })
          .eq('user_id', userId);

        if (updateError) throw updateError;

        await supabase
          .from('products')
          .update({ is_active: true })
          .eq('farmer_id', target.farmerProfile.id);

        await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'farmer' }, { onConflict: 'user_id,role' });

        setUsers(prev => prev.map(u => {
          if (u.user_id !== userId) return u;
          const newRoles = u.roles.includes('farmer') ? u.roles : [...u.roles, 'farmer'];
          return { ...u, roles: newRoles, farmerProfile: { ...u.farmerProfile!, verification_status: 'approved' } };
        }));

        toast({ title: 'Farmer Reinstated', description: 'Farmer role restored and all product listings are now active again.' });
        return;
      }

      // No farmer profile — create from scratch
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'farmer' });

      if (roleError && !roleError.message.includes('duplicate')) throw roleError;

      const { data: newProfile, error: profileError } = await supabase
        .from('farmer_profiles')
        .insert({
          user_id: userId,
          farm_name: target?.full_name ? `${target.full_name}'s Farm` : 'New Farm',
          state: 'kaduna',
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) throw profileError;

      setUsers(prev => prev.map(u => {
        if (u.user_id !== userId) return u;
        const newRoles = u.roles.includes('farmer') ? u.roles : [...u.roles, 'farmer'];
        return {
          ...u,
          roles: newRoles,
          farmerProfile: {
            id: newProfile.id,
            farm_name: newProfile.farm_name,
            state: newProfile.state,
            verification_status: newProfile.verification_status,
          },
        };
      }));

      toast({ title: 'User Made Farmer', description: 'Farmer role granted and a farmer profile has been created.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const revokeFarmer = async (userId: string) => {
    try {
      const target = users.find(u => u.user_id === userId);

      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'farmer');

      if (target?.farmerProfile?.id) {
        await supabase
          .from('products')
          .update({ is_active: false })
          .eq('farmer_id', target.farmerProfile.id);

        const { error } = await supabase
          .from('farmer_profiles')
          .update({ verification_status: 'rejected' })
          .eq('user_id', userId);

        if (error) throw error;
      }

      setUsers(prev => prev.map(u => {
        if (u.user_id !== userId) return u;
        return {
          ...u,
          roles: u.roles.filter(r => r !== 'farmer'),
          farmerProfile: u.farmerProfile ? { ...u.farmerProfile, verification_status: 'rejected' } : null,
        };
      }));

      toast({ title: 'Farmer Revoked', description: 'Farmer role removed and all product listings have been hidden.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const approveFarmer = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('farmer_profiles')
        .update({ verification_status: 'approved', verified_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'farmer' }, { onConflict: 'user_id,role' });

      setUsers(prev => prev.map(u =>
        u.user_id === userId
          ? {
              ...u,
              roles: u.roles.includes('farmer') ? u.roles : [...u.roles, 'farmer'],
              farmerProfile: u.farmerProfile ? { ...u.farmerProfile, verification_status: 'approved' } : null,
            }
          : u
      ));

      toast({ title: 'Farmer Approved', description: 'The farmer has been verified and can now list products.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const rejectFarmer = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('farmer_profiles')
        .update({ verification_status: 'rejected' })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u =>
        u.user_id === userId
          ? { ...u, farmerProfile: u.farmerProfile ? { ...u.farmerProfile, verification_status: 'rejected' } : null }
          : u
      ));

      toast({ title: 'Farmer Rejected', description: 'The farmer application has been rejected.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setUsers(prev => prev.filter(u => u.user_id !== userId));
      toast({ title: 'User Deleted', description: 'The user account has been permanently deleted.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateString));

  const getUserType = (user: User): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode } => {
    if (user.roles.includes('admin') && user.roles.includes('farmer')) {
      return { label: 'Admin + Farmer', variant: 'default', icon: <ShieldCheck className="h-3 w-3" /> };
    }
    if (user.roles.includes('admin')) {
      return { label: 'Admin', variant: 'default', icon: <ShieldCheck className="h-3 w-3" /> };
    }
    if (user.farmerProfile) {
      const status = user.farmerProfile.verification_status;
      if (status === 'approved') return { label: 'Farmer', variant: 'secondary', icon: <CheckCircle className="h-3 w-3" /> };
      if (status === 'pending' || status === 'under_review') return { label: 'Farmer (Pending)', variant: 'outline', icon: <AlertTriangle className="h-3 w-3" /> };
      if (status === 'rejected') return { label: 'Farmer (Revoked)', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> };
    }
    return { label: 'Consumer', variant: 'outline', icon: <Users className="h-3 w-3" /> };
  };

  const consumers = users.filter(u => !u.farmerProfile && !u.roles.includes('admin'));
  const farmers = users.filter(u => u.farmerProfile && !u.roles.includes('admin'));
  const pendingFarmers = farmers.filter(f => f.farmerProfile?.verification_status === 'pending' || f.farmerProfile?.verification_status === 'under_review');
  const admins = users.filter(u => u.roles.includes('admin'));

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.farmerProfile?.farm_name?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'consumers') return matchesSearch && !user.farmerProfile && !user.roles.includes('admin');
    if (activeTab === 'farmers') return matchesSearch && !!user.farmerProfile && !user.roles.includes('admin');
    if (activeTab === 'admins') return matchesSearch && user.roles.includes('admin');
    return matchesSearch;
  });

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
                    const isApprovedFarmer =
                      user.roles.includes('farmer') &&
                      user.farmerProfile?.verification_status === 'approved';
                    const isPendingFarmer =
                      !!user.farmerProfile &&
                      (user.farmerProfile.verification_status === 'pending' ||
                        user.farmerProfile.verification_status === 'under_review');
                    const isRevokedFarmer =
                      !!user.farmerProfile &&
                      user.farmerProfile.verification_status === 'rejected' &&
                      !user.roles.includes('farmer');
                    const isAdmin = user.roles.includes('admin');

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

                            {/* Pending farmer: Approve / Reject */}
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

                            {/* Make Farmer / Reinstate Farmer
                                - Normal users: "Make Farmer"
                                - Revoked farmers: "Reinstate Farmer"
                                - Admins without farmer role: "Make Farmer"
                                - Hidden for: approved farmers, pending farmers */}
                            {!isApprovedFarmer && !isPendingFarmer && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => promoteToFarmer(user.user_id)}
                              >
                                <Tractor className="h-4 w-4 mr-1" />
                                {isRevokedFarmer ? 'Reinstate Farmer' : 'Make Farmer'}
                              </Button>
                            )}

                            {/* Revoke Farmer
                                - Approved farmers (including admin+farmer combo) */}
                            {isApprovedFarmer && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <UserX className="h-4 w-4 mr-1" />
                                    Revoke Farmer
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke Farmer Status</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove the farmer role from{' '}
                                      <strong>{user.full_name || user.email}</strong> and hide all
                                      their product listings. Their listings will reappear if they
                                      are reinstated as a farmer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => revokeFarmer(user.user_id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Revoke Farmer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

                            {/* Make Admin
                                - All non-admins
                                - If approved farmer → open dialog to choose farmer fate */}
                            {!isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (isApprovedFarmer) {
                                    setMakeAdminDialog({ userId: user.user_id });
                                  } else {
                                    promoteToAdmin(user.user_id, false);
                                  }
                                }}
                              >
                                <ShieldCheck className="h-4 w-4 mr-1" />
                                Make Admin
                              </Button>
                            )}

                            {/* Revoke Admin — all admins */}
                            {isAdmin && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                                  >
                                    <ShieldOff className="h-4 w-4 mr-1" />
                                    Revoke Admin
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke Admin Access</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove admin access from{' '}
                                      <strong>{user.full_name || user.email}</strong>. They will
                                      revert to a regular user (or farmer, if they still have that
                                      role).
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => revokeAdmin(user.user_id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Revoke Admin
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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

      {/* Make Admin dialog — shown when target is an approved farmer */}
      <Dialog
        open={!!makeAdminDialog}
        onOpenChange={(open) => { if (!open) setMakeAdminDialog(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make User an Admin</DialogTitle>
            <DialogDescription>
              This user is currently an approved farmer. What should happen to their farmer status?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => makeAdminDialog && promoteToAdmin(makeAdminDialog.userId, true)}
            >
              <ShieldCheck className="h-5 w-5 mr-3 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-semibold">Keep Farmer Role</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  User will have both Admin and Farmer access. Listings stay active.
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4 border-destructive/40 hover:bg-destructive/5"
              onClick={() => makeAdminDialog && promoteToAdmin(makeAdminDialog.userId, false)}
            >
              <UserX className="h-5 w-5 mr-3 text-destructive shrink-0" />
              <div className="text-left">
                <p className="font-semibold">Remove Farmer Role</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  User becomes Admin only. All product listings will be hidden.
                </p>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMakeAdminDialog(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
