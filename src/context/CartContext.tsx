import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CartItem, Product, State } from '@/types';
import { DELIVERY_FEES } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATE_STORAGE_KEY = 'agrotrust_state';

interface FarmerGroup {
  farmerId: string;
  farmerName: string;
  farmName: string;
  items: CartItem[];
  subtotal: number;
}

interface CartContextType {
  items: CartItem[];
  selectedState: State;
  setSelectedState: (state: State) => void;
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  cartLoading: boolean;
  // Multi-farmer support
  itemsByFarmer: FarmerGroup[];
  farmerCount: number;
  getDeliveryFeePerFarmer: () => number;
  getTotalDeliveryFee: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to load state from localStorage
const loadStateFromStorage = (): State => {
  try {
    const stored = localStorage.getItem(STATE_STORAGE_KEY);
    return (stored as State) || 'abuja';
  } catch {
    return 'abuja';
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [selectedState, setSelectedStateInternal] = useState<State>(() => loadStateFromStorage());

  // Fetch cart items from database when user logs in
  useEffect(() => {
    const fetchCartItems = async () => {
      if (!user?.id) {
        setItems([]);
        return;
      }

      setCartLoading(true);
      try {
        // Fetch cart items with product details
        const { data: cartData, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            product_id,
            quantity,
            products (
              id,
              name,
              description,
              price,
              unit,
              category,
              image_url,
              available_quantity,
              average_rating,
              review_count,
              state,
              farmer_id
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching cart:', error);
          return;
        }

        if (!cartData) {
          setItems([]);
          return;
        }

        // Fetch farmer details for all products
        const farmerIds = [...new Set(cartData.map(item => (item.products as any)?.farmer_id).filter(Boolean))];
        
        let farmersMap: Record<string, any> = {};
        if (farmerIds.length > 0) {
          const { data: farmersData } = await supabase
            .from('farmer_profiles_public')
            .select('id, farm_name, state, verification_status, user_id')
            .in('id', farmerIds);
          
          if (farmersData) {
            farmersMap = farmersData.reduce((acc, farmer) => {
              acc[farmer.id] = farmer;
              return acc;
            }, {} as Record<string, any>);
          }
        }

        // Transform to CartItem format
        const transformedItems: CartItem[] = cartData
          .filter(item => item.products)
          .map(item => {
            const prod = item.products as any;
            const farmer = farmersMap[prod.farmer_id];
            
            return {
              product: {
                id: prod.id,
                name: prod.name,
                description: prod.description || '',
                price: prod.price,
                unit: prod.unit,
                category: prod.category,
                image: prod.image_url || '/placeholder.svg',
                farmerId: prod.farmer_id,
                farmerName: farmer?.farm_name || 'Unknown Farmer',
                farmName: farmer?.farm_name || 'Unknown Farm',
                state: (prod.state || farmer?.state || 'abuja') as State,
                available: prod.available_quantity,
                isVerified: farmer?.verification_status === 'approved',
                rating: prod.average_rating || 0,
                reviewCount: prod.review_count || 0,
              },
              quantity: item.quantity,
            };
          });

        setItems(transformedItems);
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setCartLoading(false);
      }
    };

    // Only fetch when auth is done loading
    if (!authLoading) {
      fetchCartItems();
    }
  }, [user?.id, authLoading]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STATE_STORAGE_KEY, selectedState);
  }, [selectedState]);

  const setSelectedState = useCallback((state: State) => {
    setSelectedStateInternal(state);
  }, []);

  const addToCart = useCallback((product: Product, quantity = 1): boolean => {
    // Check if user is logged in
    if (!user) {
      toast.error('Please sign in to add items to your cart', {
        action: {
          label: 'Sign In',
          onClick: () => {
            window.location.href = '/auth';
          },
        },
      });
      return false;
    }

    // Optimistic update
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    // Sync to database
    const syncToDb = async () => {
      try {
        // Check if item already exists in cart
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .maybeSingle();

        if (existing) {
          // Update quantity
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + quantity })
            .eq('id', existing.id);
        } else {
          // Insert new item
          await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: product.id,
              quantity: quantity,
            });
        }
      } catch (error) {
        console.error('Error syncing cart to database:', error);
      }
    };

    syncToDb();
    return true;
  }, [user]);

  const removeFromCart = useCallback((productId: string) => {
    // Optimistic update
    setItems(prev => prev.filter(item => item.product.id !== productId));

    // Sync to database
    if (user?.id) {
      supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .then(({ error }) => {
          if (error) console.error('Error removing from cart:', error);
        });
    }
  }, [user?.id]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Optimistic update
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );

    // Sync to database
    if (user?.id) {
      supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .then(({ error }) => {
          if (error) console.error('Error updating cart quantity:', error);
        });
    }
  }, [removeFromCart, user?.id]);

  const clearCart = useCallback(() => {
    setItems([]);
    
    // Clear from database
    if (user?.id) {
      supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Error clearing cart:', error);
        });
    }
  }, [user?.id]);

  // Group items by farmer
  const itemsByFarmer = useMemo(() => {
    const groups: { [key: string]: FarmerGroup } = {};
    
    items.forEach(item => {
      const farmerId = item.product.farmerId;
      if (!groups[farmerId]) {
        groups[farmerId] = {
          farmerId,
          farmerName: item.product.farmerName,
          farmName: item.product.farmName,
          items: [],
          subtotal: 0,
        };
      }
      groups[farmerId].items.push(item);
      groups[farmerId].subtotal += item.product.price * item.quantity;
    });
    
    return Object.values(groups);
  }, [items]);

  const farmerCount = itemsByFarmer.length;

  const getDeliveryFeePerFarmer = useCallback(() => {
    return items.length > 0 ? DELIVERY_FEES[selectedState] : 0;
  }, [items.length, selectedState]);

  const getTotalDeliveryFee = useCallback(() => {
    return farmerCount > 0 ? DELIVERY_FEES[selectedState] * farmerCount : 0;
  }, [farmerCount, selectedState]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = getTotalDeliveryFee();
  const total = subtotal + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        selectedState,
        setSelectedState,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        deliveryFee,
        total,
        cartLoading,
        itemsByFarmer,
        farmerCount,
        getDeliveryFeePerFarmer,
        getTotalDeliveryFee,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
