import { CATEGORIES, ProductCategory } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  selected: ProductCategory | 'all';
  onChange: (category: ProductCategory | 'all') => void;
}

export const CategoryFilter = ({ selected, onChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange('all')}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          selected === 'all'
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        All
      </button>
      {CATEGORIES.map(category => (
        <button
          key={category.value}
          onClick={() => onChange(category.value)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            selected === category.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <span>{category.icon}</span>
          {category.label}
        </button>
      ))}
    </div>
  );
};
