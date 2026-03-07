import { Link } from 'react-router-dom';

const categories = [
  { label: 'Vegetables', value: 'vegetables', icon: '🥬' },
  { label: 'Fruits', value: 'fruits', icon: '🍎' },
  { label: 'Grains', value: 'grains', icon: '🌾' },
  { label: 'Tubers', value: 'tubers', icon: '🥔' },
  { label: 'Poultry', value: 'poultry', icon: '🐔' },
  { label: 'Dairy', value: 'dairy', icon: '🥛' },
  { label: 'Herbs & Spices', value: 'herbs', icon: '🌿' },
  { label: 'Meat', value: 'meat', icon: '🥩' },
];

export const CategoryGrid = () => {
  return (
    <section className="py-10">
      <div className="container">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              to={`/products?category=${cat.value}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-200 group"
            >
              <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="font-medium text-foreground text-xs text-center leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
