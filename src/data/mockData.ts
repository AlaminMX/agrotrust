import { Product, Farmer, State } from '@/types';

export const mockFarmers: Farmer[] = [
  {
    id: 'farmer-1',
    name: 'Musa Abdullahi',
    farmName: 'Green Valley Farm',
    state: 'kano',
    bio: 'Third-generation farmer specializing in organic vegetables.',
    image: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400',
    isVerified: true,
    rating: 4.8,
    reviewCount: 124,
    memberSince: '2023-03-15',
    productsCount: 12,
  },
];

export const mockProducts: Product[] = [];

export const getProductsByState = (state: State): Product[] => {
  return mockProducts.filter(p => p.state === state);
};

export const getProductsByCategory = (category: string): Product[] => {
  return mockProducts.filter(p => p.category === category);
};

export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find(p => p.id === id);
};

export const getFarmerById = (id: string): Farmer | undefined => {
  return mockFarmers.find(f => f.id === id);
};
