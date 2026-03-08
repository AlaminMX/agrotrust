import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { BackButton } from '@/components/ui/BackButton';
import { formatPrice, formatDate } from '@/lib/format';
import { formatLocation } from '@/lib/location';
import { getAvailabilityStatus, getAvailabilityColor } from '@/types';
import { MapPin, Calendar, Loader2, MessageCircle, Phone, Mail, Flag, Leaf, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logActivity, getGuestSessionId } from '@/lib/activityLogger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getWhatsAppLink, getCallLink } from '@/lib/phone';

interface FarmerData {
  id: string; farm_name: string; farm_description: string | null; state: string; area: string | null;
  address: string | null; farm_size: string | null; produce_types: string[] | null;
  verification_status: string; verified_at: string | null; created_at: string;
  whatsapp_phone: string | null; secondary_phone: string | null; email: string | null;
  years_of_experience: number | null; user_id: string;
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
        .maybeSingle() as any;

      if (!data) { setLoading(false); return; }
      setFarmer(data as FarmerData);

      if (data.user_id) {
        const { data: profile } = await supabase
          .from('profiles').select('full_name, phone, email')
          .eq('user_id', data.user_id).maybeSingle();
        if (profile) {
          setFarmerName(profile.full_name || data.farm_name || '');
          setFarmerPhone(profile.phone || '');
          setFarmerEmail(data.email || profile.email || '');
        }
      }

      const { data: prods } = await supabase
        .from('products')
        .select('id, name, price, unit, category, image_url, available_quantity, is_negotiable')
        .eq('farmer_id', id).eq('is_active', true)
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

  const whatsappNumber = farmer.whatsapp_phone || farmerPhone;
  const whatsappLink = whatsappNumber ? getWhatsAppLink(whatsappNumber, `Hi, I found your farm "${farmer.farm_name}" on AgroTrust and I'd like to know more.`) : '';
  const callNumber = farmer.secondary_phone || farmerPhone;
  const callLink = callNumber ? getCallLink(callNumber) : '';
  const emailAddr = farmer.email || farmerEmail;

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
      <div className="container py-6 md:py-8">
        <div className="flex items-center gap-2 mb-6">
          <BackButton fallbackPath="/products" />
          <span className="text-sm text-muted-foreground">Back</span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Leaf className="h-8 w-8 md:h-10 md:w-10 text-primary" />
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
                <span className="inline-flex items-center gap-1.5 bg-secondary px-3 py-1 rounded-full text-xs font-medium">
                  <MapPin className="h-3.5 w-3.5" /> {formatLocation(farmer.state, farmer.area)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Joined {formatDate(farmer.created_at)}
                </span>
                {farmer.years_of_experience && <span>{farmer.years_of_experience} years experience</span>}
                {farmer.farm_size && <span>Farm size: {farmer.farm_size}</span>}
              </div>
              {farmer.farm_description && (
                <p className="text-muted-foreground leading-relaxed">{farmer.farm_description}</p>
              )}
              {farmer.produce_types && farmer.produce_types.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {farmer.produce_types.map(t => <Badge key={t} variant="secondary" className="capitalize">{t}</Badge>)}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border">
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                onClick={() => logActivity('contact_farmer_whatsapp', { metadata: { farmerId: farmer.id } })}>
                <Button className="bg-[hsl(var(--whatsapp))] hover:bg-[hsl(var(--whatsapp))]/90 text-primary-foreground gap-2">
                  <MessageCircle className="h-5 w-5" /> WhatsApp
                </Button>
              </a>
            )}
            {callLink && (
              <a href={callLink} onClick={() => logActivity('contact_farmer_call', { metadata: { farmerId: farmer.id } })}>
                <Button variant="outline" className="gap-2"><Phone className="h-5 w-5" /> Call</Button>
              </a>
            )}
            {emailAddr && (
              <a href={`mailto:${emailAddr}?subject=Enquiry from AgroTrust`}>
                <Button variant="outline" className="gap-2"><Mail className="h-5 w-5" /> Email</Button>
              </a>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              This farmer has been verified by the AgroTrust team. Always exercise caution with direct transactions.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Products ({products.length})</h2>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
              <p>This farmer hasn't listed any products yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => {
                const avail = getAvailabilityStatus(p.available_quantity);
                return (
                  <Link key={p.id} to={`/products/id/${p.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover hover:border-primary/20 transition-all duration-200 group">
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                      <img src={p.image_url || '/placeholder.svg'} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                    <div className="p-3 space-y-2">
                      <h3 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold">{formatPrice(p.price)}</span>
                        <span className="text-xs text-muted-foreground">/{p.unit}</span>
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

        <div className="border-t border-border pt-4">
          <button onClick={() => setShowReport(!showReport)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
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
