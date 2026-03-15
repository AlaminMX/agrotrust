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
    <section className="py-6 md:py-10">
      <div className="container">
        <h2 className="text-lg md:text-2xl font-bold text-foreground mb-4 md:mb-6">Browse by Category</h2>
        <div className="flex overflow-x-auto gap-2.5 -mx-4 px-4 pb-2 snap-x md:mx-0 md:px-0 md:grid md:grid-cols-8 md:gap-3 md:overflow-visible">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              to={`/products?category=${cat.value}`}
              className="flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-200 group snap-start shrink-0 w-[72px] md:w-auto"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="font-medium text-foreground text-[10px] md:text-xs text-center leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
