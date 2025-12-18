import { Link } from 'react-router-dom';

const categories = [
  { label: 'Vegetables', value: 'vegetables', icon: '🥬', color: 'bg-green-50 hover:bg-green-100' },
  { label: 'Fruits', value: 'fruits', icon: '🍎', color: 'bg-red-50 hover:bg-red-100' },
  { label: 'Grains', value: 'grains', icon: '🌾', color: 'bg-amber-50 hover:bg-amber-100' },
  { label: 'Tubers', value: 'tubers', icon: '🥔', color: 'bg-orange-50 hover:bg-orange-100' },
  { label: 'Poultry', value: 'poultry', icon: '🍗', color: 'bg-yellow-50 hover:bg-yellow-100' },
  { label: 'Dairy', value: 'dairy', icon: '🥛', color: 'bg-blue-50 hover:bg-blue-100' },
  { label: 'Herbs & Spices', value: 'herbs', icon: '🌿', color: 'bg-emerald-50 hover:bg-emerald-100' },
  { label: 'Meat', value: 'meat', icon: '🥩', color: 'bg-rose-50 hover:bg-rose-100' },
];

export const CategoryGrid = () => {
  return (
    <section className="py-8 bg-card">
      <div className="container">
        <h2 className="text-xl font-bold text-foreground mb-6">Shop by Category</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {categories.map(category => (
            <Link
              key={category.value}
              to={`/products?category=${category.value}`}
              className={`${category.color} rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md group`}
            >
              <span className="text-3xl md:text-4xl block mb-2 group-hover:scale-110 transition-transform">
                {category.icon}
              </span>
              <span className="text-xs md:text-sm font-medium text-foreground">
                {category.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
