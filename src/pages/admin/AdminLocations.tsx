import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/ui/BackButton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, MapPin, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PlatformState { id: string; value: string; label: string; is_active: boolean; sort_order: number; }
interface PlatformArea { id: string; state_value: string; name: string; }

export default function AdminLocations() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [states, setStates] = useState<PlatformState[]>([]);
  const [areas, setAreas] = useState<PlatformArea[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStateValue, setNewStateValue] = useState('');
  const [newStateLabel, setNewStateLabel] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    if (user) loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user!.id).eq('role', 'admin').maybeSingle();
    if (!roleData) return navigate('/');
    const { data: statesData } = await supabase.from('platform_states' as any).select('*').order('sort_order');
    setStates((statesData as any[] || []) as PlatformState[]);
    const { data: areasData } = await supabase.from('platform_areas' as any).select('*').order('name');
    setAreas((areasData as any[] || []) as PlatformArea[]);
    setLoading(false);
  };

  const addState = async () => {
    if (!newStateValue.trim() || !newStateLabel.trim()) return;
    setAdding(true);
    const slug = newStateValue.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const { error } = await supabase.from('platform_states' as any).insert({ value: slug, label: newStateLabel.trim(), sort_order: states.length + 1 } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else { setNewStateValue(''); setNewStateLabel(''); await loadData(); toast({ title: 'State added' }); }
    setAdding(false);
  };

  const deleteState = async (value: string) => {
    const { error } = await supabase.from('platform_states' as any).delete().eq('value', value);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { if (selectedState === value) setSelectedState(null); await loadData(); toast({ title: 'State removed' }); }
  };

  const addArea = async () => {
    if (!selectedState || !newAreaName.trim()) return;
    setAdding(true);
    const { error } = await supabase.from('platform_areas' as any).insert({ state_value: selectedState, name: newAreaName.trim() } as any);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { setNewAreaName(''); await loadData(); toast({ title: 'Area added' }); }
    setAdding(false);
  };

  const deleteArea = async (id: string) => {
    const { error } = await supabase.from('platform_areas' as any).delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { await loadData(); toast({ title: 'Area removed' }); }
  };

  const selectedAreas = areas.filter(a => a.state_value === selectedState);

  if (authLoading || loading) return <Layout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <BackButton fallbackPath="/admin" />
          <div><h1 className="text-3xl font-bold text-foreground">Manage Locations</h1><p className="text-muted-foreground mt-1">Add or remove states and local areas</p></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* States */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> States</CardTitle>
              <CardDescription>Manage available states for the marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Slug (e.g. lagos)" value={newStateValue} onChange={e => setNewStateValue(e.target.value)} className="flex-1" />
                <Input placeholder="Label (e.g. Lagos)" value={newStateLabel} onChange={e => setNewStateLabel(e.target.value)} className="flex-1" />
                <Button onClick={addState} disabled={adding} size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                {states.map(s => (
                  <div key={s.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${selectedState === s.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                    onClick={() => setSelectedState(s.value)}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.label}</span>
                      <Badge variant="outline" className="text-xs">{s.value}</Badge>
                      <Badge variant="secondary" className="text-xs">{areas.filter(a => a.state_value === s.value).length} areas</Badge>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete {s.label}?</AlertDialogTitle><AlertDialogDescription>This will also delete all areas under this state.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteState(s.value)}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Areas */}
          <Card>
            <CardHeader>
              <CardTitle>Local Areas</CardTitle>
              <CardDescription>{selectedState ? `Areas in ${states.find(s => s.value === selectedState)?.label}` : 'Select a state to manage areas'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedState ? (
                <>
                  <div className="flex gap-2">
                    <Input placeholder="Area name (e.g. Gwarimpa)" value={newAreaName} onChange={e => setNewAreaName(e.target.value)} className="flex-1" />
                    <Button onClick={addArea} disabled={adding} size="icon"><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAreas.map(a => (
                      <Badge key={a.id} variant="secondary" className="flex items-center gap-1.5 py-1.5 px-3">
                        {a.name}
                        <button onClick={() => deleteArea(a.id)} className="hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                    {selectedAreas.length === 0 && <p className="text-sm text-muted-foreground">No areas yet. Add one above.</p>}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">Click a state on the left to manage its areas</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
