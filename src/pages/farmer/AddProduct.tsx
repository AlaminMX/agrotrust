import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, ArrowLeft, CheckCircle2, Leaf, ImageIcon, AlertCircle } from 'lucide-react';
import { CATEGORIES } from '@/types';
import { AreaInput } from '@/components/ui/AreaInput';
import { cn } from '@/lib/utils';

export default function AddProduct() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [farmerProfile, setFarmerProfile] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState('');
  const [availableQuantity, setAvailableQuantity] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [area, setArea] = useState('');

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);
  useEffect(() => { if (user) loadFarmerProfile(); }, [user]);

  const loadFarmerProfile = async () => {
    const { data } = await supabase.from('farmer_profiles').select('*').eq('user_id', user!.id).maybeSingle();
    if (!data || data.verification_status !== 'approved') { navigate('/farmer/onboarding'); return; }
    setFarmerProfile(data);
    setArea((data as any).area || '');
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file); setImageError(false);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
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
    if (!productImage) { setImageError(true); toast({ title: 'Image Required', description: 'Please upload a product image.', variant: 'destructive' }); return; }
    if (!farmerProfile) return;
    setIsSubmitting(true);
    try {
      const imageUrl = await uploadImage(productImage);
      const { error } = await supabase.from('products').insert({
        farmer_id: farmerProfile.id, name, description, price: parseFloat(price),
        unit, category, available_quantity: parseInt(availableQuantity),
        image_url: imageUrl, is_active: true, is_negotiable: isNegotiable,
        listing_status: 'active', state: farmerProfile.state,
      } as any);
      if (error) throw error;
      toast({ title: 'Product Added!', description: 'Your product is now live.' });
      navigate('/farmer/dashboard');
    } catch (error: any) {
      toast({ title: 'Failed to add product', description: error.message, variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/farmer/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
          <Leaf className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Add Product</span>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
            <CardDescription>List a product for buyers to discover</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <Label>Product Image <span className="text-destructive">*</span></Label>
                <div className={cn("border-2 border-dashed rounded-xl p-6 text-center transition-colors", imageError && !productImage ? "border-destructive bg-destructive/5" : "border-border hover:border-primary/30", productImage && "border-primary bg-primary/5")}>
                  {imagePreview ? (
                    <div className="space-y-4"><img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" /><div className="flex items-center justify-center gap-2 text-primary"><CheckCircle2 className="h-5 w-5" /><span className="text-sm">{productImage?.name}</span></div></div>
                  ) : imageError ? (
                    <div className="text-destructive"><AlertCircle className="h-8 w-8 mx-auto mb-2" /><p className="font-medium text-sm">Image is required</p></div>
                  ) : (
                    <div className="text-muted-foreground"><ImageIcon className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Upload product image</p></div>
                  )}
                  <Input type="file" accept="image/*" className="mt-4" onChange={handleImageChange} />
                </div>
              </div>
              <div className="space-y-2"><Label>Product Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Fresh Tomatoes" required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Category *</Label><Select value={category} onValueChange={setCategory} required><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Unit *</Label><Select value={unit} onValueChange={setUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kg">Kilogram (kg)</SelectItem><SelectItem value="piece">Piece</SelectItem><SelectItem value="bunch">Bunch</SelectItem><SelectItem value="basket">Basket</SelectItem><SelectItem value="bag">Bag</SelectItem><SelectItem value="crate">Crate</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Price (₦) *</Label><Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Available Quantity *</Label><Input type="number" min="1" value={availableQuantity} onChange={(e) => setAvailableQuantity(e.target.value)} required /></div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div><Label htmlFor="isNegotiable" className="font-medium">Price Negotiable</Label><p className="text-xs text-muted-foreground">Allow buyers to negotiate</p></div>
                <Switch id="isNegotiable" checked={isNegotiable} onCheckedChange={setIsNegotiable} />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/farmer/dashboard')}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !productImage} className="flex-1">{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : 'Add Product'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
