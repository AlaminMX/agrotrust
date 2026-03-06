import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BackButton } from '@/components/ui/BackButton';
import { formatPrice, formatDate } from '@/lib/format';
import { STATES, State, getAvailabilityStatus, getAvailabilityColor } from '@/types';
import { MapPin, Calendar, Loader2, MessageCircle, Phone, Mail, Flag, Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logActivity, getGuestSessionId } from '@/lib/activityLogger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FarmerData {
  id: string; farm_name: string; farm_description: string | null; state: string;
  address: string | null; farm_size: string | null; produce_types: string[] | null;
  verification_status: string; verified_at: string | null; created_at: string;
  whatsapp_phone: string | null; secondary_phone: string | null; years_of_experience: number | null;
  user_id: string;
}

interface ProductData {
  id: string; name: string; price: number; unit: string; category: string;
  image_url: string | null; available_quantity: number; is_negotiable: boolean;
}

export default function FarmerProfile() {
  const { id } = useParams<{ id: string }>();
  const [farmer, setFarmer] = useState<FarmerData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [farmerName, setFarmerName] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [farmerEmail, setFarmerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('suspicious_profile');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchFarmer = async () => {
      const { data } = await supabase
        .from('farmer_profiles_public')
        .select('*')
        .eq('id', id)
        .eq('verification_status', 'approved')
        .maybeSingle();

      if (!data) { setLoading(false); return; }
      setFarmer(data as FarmerData);

      // Get farmer's user profile
      if (data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, email')
          .eq('user_id', data.user_id)
          .maybeSingle();
        if (profile) {
          setFarmerName(profile.full_name || data.farm_name || '');
          setFarmerPhone(profile.phone || '');
          setFarmerEmail(profile.email || '');
        }
      }

      // Get farmer's products
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, price, unit, category, image_url, available_quantity, is_negotiable')
        .eq('farmer_id', id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setProducts(prods || []);
      setLoading(false);
    };
    fetchFarmer();
  }, [id]);

  if (loading) {
    return <Layout><div className="container py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!farmer) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Farmer Not Found</h1>
          <p className="text-muted-foreground mb-6">This farmer profile doesn't exist or hasn't been verified yet.</p>
          <Link to="/products"><Button>Browse Listings</Button></Link>
        </div>
      </Layout>
    );
  }

  const stateLabel = STATES.find(s => s.value === farmer.state)?.label || farmer.state;
  const whatsappNumber = farmer.whatsapp_phone || farmerPhone;
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I found your farm on AgroTrust.`)}` : '';
  const callNumber = farmerPhone || farmer.secondary_phone || '';

  const submitReport = async () => {
    setReporting(true);
    try {
      await supabase.from('listing_reports').insert({
        farmer_profile_id: farmer.id,
        reporter_session_id: getGuestSessionId(),
        reason: reportReason,
        details: reportDetails || null,
      } as any);
      setReportSent(true);
    } finally { setReporting(false); }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-2 mb-6"><BackButton fallbackPath="/products" /><span className="text-sm text-muted-foreground">Back</span></div>

        {/* Farmer Header */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Leaf className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{farmer.farm_name}</h1>
                {farmer.verification_status === 'approved' && <VerifiedBadge size="md" />}
              </div>
              {farmerName && farmerName !== farmer.farm_name && (
                <p className="text-muted-foreground">by {farmerName}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {stateLabel}{farmer.address && `, ${farmer.address}`}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined {formatDate(farmer.created_at)}</span>
                {farmer.years_of_experience && <span>{farmer.years_of_experience} years experience</span>}
                {farmer.farm_size && <span>Farm size: {farmer.farm_size}</span>}
              </div>
              {farmer.farm_description && <p className="text-muted-foreground mt-2">{farmer.farm_description}</p>}
              {farmer.produce_types && farmer.produce_types.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {farmer.produce_types.map(t => <Badge key={t} variant="secondary" className="capitalize">{t}</Badge>)}
                </div>
              )}
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border">
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={() => logActivity('contact_farmer_whatsapp', { metadata: { farmerId: farmer.id } })}>
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2"><MessageCircle className="h-5 w-5" /> WhatsApp</Button>
              </a>
            )}
            {callNumber && (
              <a href={`tel:${callNumber}`} onClick={() => logActivity('contact_farmer_call', { metadata: { farmerId: farmer.id } })}>
                <Button variant="outline" className="gap-2"><Phone className="h-5 w-5" /> Call</Button>
              </a>
            )}
            {farmerEmail && (
              <a href={`mailto:${farmerEmail}?subject=Enquiry from AgroTrust`}>
                <Button variant="outline" className="gap-2"><Mail className="h-5 w-5" /> Email</Button>
              </a>
            )}
          </div>
        </div>

        {/* Product Catalog */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Products ({products.length})</h2>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border rounded-xl">
              <p>This farmer hasn't listed any products yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => {
                const avail = getAvailabilityStatus(p.available_quantity);
                return (
                  <Link key={p.id} to={`/products/id/${p.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                      <img src={p.image_url || '/placeholder.svg'} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-medium text-foreground line-clamp-1">{p.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold">{formatPrice(p.price)}</span>
                        <span className="text-sm text-muted-foreground">/{p.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getAvailabilityColor(avail)} text-xs`}>{avail}</Badge>
                        {p.is_negotiable && <Badge variant="outline" className="text-xs">Negotiable</Badge>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Report */}
        <div className="border-t border-border pt-4">
          <button onClick={() => setShowReport(!showReport)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <Flag className="h-4 w-4" /> Report this farmer
          </button>
          {showReport && (
            <div className="mt-3 space-y-3 max-w-md">
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="suspicious_profile">Suspicious profile</SelectItem>
                  <SelectItem value="fake_farmer">Fake farmer</SelectItem>
                  <SelectItem value="abusive_behavior">Abusive behavior</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
    </Layout>
  );
}
