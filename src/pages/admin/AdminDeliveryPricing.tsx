import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, DollarSign, Save } from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface Zone {
  id: string;
  zone_code: string;
  zone_name: string;
}

interface Pricing {
  id: string;
  from_zone_id: string;
  to_zone_id: string;
  weight_category: string;
  price: number;
  is_active: boolean;
}

interface PricingMatrix {
  [key: string]: {
    light: Pricing | null;
    medium: Pricing | null;
    heavy: Pricing | null;
  };
}

export default function AdminDeliveryPricing() {
  const { toast } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [zonesRes, pricingRes] = await Promise.all([
        supabase.from('delivery_zones').select('*').order('zone_code'),
        supabase.from('delivery_pricing').select('*'),
      ]);

      if (zonesRes.error) throw zonesRes.error;
      if (pricingRes.error) throw pricingRes.error;

      setZones(zonesRes.data || []);
      setPricing(pricingRes.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load pricing data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPricingMatrix = (): PricingMatrix => {
    const matrix: PricingMatrix = {};
    
    zones.forEach(fromZone => {
      zones.forEach(toZone => {
        const key = `${fromZone.id}-${toZone.id}`;
        matrix[key] = {
          light: pricing.find(p => p.from_zone_id === fromZone.id && p.to_zone_id === toZone.id && p.weight_category === 'light') || null,
          medium: pricing.find(p => p.from_zone_id === fromZone.id && p.to_zone_id === toZone.id && p.weight_category === 'medium') || null,
          heavy: pricing.find(p => p.from_zone_id === fromZone.id && p.to_zone_id === toZone.id && p.weight_category === 'heavy') || null,
        };
      });
    });

    return matrix;
  };

  const handlePriceChange = (pricingId: string, value: string) => {
    setEditedPrices(prev => ({
      ...prev,
      [pricingId]: parseFloat(value) || 0,
    }));
  };

  const handleSavePrice = async (pricingId: string) => {
    const newPrice = editedPrices[pricingId];
    if (newPrice === undefined) return;

    setSaving(pricingId);
    try {
      const { error } = await supabase
        .from('delivery_pricing')
        .update({ price: newPrice })
        .eq('id', pricingId);

      if (error) throw error;

      setPricing(pricing.map(p => 
        p.id === pricingId ? { ...p, price: newPrice } : p
      ));

      setEditedPrices(prev => {
        const { [pricingId]: _, ...rest } = prev;
        return rest;
      });

      toast({
        title: 'Price Updated',
        description: 'Delivery price has been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const matrix = getPricingMatrix();

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
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">Delivery Pricing</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Weight Category Legend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Weight Categories</CardTitle>
            <CardDescription>Pricing is based on total order weight</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Light</Badge>
                <span className="text-sm text-muted-foreground">0 - 2 kg</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>
                <span className="text-sm text-muted-foreground">2 - 5 kg</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Heavy</Badge>
                <span className="text-sm text-muted-foreground">5+ kg</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Zone-to-Zone Pricing Matrix</CardTitle>
            <CardDescription>Edit prices for each zone combination and weight category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Route</TableHead>
                    <TableHead className="text-center">Light (₦)</TableHead>
                    <TableHead className="text-center">Medium (₦)</TableHead>
                    <TableHead className="text-center">Heavy (₦)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map(fromZone => (
                    zones.map(toZone => {
                      const key = `${fromZone.id}-${toZone.id}`;
                      const prices = matrix[key];
                      
                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">
                            <span className="text-primary">{fromZone.zone_code}</span>
                            <span className="mx-1">→</span>
                            <span className="text-primary">{toZone.zone_code}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({fromZone.zone_name.split(' ')[0]} to {toZone.zone_name.split(' ')[0]})
                            </span>
                          </TableCell>
                          {(['light', 'medium', 'heavy'] as const).map(category => {
                            const priceData = prices?.[category];
                            if (!priceData) return <TableCell key={category}>-</TableCell>;
                            
                            const hasEdit = editedPrices[priceData.id] !== undefined;
                            const currentValue = hasEdit ? editedPrices[priceData.id] : priceData.price;
                            
                            return (
                              <TableCell key={category}>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={currentValue}
                                    onChange={(e) => handlePriceChange(priceData.id, e.target.value)}
                                    className="w-24 text-right"
                                    min="0"
                                  />
                                  {hasEdit && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleSavePrice(priceData.id)}
                                      disabled={saving === priceData.id}
                                    >
                                      {saving === priceData.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Save className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })
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