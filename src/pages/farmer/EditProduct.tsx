import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Upload, CheckCircle2, Leaf, Trash2 } from 'lucide-react';
import { CATEGORIES } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState('');
  const [availableQuantity, setAvailableQuantity] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [listingStatus, setListingStatus] = useState('active');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);
  useEffect(() => { if (user && id) loadProduct(); }, [user, id]);

  const loadProduct = async () => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if (!data) return navigate('/farmer/dashboard');
    setName(data.name); setDescription(data.description || ''); setPrice(data.price.toString());
    setUnit(data.unit); setCategory(data.category);
    setAvailableQuantity(data.available_quantity.toString());
    setIsActive(data.is_active); setIsNegotiable(data.is_negotiable ?? false);
    setListingStatus(data.listing_status || 'active');
    setCurrentImageUrl(data.image_url); setLoading(false);
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('product-images').upload(fileName, file);
    if (error) throw error;
    return supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = currentImageUrl;
      if (productImage) imageUrl = await uploadImage(productImage);
      const { error } = await supabase.from('products').update({
        name, description, price: parseFloat(price), unit, category,
        available_quantity: parseInt(availableQuantity),
        image_url: imageUrl, is_active: isActive, is_negotiable: isNegotiable, listing_status: listingStatus,
      }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Product Updated!' });
      navigate('/farmer/dashboard');
    } catch (error: any) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Product Deleted' });
      navigate('/farmer/dashboard');
    } catch (error: any) {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/farmer/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
          <Leaf className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Edit Product</span>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div><CardTitle>Edit Product</CardTitle><CardDescription>Update your listing</CardDescription></div>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" />Delete</Button></AlertDialogTrigger>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Product?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                  <div><Label htmlFor="isActive" className="font-medium">Active</Label><p className="text-xs text-muted-foreground">{isActive ? 'Visible' : 'Hidden'}</p></div>
                  <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                  <div><Label htmlFor="isNegotiable" className="font-medium">Negotiable</Label></div>
                  <Switch id="isNegotiable" checked={isNegotiable} onCheckedChange={setIsNegotiable} />
                </div>
              </div>
              <div className="space-y-2"><Label>Availability Status</Label><Select value={listingStatus} onValueChange={setListingStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="sold">Sold</SelectItem><SelectItem value="hidden">Hidden</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Product Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Category *</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Unit *</Label><Select value={unit} onValueChange={setUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">Kilogram</SelectItem><SelectItem value="piece">Piece</SelectItem><SelectItem value="bunch">Bunch</SelectItem><SelectItem value="basket">Basket</SelectItem><SelectItem value="bag">Bag</SelectItem><SelectItem value="crate">Crate</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price (₦) *</Label><Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Available Quantity *</Label><Input type="number" min="0" value={availableQuantity} onChange={(e) => setAvailableQuantity(e.target.value)} required /></div>
              </div>
              <div className="space-y-3">
                <Label>Product Image</Label>
                {currentImageUrl && !productImage && <img src={currentImageUrl} alt="Current" className="h-32 w-32 object-cover rounded-xl" />}
                <div className="border-2 border-dashed rounded-xl p-6 text-center transition-colors hover:border-primary/30">
                  {productImage ? <div className="flex items-center justify-center gap-2 text-primary"><CheckCircle2 className="h-5 w-5" /><span className="text-sm">{productImage.name}</span></div> : <div className="text-muted-foreground"><Upload className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Upload new image</p></div>}
                  <Input type="file" accept="image/*" className="mt-4" onChange={(e) => setProductImage(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/farmer/dashboard')}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
