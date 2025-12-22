import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, MapPin, Plus, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Zone {
  id: string;
  zone_code: string;
  zone_name: string;
  is_active: boolean;
}

interface Area {
  id: string;
  area_name: string;
  zone_id: string | null;
  state: string;
  is_active: boolean;
  delivery_zones?: Zone;
}

export default function AdminDeliveryZones() {
  const { toast } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaZone, setNewAreaZone] = useState('');
  const [addingArea, setAddingArea] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [zonesRes, areasRes] = await Promise.all([
        supabase.from('delivery_zones').select('*').order('zone_code'),
        supabase.from('delivery_areas').select('*, delivery_zones(*)').order('area_name'),
      ]);

      if (zonesRes.error) throw zonesRes.error;
      if (areasRes.error) throw areasRes.error;

      setZones(zonesRes.data || []);
      setAreas(areasRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load delivery zones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddArea = async () => {
    if (!newAreaName.trim() || !newAreaZone) {
      toast({
        title: 'Missing Information',
        description: 'Please enter area name and select a zone',
        variant: 'destructive',
      });
      return;
    }

    setAddingArea(true);
    try {
      const { error } = await supabase
        .from('delivery_areas')
        .insert({
          area_name: newAreaName.trim(),
          zone_id: newAreaZone,
          state: 'abuja',
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'Area Added',
        description: `${newAreaName} has been added successfully`,
      });

      setNewAreaName('');
      setNewAreaZone('');
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add area',
        variant: 'destructive',
      });
    } finally {
      setAddingArea(false);
    }
  };

  const handleUpdateAreaZone = async (areaId: string, zoneId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_areas')
        .update({ zone_id: zoneId })
        .eq('id', areaId);

      if (error) throw error;

      setAreas(areas.map(a => 
        a.id === areaId ? { ...a, zone_id: zoneId } : a
      ));

      toast({
        title: 'Zone Updated',
        description: 'Area zone has been updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleAreaActive = async (areaId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('delivery_areas')
        .update({ is_active: isActive })
        .eq('id', areaId);

      if (error) throw error;

      setAreas(areas.map(a => 
        a.id === areaId ? { ...a, is_active: isActive } : a
      ));

      toast({
        title: isActive ? 'Area Enabled' : 'Area Disabled',
        description: `Area has been ${isActive ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">Delivery Zones</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Zones Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {zones.map((zone) => (
            <Card key={zone.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {zone.zone_code}
                  </span>
                  {zone.zone_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {areas.filter(a => a.zone_id === zone.id).length} areas
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Areas Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Delivery Areas</CardTitle>
                <CardDescription>Manage areas and their zone assignments</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Area
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Delivery Area</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="areaName">Area Name</Label>
                      <Input
                        id="areaName"
                        placeholder="e.g., Apo, Gudu, Durumi"
                        value={newAreaName}
                        onChange={(e) => setNewAreaName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zone">Delivery Zone</Label>
                      <Select value={newAreaZone} onValueChange={setNewAreaZone}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.id}>
                              Zone {zone.zone_code} - {zone.zone_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleAddArea} 
                      disabled={addingArea}
                      className="w-full"
                    >
                      {addingArea ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Add Area
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areas.map((area) => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium">{area.area_name}</TableCell>
                      <TableCell className="capitalize">{area.state}</TableCell>
                      <TableCell>
                        <Select 
                          value={area.zone_id || ''} 
                          onValueChange={(value) => handleUpdateAreaZone(area.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Assign zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.map((zone) => (
                              <SelectItem key={zone.id} value={zone.id}>
                                Zone {zone.zone_code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={area.is_active ? 'default' : 'secondary'}>
                          {area.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={area.is_active}
                          onCheckedChange={(checked) => handleToggleAreaActive(area.id, checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}