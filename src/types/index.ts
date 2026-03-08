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
  is_negotiable?: boolean;
  listing_status?: string;
}

export interface Farmer {
  id: string;
  name: string;
  farmName: string;
  state: State;
  bio: string;
  image: string;
  isVerified: boolean;
  memberSince: string;
  productsCount: number;
}

export type State = 'all' | 'abuja' | 'kaduna' | 'bauchi' | 'kano' | (string & {});

export type AvailabilityStatus = 'In Stock' | 'Limited' | 'Out of Stock';

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
  { value: 'all', label: 'All Nigeria' },
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

export const UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'ton', label: 'Ton' },
  { value: 'bag', label: 'Bag' },
  { value: 'basket', label: 'Basket' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'crate', label: 'Crate' },
  { value: 'paint_bucket', label: 'Paint Bucket' },
  { value: 'tuber', label: 'Tuber' },
  { value: 'piece', label: 'Piece' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'tray', label: 'Tray' },
  { value: 'carton', label: 'Carton' },
  { value: 'litre', label: 'Litre' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'bowl', label: 'Bowl' },
  { value: 'mudu', label: 'Mudu' },
  { value: 'derica', label: 'Derica' },
  { value: 'custom', label: 'Custom Unit' },
];

export const getUnitLabel = (unit: string): string => {
  const found = UNITS.find(u => u.value === unit);
  return found ? found.label : unit;
};

export const getAvailabilityStatus = (quantity: number): AvailabilityStatus => {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= 10) return 'Limited';
  return 'In Stock';
};

export const getAvailabilityColor = (status: AvailabilityStatus): string => {
  switch (status) {
    case 'In Stock': return 'bg-green-100 text-green-800';
    case 'Limited': return 'bg-amber-100 text-amber-800';
    case 'Out of Stock': return 'bg-red-100 text-red-800';
  }
};
