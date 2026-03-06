import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Search, Package } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { getAvailabilityStatus, getAvailabilityColor } from '@/types';

interface Product {
  id: string; name: string; price: number; category: string;
  available_quantity: number; is_active: boolean; created_at: string;
  farmer_profiles: { farm_name: string; verification_status: string; };
}

export default function AdminProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('id, name, price, category, available_quantity, is_active, created_at, farmer_profiles (farm_name, verification_status)').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts((data || []) as unknown as Product[]);
    } catch { toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' }); } finally { setLoading(false); }
  };

  const toggleProductActive = async (productId: string, currentState: boolean) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: !currentState }).eq('id', productId);
      if (error) throw error;
      setProducts(products.map(p => p.id === productId ? { ...p, is_active: !currentState } : p));
      toast({ title: 'Product Updated' });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()) || p.farmer_profiles?.farm_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card"><div className="container mx-auto px-4 py-4 flex items-center gap-4"><Link to="/admin"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link><Package className="h-6 w-6 text-primary" /><span className="text-xl font-bold text-primary">All Products</span></div></header>
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader><div className="flex flex-col sm:flex-row justify-between gap-4"><div><CardTitle>Product Management</CardTitle><CardDescription>{products.length} total products</CardDescription></div><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Farm</TableHead><TableHead>Category</TableHead><TableHead>Price</TableHead><TableHead>Availability</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(p => {
                    const avail = getAvailabilityStatus(p.available_quantity);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell><p className="font-medium">{p.farmer_profiles?.farm_name}</p><Badge variant={p.farmer_profiles?.verification_status === 'approved' ? 'default' : 'secondary'} className="text-xs">{p.farmer_profiles?.verification_status}</Badge></TableCell>
                        <TableCell className="capitalize">{p.category}</TableCell>
                        <TableCell>{formatPrice(p.price)}</TableCell>
                        <TableCell><Badge className={getAvailabilityColor(avail)}>{avail}</Badge></TableCell>
                        <TableCell><Switch checked={p.is_active} onCheckedChange={() => toggleProductActive(p.id, p.is_active)} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground">No products found</div>}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
