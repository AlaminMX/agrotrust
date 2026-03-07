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
    <section className="py-12">
      <div className="container">
        <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              to={`/products?category=${cat.value}`}
              className={`${cat.color} rounded-xl p-6 text-center transition-colors`}
            >
              <span className="text-3xl mb-2 block">{cat.icon}</span>
              <span className="font-medium text-foreground text-sm">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
