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
import { Loader2, ArrowLeft, Upload, CheckCircle2, Leaf, ImageIcon, AlertCircle } from 'lucide-react';
import { CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/imageCompression';

export default function AddProduct() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [farmerProfile, setFarmerProfile] = useState<{ id: string; state: string; verification_status?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
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
  const [listingStatus, setListingStatus] = useState('published');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadFarmerProfile();
    }
  }, [user]);

  const loadFarmerProfile = async () => {
    const { data } = await supabase
      .from('farmer_profiles')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    
    if (!data || data.verification_status !== 'approved') {
      navigate('/farmer/onboarding');
      return;
    }
    
    setFarmerProfile(data);
    setLoading(false);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setProductImage(compressed);
      setImageError(false);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate image is required
    if (!productImage) {
      setImageError(true);
      toast({
        title: 'Image Required',
        description: 'Please upload a product image before submitting.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!farmerProfile) return;
    
    setIsSubmitting(true);
    
    try {
      const imageUrl = await uploadImage(productImage);
      
      const salePrice = parseFloat(price);

      const { error } = await supabase
        .from('products')
        .insert({
          farmer_id: farmerProfile.id,
          name,
          description,
          price: salePrice,
          unit,
          category,
          available_quantity: parseInt(availableQuantity),
          availability_status: availabilityStatus,
          image_url: imageUrl,
          is_active: listingStatus === 'published',
          is_negotiable: isNegotiable,
          listing_status: listingStatus,
          state: farmerProfile.state,
        });
      
      if (error) throw error;
      
      toast({
        title: 'Product Added!',
        description: 'Your product is now live and visible to customers.',
      });
      
      navigate('/farmer/dashboard');
      
    } catch (error: unknown) {
      toast({
        title: 'Failed to add product',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/farmer/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">Add Product</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
            <CardDescription>List a new product for customers to purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Image - Required and Prominent */}
              <div className="space-y-3">
                <Label className="flex items-center gap-1">
                  Product Image <span className="text-destructive">*</span>
                </Label>
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    imageError && !productImage ? "border-destructive bg-destructive/5" : "border-border",
                    productImage && "border-primary bg-primary/5"
                  )}
                >
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="Product preview" 
                        className="max-h-48 mx-auto rounded-lg object-cover"
                      />
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>{productImage?.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "text-muted-foreground",
                      imageError && "text-destructive"
                    )}>
                      {imageError ? (
                        <>
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p className="font-medium">Image is required!</p>
                          <p className="text-sm">Please upload a product image</p>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                          <p className="font-medium">Upload product image</p>
                          <p className="text-sm">Required before you can add the product</p>
                        </>
                      )}
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    className="mt-4"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Fresh Tomatoes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product, quality, freshness, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">Listing State *</Label>
                  <Input
                    id="state"
                    value={farmerProfile?.state || ''}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">State is locked to your verified farmer profile.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="bunch">Bunch</SelectItem>
                      <SelectItem value="basket">Basket</SelectItem>
                      <SelectItem value="bag">Bag</SelectItem>
                      <SelectItem value="crate">Crate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="listingStatus">Listing Status</Label>
                  <Select value={listingStatus} onValueChange={setListingStatus}>
                    <SelectTrigger id="listingStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="isNegotiable" className="font-medium">Price Negotiable</Label>
                    <p className="text-xs text-muted-foreground">Allow buyers to request price negotiation</p>
                  </div>
                  <Switch id="isNegotiable" checked={isNegotiable} onCheckedChange={setIsNegotiable} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Sale Price (₦) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price (₦)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Leave blank if no discount"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Set higher than sale price for discount</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Available Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    value={availableQuantity}
                    onChange={(e) => setAvailableQuantity(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight per Unit (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g., 1.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Used for delivery fee calculation</p>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/farmer/dashboard')}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !productImage} 
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Product...
                    </>
                  ) : (
                    'Add Product'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
