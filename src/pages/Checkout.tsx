import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/ui/BackButton';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/format';
import { STATES } from '@/types';
import { Shield, CreditCard, Loader2, MapPin, Check, Store, Truck, Package, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SavedAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  is_default: boolean;
}

interface FarmerInfo {
  id: string;
  farm_name: string;
  allows_pickup: boolean;
  address: string | null;
  state: string;
  phone?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { 
    items, 
    selectedState, 
    subtotal, 
    total, 
    clearCart,
    itemsByFarmer,
    farmerCount,
    getDeliveryFeePerFarmer,
    getTotalDeliveryFee,
  } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [farmerInfoMap, setFarmerInfoMap] = useState<Record<string, FarmerInfo>>({});
  const [deliveryMethods, setDeliveryMethods] = useState<Record<string, 'delivery' | 'pickup'>>({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  const stateLabel = STATES.find(s => s.value === selectedState)?.label || selectedState;
  const deliveryFeePerFarmer = getDeliveryFeePerFarmer();

  // Calculate total delivery fee considering pickup selections
  const calculateTotalDeliveryFee = () => {
    let total = 0;
    for (const group of itemsByFarmer) {
      if (deliveryMethods[group.farmerId] !== 'pickup') {
        total += deliveryFeePerFarmer;
      }
    }
    return total;
  };

  const totalDeliveryFee = calculateTotalDeliveryFee();
  const adjustedTotal = subtotal + totalDeliveryFee;

  // Fetch saved addresses and farmer info
  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchFarmerInfo();
    }
  }, [user, itemsByFarmer]);

  // Initialize delivery methods to 'delivery' for all farmers
  useEffect(() => {
    const methods: Record<string, 'delivery' | 'pickup'> = {};
    itemsByFarmer.forEach(group => {
      if (!deliveryMethods[group.farmerId]) {
        methods[group.farmerId] = 'delivery';
      }
    });
    if (Object.keys(methods).length > 0) {
      setDeliveryMethods(prev => ({ ...prev, ...methods }));
    }
  }, [itemsByFarmer]);

  const fetchFarmerInfo = async () => {
    const farmerIds = itemsByFarmer.map(g => g.farmerId);
    if (farmerIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('id, farm_name, allows_pickup, address, state')
        .in('id', farmerIds);

      if (error) throw error;

      // Also get farmer phone numbers from profiles
      const userIds = data?.map(f => f.id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, phone')
        .in('user_id', userIds);

      const infoMap: Record<string, FarmerInfo> = {};
      data?.forEach(farmer => {
        const profile = profilesData?.find(p => p.user_id === farmer.id);
        infoMap[farmer.id] = {
          ...farmer,
          phone: profile?.phone || undefined,
        };
      });
      setFarmerInfoMap(infoMap);
    } catch (error) {
      console.error('Error fetching farmer info:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('user_id', user?.id)
        .eq('state', selectedState)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setSavedAddresses(data || []);
      
      // Auto-select default address
      const defaultAddr = data?.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (data && data.length > 0) {
        setSelectedAddressId(data[0].id);
      } else {
        setUseNewAddress(true);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if any orders need delivery - if so, validate address
    const needsDelivery = itemsByFarmer.some(g => deliveryMethods[g.farmerId] !== 'pickup');
    
    let deliveryInfo: { fullName: string; email: string; phone: string; address: string; city: string };
    
    if (needsDelivery) {
      if (useNewAddress || savedAddresses.length === 0) {
        // Validate new address form
        if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city) {
          toast({
            title: "Missing information",
            description: "Please fill in all required fields",
            variant: "destructive",
          });
          return;
        }
        deliveryInfo = formData;
      } else {
        // Use selected saved address
        const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);
        if (!selectedAddr) {
          toast({
            title: "No address selected",
            description: "Please select a delivery address",
            variant: "destructive",
          });
          return;
        }
        deliveryInfo = {
          fullName: selectedAddr.full_name,
          email: user?.email || '',
          phone: selectedAddr.phone,
          address: selectedAddr.address,
          city: selectedAddr.city,
        };
      }
    } else {
      // All orders are pickup - use minimal info
      deliveryInfo = {
        fullName: formData.fullName || user?.email?.split('@')[0] || 'Customer',
        email: user?.email || '',
        phone: formData.phone || '',
        address: 'Pickup',
        city: 'Pickup',
      };
    }

    setIsProcessing(true);

    try {
      // Create orders for each farmer
      const orderIds: string[] = [];
      let totalAmountForPayment = 0;

      for (const group of itemsByFarmer) {
        // Generate order number
        const orderNumber = `AGT-${Date.now().toString(36).toUpperCase()}-${group.farmerId.substring(0, 4).toUpperCase()}`;
        
        const isPickup = deliveryMethods[group.farmerId] === 'pickup';
        const orderDeliveryFee = isPickup ? 0 : deliveryFeePerFarmer;
        const orderTotal = group.subtotal + orderDeliveryFee;
        totalAmountForPayment += orderTotal;

        // For pickup orders, use farmer's address
        const farmerInfo = farmerInfoMap[group.farmerId];
        const orderAddress = isPickup 
          ? `Pickup from: ${farmerInfo?.address || 'Contact farmer for pickup location'}`
          : `${deliveryInfo.address}, ${deliveryInfo.city}`;

        // Create order in database
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            consumer_id: user?.id,
            consumer_name: deliveryInfo.fullName,
            consumer_email: deliveryInfo.email,
            consumer_phone: deliveryInfo.phone,
            delivery_address: orderAddress,
            delivery_state: selectedState,
            subtotal: group.subtotal,
            delivery_fee: orderDeliveryFee,
            total_amount: orderTotal,
            farmer_id: group.farmerId,
            delivery_method: isPickup ? 'pickup' : 'delivery',
            status: 'pending',
          })
          .select()
          .single();

        if (orderError) throw orderError;

        orderIds.push(order.id);

        // Create order items
        const orderItems = group.items.map(({ product, quantity }) => ({
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          unit_price: product.price,
          quantity,
          total_price: product.price * quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Add initial tracking event
        await supabase.from('order_tracking').insert({
          order_id: order.id,
          status: 'pending',
          description: 'Order placed, awaiting payment',
        });
      }

      // Initialize Paystack payment for total amount
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('paystack-initialize', {
        body: {
          email: deliveryInfo.email,
          amount: adjustedTotal,
          callback_url: `${window.location.origin}/payment/callback`,
          metadata: {
            order_ids: orderIds,
            order_count: orderIds.length,
            is_multi_order: orderIds.length > 1,
          },
        },
      });

      if (paymentError || !paymentData.authorization_url) {
        throw new Error(paymentData?.error || 'Failed to initialize payment');
      }

      // Redirect to Paystack
      window.location.href = paymentData.authorization_url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: error.message || "An error occurred during checkout",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Auth guard - redirect to login if not authenticated
  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <Layout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <BackButton fallbackPath="/cart" />
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
          </div>
          {farmerCount > 1 && (
            <p className="text-muted-foreground mt-1 ml-12">
              {farmerCount} orders will be created for different farms
            </p>
          )}
        </div>
      </div>

      <div className="container py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Delivery Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Delivery Information</h2>
                
                {/* Saved Addresses */}
                {savedAddresses.length > 0 && !useNewAddress && (
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-muted-foreground">Select a saved address:</p>
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={cn(
                          "w-full p-4 rounded-lg border-2 text-left transition-all",
                          selectedAddressId === addr.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{addr.label}</span>
                          </div>
                          {selectedAddressId === addr.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm mt-1">{addr.full_name}</p>
                        <p className="text-sm text-muted-foreground">{addr.address}</p>
                        <p className="text-sm text-muted-foreground">{addr.city}, {addr.state}</p>
                        <p className="text-sm text-muted-foreground">{addr.phone}</p>
                      </button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setUseNewAddress(true)}
                    >
                      Use a different address
                    </Button>
                  </div>
                )}

                {/* New Address Form */}
                {(useNewAddress || savedAddresses.length === 0) && (
                  <>
                    {savedAddresses.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="mb-4"
                        onClick={() => setUseNewAddress(false)}
                      >
                        ← Back to saved addresses
                      </Button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Full Name *
                        </label>
                        <Input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          required={useNewAddress}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Email Address *
                        </label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="you@example.com"
                          required={useNewAddress}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Phone Number *
                        </label>
                        <Input
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+234 800 000 0000"
                          required={useNewAddress}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Delivery Address *
                        </label>
                        <Input
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Street address, house number"
                          required={useNewAddress}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          City *
                        </label>
                        <Input
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
                          required={useNewAddress}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          State
                        </label>
                        <Input
                          value={stateLabel}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Section */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Payment</h2>
                  <img 
                    src="https://website-v3-assets.s3.amazonaws.com/assets/img/hero/Paystack-mark-white-twitter.png" 
                    alt="Paystack" 
                    className="h-6 bg-primary rounded px-2 py-1"
                  />
                </div>
                
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-medium text-foreground mb-1">Escrow Payment Protection</h3>
                      <p className="text-sm text-muted-foreground">
                        When you pay, your funds go into a secure escrow account—not directly to the farmer. 
                        The money is only released after you confirm you've received your order.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-foreground mb-4">Order Summary</h2>

                {/* Orders by Farmer */}
                <div className="space-y-4 mb-4">
                  {itemsByFarmer.map((group) => {
                    const farmerInfo = farmerInfoMap[group.farmerId];
                    const isPickup = deliveryMethods[group.farmerId] === 'pickup';
                    const orderDeliveryFee = isPickup ? 0 : deliveryFeePerFarmer;
                    
                    return (
                      <div key={group.farmerId} className="border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Store className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{group.farmName}</span>
                        </div>
                        
                        {/* Pickup Option */}
                        {farmerInfo?.allows_pickup && (
                          <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Delivery Method:</p>
                            <RadioGroup
                              value={deliveryMethods[group.farmerId] || 'delivery'}
                              onValueChange={(value) => setDeliveryMethods(prev => ({
                                ...prev,
                                [group.farmerId]: value as 'delivery' | 'pickup'
                              }))}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="delivery" id={`delivery-${group.farmerId}`} />
                                <Label htmlFor={`delivery-${group.farmerId}`} className="text-sm flex items-center gap-2 cursor-pointer">
                                  <Truck className="h-4 w-4" />
                                  Delivery ({formatPrice(deliveryFeePerFarmer)})
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pickup" id={`pickup-${group.farmerId}`} />
                                <Label htmlFor={`pickup-${group.farmerId}`} className="text-sm flex items-center gap-2 cursor-pointer">
                                  <Package className="h-4 w-4" />
                                  Pickup (FREE)
                                </Label>
                              </div>
                            </RadioGroup>
                            
                            {isPickup && farmerInfo?.address && (
                              <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/10">
                                <p className="text-xs font-medium text-primary mb-1">Pickup Location:</p>
                                <p className="text-xs text-muted-foreground">{farmerInfo.address}</p>
                                {farmerInfo.phone && (
                                  <a 
                                    href={`tel:${farmerInfo.phone}`}
                                    className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                                  >
                                    <Phone className="h-3 w-3" />
                                    {farmerInfo.phone}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          {group.items.map(({ product, quantity }) => (
                            <div key={product.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground truncate mr-2">
                                {product.name} × {quantity}
                              </span>
                              <span className="text-foreground">{formatPrice(product.price * quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatPrice(group.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery</span>
                          <span className={isPickup ? 'text-primary font-medium' : ''}>
                            {isPickup ? 'FREE' : formatPrice(deliveryFeePerFarmer)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-medium mt-1">
                          <span>Order Total</span>
                          <span>{formatPrice(group.subtotal + orderDeliveryFee)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grand Totals */}
                <div className="space-y-3 py-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Subtotal</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Delivery {farmerCount > 1 && `(${farmerCount} orders)`}
                    </span>
                    <span className="text-foreground">{formatPrice(totalDeliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-3 border-t border-border">
                    <span className="text-foreground">Grand Total</span>
                    <span className="text-foreground">{formatPrice(adjustedTotal)}</span>
                  </div>
                </div>

                {/* Pay Button */}
                <Button 
                  type="submit" 
                  className="w-full mt-4" 
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay {formatPrice(adjustedTotal)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  By placing this order, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Checkout;
