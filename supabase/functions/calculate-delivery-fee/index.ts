import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Weight category thresholds
const getWeightCategory = (weightKg: number): string => {
  if (weightKg <= 2) return 'light';
  if (weightKg <= 5) return 'medium';
  return 'heavy';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { fromAreaId, toAreaId, totalWeightKg } = await req.json();

    console.log(`Calculating delivery fee: from ${fromAreaId} to ${toAreaId}, weight: ${totalWeightKg}kg`);

    // Get zones for both areas
    const { data: areas, error: areasError } = await supabase
      .from('delivery_areas')
      .select('id, area_name, zone_id')
      .in('id', [fromAreaId, toAreaId]);

    if (areasError || !areas || areas.length < 2) {
      console.error('Error fetching areas:', areasError);
      // Return default fee if areas not found
      return new Response(
        JSON.stringify({ 
          success: true, 
          deliveryFee: 2000,
          weightCategory: getWeightCategory(totalWeightKg || 1),
          message: 'Default fee applied - areas not found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fromArea = areas.find(a => a.id === fromAreaId);
    const toArea = areas.find(a => a.id === toAreaId);

    if (!fromArea?.zone_id || !toArea?.zone_id) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          deliveryFee: 2000,
          weightCategory: getWeightCategory(totalWeightKg || 1),
          message: 'Default fee applied - zones not assigned'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weightCategory = getWeightCategory(totalWeightKg || 1);

    // Get pricing for this zone combination
    const { data: pricing, error: pricingError } = await supabase
      .from('delivery_pricing')
      .select('price')
      .eq('from_zone_id', fromArea.zone_id)
      .eq('to_zone_id', toArea.zone_id)
      .eq('weight_category', weightCategory)
      .eq('is_active', true)
      .maybeSingle();

    if (pricingError) {
      console.error('Error fetching pricing:', pricingError);
    }

    const deliveryFee = pricing?.price || 2000; // Default fallback

    console.log(`Delivery fee calculated: ₦${deliveryFee} for ${weightCategory} category`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deliveryFee,
        weightCategory,
        fromZoneId: fromArea.zone_id,
        toZoneId: toArea.zone_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in calculate-delivery-fee function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, deliveryFee: 2000 }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});