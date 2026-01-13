import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CartItem, Product, State } from '@/types';
import { DELIVERY_FEES } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATE_STORAGE_KEY = 'agrotrust_state';
const GUEST_CART_KEY = 'agrotrust_guest_cart';

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
  // Guest cart support
  isGuestCart: boolean;
  mergeGuestCartToUser: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to load state from localStorage
const loadStateFromStorage = (): State => {
  try {
    const stored = localStorage.getItem(STATE_STORAGE_KEY);
    return (stored as State) || 'kaduna';
  } catch {
    return 'kaduna';
  }
};

// Helper to load guest cart from localStorage
const loadGuestCartFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save guest cart to localStorage
const saveGuestCartToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
};

// Helper to clear guest cart from localStorage
const clearGuestCartFromStorage = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.error('Error clearing guest cart:', error);
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [selectedState, setSelectedStateInternal] = useState<State>(() => loadStateFromStorage());
  const [isGuestCart, setIsGuestCart] = useState(false);

  // Fetch cart items from database when user logs in, or load from localStorage for guests
  useEffect(() => {
    const fetchCartItems = async () => {
      // If still loading auth, don't do anything
      if (authLoading) return;

      // If no user, load guest cart from localStorage
      if (!user?.id) {
        const guestCart = loadGuestCartFromStorage();
        setItems(guestCart);
        setIsGuestCart(true);
        return;
      }

      // User is logged in - fetch from database
      setIsGuestCart(false);
      setCartLoading(true);
      
      try {
        // Check if there's a guest cart to merge
        const guestCart = loadGuestCartFromStorage();
        
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

        // Fetch farmer details for all products
        const existingProductIds = cartData?.map(item => (item.products as any)?.id).filter(Boolean) || [];
        const farmerIds = [...new Set(cartData?.map(item => (item.products as any)?.farmer_id).filter(Boolean) || [])];
        
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
        const transformedItems: CartItem[] = (cartData || [])
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
                state: (prod.state || farmer?.state || 'kaduna') as State,
                available: prod.available_quantity,
                isVerified: farmer?.verification_status === 'approved',
                rating: prod.average_rating || 0,
                reviewCount: prod.review_count || 0,
              },
              quantity: item.quantity,
            };
          });

        // Merge guest cart items if any
        if (guestCart.length > 0) {
          for (const guestItem of guestCart) {
            const existingIndex = transformedItems.findIndex(
              item => item.product.id === guestItem.product.id
            );
            
            if (existingIndex >= 0) {
              // Update quantity
              transformedItems[existingIndex].quantity += guestItem.quantity;
              await supabase
                .from('cart_items')
                .update({ quantity: transformedItems[existingIndex].quantity })
                .eq('user_id', user.id)
                .eq('product_id', guestItem.product.id);
            } else {
              // Add new item
              await supabase
                .from('cart_items')
                .insert({
                  user_id: user.id,
                  product_id: guestItem.product.id,
                  quantity: guestItem.quantity,
                });
              transformedItems.push(guestItem);
            }
          }
          
          // Clear guest cart after merging
          clearGuestCartFromStorage();
          
          if (guestCart.length > 0) {
            toast.success(`${guestCart.length} item(s) from your guest cart have been added`);
          }
        }

        setItems(transformedItems);
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setCartLoading(false);
      }
    };

    fetchCartItems();
  }, [user?.id, authLoading]);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STATE_STORAGE_KEY, selectedState);
  }, [selectedState]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (isGuestCart) {
      saveGuestCartToStorage(items);
    }
  }, [items, isGuestCart]);

  const setSelectedState = useCallback((state: State) => {
    setSelectedStateInternal(state);
  }, []);

  const mergeGuestCartToUser = useCallback(async () => {
    if (!user?.id) return;
    
    const guestCart = loadGuestCartFromStorage();
    if (guestCart.length === 0) return;

    for (const guestItem of guestCart) {
      try {
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', guestItem.product.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + guestItem.quantity })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: guestItem.product.id,
              quantity: guestItem.quantity,
            });
        }
      } catch (error) {
        console.error('Error merging guest cart item:', error);
      }
    }

    clearGuestCartFromStorage();
  }, [user?.id]);

  const addToCart = useCallback((product: Product, quantity = 1): boolean => {
    // For guests, add to local state (will be persisted to localStorage)
    if (!user) {
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
      toast.success('Added to cart');
      return true;
    }

    // For logged-in users, sync to database
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
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + quantity })
            .eq('id', existing.id);
        } else {
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
    setItems(prev => prev.filter(item => item.product.id !== productId));

    // Sync to database if logged in
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

    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );

    // Sync to database if logged in
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
    
    if (user?.id) {
      // Clear from database
      supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Error clearing cart:', error);
        });
    } else {
      // Clear guest cart from localStorage
      clearGuestCartFromStorage();
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
        isGuestCart,
        mergeGuestCartToUser,
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
