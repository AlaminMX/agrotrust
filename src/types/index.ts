export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  image: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  state: State;
  available: number;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
}

export interface Farmer {
  id: string;
  name: string;
  farmName: string;
  state: State;
  bio: string;
  image: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  memberSince: string;
  productsCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  deliveryFee: number;
  status: OrderStatus;
  deliveryAddress: string;
  state: State;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string;
  trackingEvents: TrackingEvent[];
}

export interface TrackingEvent {
  status: OrderStatus;
  timestamp: string;
  description: string;
}

export type State = 'all' | 'abuja' | 'kaduna' | 'bauchi' | 'kano';

export type OrderStatus = 
  | 'pending'
  | 'paid'
  | 'processing'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'confirmed'
  | 'disputed';

export type ProductCategory = 
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'tubers'
  | 'poultry'
  | 'dairy'
  | 'herbs'
  | 'meat';

export const STATES: { value: State; label: string }[] = [
  { value: 'all', label: 'All States' },
  { value: 'kaduna', label: 'Kaduna' },
  { value: 'abuja', label: 'Abuja' },
  { value: 'bauchi', label: 'Bauchi' },
  { value: 'kano', label: 'Kano' },
];

export const CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
  { value: 'vegetables', label: 'Vegetables', icon: '🥬' },
  { value: 'fruits', label: 'Fruits', icon: '🍎' },
  { value: 'grains', label: 'Grains', icon: '🌾' },
  { value: 'tubers', label: 'Tubers', icon: '🥔' },
  { value: 'poultry', label: 'Poultry', icon: '🐔' },
  { value: 'dairy', label: 'Dairy', icon: '🥛' },
  { value: 'herbs', label: 'Herbs', icon: '🌿' },
  { value: 'meat', label: 'Meat', icon: '🥩' },
];
