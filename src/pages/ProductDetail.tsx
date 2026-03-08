import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BackButton } from '@/components/ui/BackButton';
import { formatPrice, formatDate } from '@/lib/format';
import { formatLocation } from '@/lib/location';
import { STATES, Product, State, getAvailabilityStatus, getAvailabilityColor } from '@/types';
import { MapPin, Calendar, Loader2, MessageCircle, Phone, Mail, Flag, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logActivity, getGuestSessionId } from '@/lib/activityLogger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getWhatsAppLink, getCallLink } from '@/lib/phone';

interface FarmerProfile {
  id: string; farm_name: string; state: string; area: string | null; verification_status: string;
  farm_description: string | null; user_id: string; created_at: string;
  whatsapp_phone: string | null; secondary_phone: string | null; email: string | null;
  years_of_experience: number | null; farm_size: string | null; address: string | null;
  full_name?: string; avatar_url?: string; phone?: string; profile_email?: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<(Product & { area?: string | null }) | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [reportReason, setReportReason] = useState('scam_or_fake');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) { setLoading(false); return; }
      setLoading(true);
      try {
        const { data: productData, error } = await supabase
          .from('products')
          .select('id, name, description, price, unit, category, image_url, available_quantity, state, farmer_id, is_negotiable, listing_status, area')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!productData) { setLoading(false); return; }
        setIsNegotiable(productData.is_negotiable);

        const { data: farmerData } = await supabase
          .from('farmer_profiles_public')
          .select('id, farm_name, state, verification_status, farm_description, user_id, created_at, whatsapp_phone, secondary_phone, years_of_experience, farm_size, address, area, email') as any;

        const matchedFarmer = (farmerData || []).find((f: any) => f.id === productData.farmer_id);
        
        let farmerName = matchedFarmer?.farm_name || 'Unknown Farm';
        let farmerAvatar = '';
        let farmerPhone = '';
        let profileEmail = '';

        if (matchedFarmer?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles').select('full_name, avatar_url, phone, email')
            .eq('user_id', matchedFarmer.user_id).maybeSingle();
          if (profileData) {
            farmerName = profileData.full_name || matchedFarmer.farm_name || 'Unknown';
            farmerAvatar = profileData.avatar_url || '';
            farmerPhone = profileData.phone || '';
            profileEmail = profileData.email || '';
          }
        }

        const transformedProduct: Product & { area?: string | null } = {
          id: productData.id, name: productData.name, description: productData.description || '',
          price: productData.price, unit: productData.unit, category: productData.category,
          image: productData.image_url || '/placeholder.svg',
          farmerId: matchedFarmer?.id || productData.farmer_id,
          farmerName, farmName: matchedFarmer?.farm_name || 'Unknown Farm',
          state: (productData.state || matchedFarmer?.state || 'kaduna') as State,
          area: productData.area || matchedFarmer?.area || null,
          available: productData.available_quantity,
          isVerified: matchedFarmer?.verification_status === 'approved',
        };

        setProduct(transformedProduct);
        logActivity('product_view', { productId: productData.id, state: productData.state || matchedFarmer?.state || undefined });

        if (matchedFarmer) {
          setFarmer({
            ...matchedFarmer,
            full_name: farmerName,
            avatar_url: farmerAvatar,
            phone: farmerPhone,
            profile_email: profileEmail,
          } as FarmerProfile);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} in ${formatLocation(product.state, product.area)} | AgroTrust`;
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

  const whatsappNumber = farmer?.whatsapp_phone || farmer?.phone || '';
  const whatsappMessage = `Hi, I saw your "${product.name}" listing on AgroTrust and I'd like to make an inquiry. Is it still available?`;
  const whatsappLink = whatsappNumber ? getWhatsAppLink(whatsappNumber, whatsappMessage) : '';
  const callNumber = farmer?.secondary_phone || farmer?.phone || '';
  const callLink = callNumber ? getCallLink(callNumber) : '';
  const farmerEmailAddr = farmer?.email || farmer?.profile_email || '';
  const availabilityStatus = getAvailabilityStatus(product.available);
  const availabilityColor = getAvailabilityColor(availabilityStatus);

  const submitReport = async () => {
    if (!product) return;
    setReporting(true);
    try {
      await supabase.from('listing_reports').insert({
        product_id: product.id,
        reporter_session_id: getGuestSessionId(),
        reason: reportReason,
        details: reportDetails || null,
      } as any);
      await logActivity('listing_reported', { productId: product.id, state: product.state, metadata: { reason: reportReason } });
      setReportSent(true);
      setReportDetails('');
    } finally {
      setReporting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <BackButton fallbackPath="/products" />
          <span>Back to Listings</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Link to={`/farmers/${product.farmerId}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {product.farmName}
              </Link>
              {product.isVerified && <VerifiedBadge size="sm" />}
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{product.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  <MapPin className="h-3.5 w-3.5" /> {formatLocation(product.state, product.area)}
                </span>
                <Badge className={availabilityColor}>{availabilityStatus}</Badge>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
              <span className="text-lg text-muted-foreground">per {product.unit}</span>
              {isNegotiable && (
                <span className="ml-2 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-sm font-medium">Negotiable</span>
              )}
            </div>

            {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-medium text-foreground">{product.available} {product.unit}s</span>
            </div>

            {/* Contact Buttons */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="font-semibold text-foreground">Contact Farmer</h3>
              <div className="flex gap-3 flex-wrap">
                {whatsappLink && (
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[120px]"
                    onClick={() => logActivity('contact_farmer_whatsapp', { productId: product.id, state: product.state })}>
                    <Button size="lg" className="w-full bg-[hsl(var(--whatsapp))] hover:bg-[hsl(var(--whatsapp))]/90 text-primary-foreground gap-2">
                      <MessageCircle className="h-5 w-5" /> WhatsApp
                    </Button>
                  </a>
                )}
                {callLink && (
                  <a href={callLink} className="flex-1 min-w-[120px]"
                    onClick={() => logActivity('contact_farmer_call', { productId: product.id, state: product.state })}>
                    <Button size="lg" variant="outline" className="w-full gap-2">
                      <Phone className="h-5 w-5" /> Call
                    </Button>
                  </a>
                )}
                {farmerEmailAddr && (
                  <a href={`mailto:${farmerEmailAddr}?subject=Inquiry about ${product.name} on AgroTrust`} className="flex-1 min-w-[120px]">
                    <Button size="lg" variant="outline" className="w-full gap-2">
                      <Mail className="h-5 w-5" /> Email
                    </Button>
                  </a>
                )}
              </div>
              {!whatsappLink && !callLink && !farmerEmailAddr && (
                <p className="text-sm text-muted-foreground">Contact details not available yet.</p>
              )}
            </div>

            {/* Farmer Info */}
            {farmer && (
              <div className="border-t border-border pt-5">
                <h3 className="font-semibold text-foreground mb-4">About the Farmer</h3>
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {farmer.avatar_url ? (
                      <img src={farmer.avatar_url} alt={farmer.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-primary">
                        {(farmer.full_name || farmer.farm_name).charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{farmer.full_name || farmer.farm_name}</span>
                      {farmer.verification_status === 'approved' && <VerifiedBadge size="sm" showText={false} />}
                    </div>
                    <p className="text-sm text-muted-foreground">{farmer.farm_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{formatLocation(farmer.state, farmer.area)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />Since {formatDate(farmer.created_at)}
                      </span>
                    </div>
                    <Link to={`/farmers/${farmer.id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1">
                      <ExternalLink className="h-3 w-3" /> View full profile
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Report */}
            <div className="border-t border-border pt-4">
              <button onClick={() => setShowReport(!showReport)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                <Flag className="h-4 w-4" /> Report this listing
              </button>
              {showReport && (
                <div className="mt-3 space-y-3">
                  <Select value={reportReason} onValueChange={setReportReason}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scam_or_fake">Scam or fake listing</SelectItem>
                      <SelectItem value="wrong_state">Wrong location</SelectItem>
                      <SelectItem value="misleading_media">Misleading photo or details</SelectItem>
                      <SelectItem value="abusive_content">Abusive content</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Describe the issue (optional)" rows={3} />
                  <Button variant="outline" size="sm" onClick={submitReport} disabled={reporting || reportSent}>
                    {reportSent ? 'Report submitted' : reporting ? 'Submitting...' : 'Submit report'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
