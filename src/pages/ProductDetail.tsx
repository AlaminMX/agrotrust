import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BackButton } from '@/components/ui/BackButton';
import { formatPrice, formatDate } from '@/lib/format';
import { STATES, Product, State } from '@/types';
import { Star, MapPin, Calendar, Loader2, MessageCircle, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProductReviews } from '@/components/reviews/ProductReviews';
import { supabase } from '@/integrations/supabase/client';
import { logActivity, getGuestSessionId } from '@/lib/activityLogger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface DatabaseProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  image_url: string | null;
  available_quantity: number;
  average_rating: number | null;
  review_count: number | null;
  state: string | null;
  farmer_id: string;
  is_negotiable: boolean;
  listing_status: string;
  slug: string | null;
}

interface FarmerProfile {
  id: string;
  farm_name: string;
  state: string;
  verification_status: string;
  farm_description: string | null;
  user_id: string;
  created_at: string;
  whatsapp_phone: string | null;
  secondary_phone: string | null;
  years_of_experience: number | null;
  farm_size: string | null;
  address: string | null;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
}

const ProductDetail = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string; state?: string }>();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [reportReason, setReportReason] = useState('scam_or_fake');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id && !slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const query = supabase.from('products').select('*');
        const { data: productData, error: productError } = slug
          ? await query.eq('slug', slug).maybeSingle()
          : await query.eq('id', id).maybeSingle();

        if (productError) throw productError;
        if (!productData) { setLoading(false); return; }
        
        const dbProduct = productData as DatabaseProduct;
        setIsNegotiable(dbProduct.is_negotiable);
        
        const { data: farmerData } = await supabase
          .from('farmer_profiles_public')
          .select('id, farm_name, state, verification_status, farm_description, user_id, created_at, whatsapp_phone, secondary_phone, years_of_experience, farm_size, address')
          .eq('id', dbProduct.farmer_id)
          .maybeSingle();

        let farmerName = farmerData?.farm_name || 'Unknown Farm';
        let farmerAvatar = '';
        let farmerPhone = '';
        
        if (farmerData?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, phone')
            .eq('user_id', farmerData.user_id)
            .maybeSingle();
          
          if (profileData) {
            farmerName = profileData.full_name || farmerData.farm_name;
            farmerAvatar = profileData.avatar_url || '';
            farmerPhone = profileData.phone || '';
          }
        }
        
        const transformedProduct: Product = {
          id: dbProduct.id, name: dbProduct.name, description: dbProduct.description || '',
          price: dbProduct.price, unit: dbProduct.unit, category: dbProduct.category,
          image: dbProduct.image_url || '/placeholder.svg',
          farmerId: farmerData?.id || dbProduct.farmer_id,
          farmerName, farmName: farmerData?.farm_name || 'Unknown Farm',
          state: (dbProduct.state || farmerData?.state || 'kaduna') as State,
          available: dbProduct.available_quantity,
          isVerified: farmerData?.verification_status === 'approved',
          rating: dbProduct.average_rating || 0, reviewCount: dbProduct.review_count || 0,
        };
        
        setProduct(transformedProduct);
        logActivity('product_view', { productId: dbProduct.id, state: dbProduct.state || farmerData?.state || undefined, metadata: { slug: dbProduct.slug } });
        
        if (farmerData) {
          setFarmer({
            ...farmerData,
            full_name: farmerName,
            avatar_url: farmerAvatar,
            phone: farmerPhone,
          } as FarmerProfile);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, slug]);

  useEffect(() => {
    if (!product) return;
    const resolvedStateLabel = STATES.find(s => s.value === product.state)?.label || product.state;
    document.title = `${product.name} in ${resolvedStateLabel} | AgroTrust`;
  }, [product]);

  if (loading) {
    return <Layout><div className="container py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Listing Not Found</h1>
          <p className="text-muted-foreground mb-6">This listing doesn't exist or has been removed.</p>
          <Link to="/products"><Button>Browse Listings</Button></Link>
        </div>
      </Layout>
    );
  }

  const stateLabel = STATES.find(s => s.value === product.state)?.label || product.state;
  const whatsappNumber = farmer?.whatsapp_phone || farmer?.phone || '';
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in your listing: ${product.name}`)}` : '';
  const callNumber = farmer?.phone || farmer?.secondary_phone || '';

  const submitReport = async () => {
    if (!product) return;
    setReporting(true);
    try {
      await supabase.from('listing_reports' as never).insert({
        product_id: product.id,
        reporter_session_id: getGuestSessionId(),
        reason: reportReason,
        details: reportDetails || null,
      } as never);
      await logActivity('listing_reported', { productId: product.id, state: product.state, metadata: { reason: reportReason } });
      setReportSent(true);
      setReportDetails('');
    } finally {
      setReporting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <BackButton fallbackPath="/products" />
          <span>Back to Listings</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-earth">{product.farmName}</span>
              {product.isVerified && <VerifiedBadge size="sm" />}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{stateLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'fill-gold text-gold' : 'fill-muted text-muted'}`} />
                ))}
              </div>
              <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
              <span className="text-lg text-muted-foreground">per {product.unit}</span>
              {isNegotiable && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-medium">Negotiable</span>
              )}
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-medium text-foreground">{product.available} {product.unit}s</span>
            </div>

            {/* Contact Farmer Buttons */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground">Contact Farmer</h3>
              <div className="flex gap-3">
                {whatsappLink && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1" onClick={() => logActivity('contact_farmer_whatsapp', { productId: product.id, state: product.state })}>
                    <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp
                    </Button>
                  </a>
                )}
                {callNumber && (
                  <a href={`tel:${callNumber}`} className="flex-1" onClick={() => logActivity('contact_farmer_call', { productId: product.id, state: product.state })}>
                    <Button size="lg" variant="outline" className="w-full gap-2">
                      <Phone className="h-5 w-5" />
                      Call
                    </Button>
                  </a>
                )}
              </div>
              {!whatsappLink && !callNumber && (
                <p className="text-sm text-muted-foreground">Contact details not available. The farmer has not provided contact information yet.</p>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground">Report this listing</h3>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scam_or_fake">Scam or fake listing</SelectItem>
                  <SelectItem value="wrong_state">Wrong state/location</SelectItem>
                  <SelectItem value="misleading_media">Misleading photo or details</SelectItem>
                  <SelectItem value="abusive_content">Abusive/inappropriate content</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe the issue (optional)"
                rows={3}
              />
              <Button variant="outline" onClick={submitReport} disabled={reporting || reportSent}>
                {reportSent ? 'Report submitted' : reporting ? 'Submitting...' : 'Submit report'}
              </Button>
            </div>

            {/* Farmer Info */}
            {farmer && (
              <div className="border-t border-border pt-6 mt-6">
                <h3 className="font-semibold text-foreground mb-4">About the Farmer</h3>
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {farmer.avatar_url ? (
                      <img src={farmer.avatar_url} alt={farmer.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {(farmer.full_name || farmer.farm_name).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{farmer.full_name || farmer.farm_name}</span>
                      {farmer.verification_status === 'approved' && <VerifiedBadge size="sm" showText={false} />}
                    </div>
                    <p className="text-sm text-earth font-medium">{farmer.farm_name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{STATES.find(s => s.value === farmer.state)?.label || farmer.state}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Member since {formatDate(farmer.created_at)}</span>
                      {farmer.years_of_experience && <span>{farmer.years_of_experience} years experience</span>}
                      {farmer.farm_size && <span>Farm size: {farmer.farm_size}</span>}
                    </div>
                  </div>
                </div>
                {farmer.farm_description && (
                  <p className="text-sm text-muted-foreground mt-4">{farmer.farm_description}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <ProductReviews productId={product.id} />
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
