import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { CartItem, Product, State } from '@/types';
import { DELIVERY_FEES } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const STATE_STORAGE_KEY = 'agrotrust_state';

// Helper to get cart storage key for a specific user
const getCartStorageKey = (userId: string | null) => {
  return userId ? `agrotrust_cart_${userId}` : null;
};

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
  // Multi-farmer support
  itemsByFarmer: FarmerGroup[];
  farmerCount: number;
  getDeliveryFeePerFarmer: () => number;
  getTotalDeliveryFee: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to load cart from localStorage for a specific user
const loadCartFromStorage = (userId: string | null): CartItem[] => {
  if (!userId) return [];
  try {
    const key = getCartStorageKey(userId);
    if (!key) return [];
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to load state from localStorage
const loadStateFromStorage = (): State => {
  try {
    const stored = localStorage.getItem(STATE_STORAGE_KEY);
    return (stored as State) || 'abuja';
  } catch {
    return 'abuja';
  }
};

// Helper to save cart to localStorage for a specific user
const saveCartToStorage = (userId: string | null, items: CartItem[]) => {
  if (!userId) return;
  const key = getCartStorageKey(userId);
  if (key) {
    localStorage.setItem(key, JSON.stringify(items));
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedState, setSelectedStateInternal] = useState<State>(() => loadStateFromStorage());

  // Load cart when user changes
  useEffect(() => {
    if (user?.id) {
      const userCart = loadCartFromStorage(user.id);
      setItems(userCart);
    } else {
      // Clear cart when user logs out
      setItems([]);
    }
  }, [user?.id]);

  // Persist cart to localStorage when items change (only if user is logged in)
  useEffect(() => {
    if (user?.id) {
      saveCartToStorage(user.id, items);
    }
  }, [items, user?.id]);

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
    return true;
  }, [user]);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

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
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    // Also clear from storage
    if (user?.id) {
      const key = getCartStorageKey(user.id);
      if (key) {
        localStorage.removeItem(key);
      }
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
