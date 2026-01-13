import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ProductFiltersProps {
  minPrice: string;
  maxPrice: string;
  minRating: number | null;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onMinRatingChange: (value: number | null) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const ratingOptions = [
  { value: 4, label: '4+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 2, label: '2+ Stars' },
];

export const ProductFilters = ({
  minPrice,
  maxPrice,
  minRating,
  onMinPriceChange,
  onMaxPriceChange,
  onMinRatingChange,
  onClearFilters,
  activeFiltersCount,
}: ProductFiltersProps) => {
  const [priceOpen, setPriceOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(true);

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Price Range */}
      <Collapsible open={priceOpen} onOpenChange={setPriceOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
          <span>Price Range</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", priceOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="minPrice" className="text-xs text-muted-foreground">Min (₦)</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                className="h-9"
              />
            </div>
            <span className="mt-5 text-muted-foreground">-</span>
            <div className="flex-1">
              <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">Max (₦)</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="50000"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Rating Filter */}
      <Collapsible open={ratingOpen} onOpenChange={setRatingOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
          <span>Farmer Rating</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", ratingOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 pb-4 space-y-2">
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onMinRatingChange(minRating === option.value ? null : option.value)}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors",
                minRating === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              )}
            >
              <Star className={cn(
                "h-4 w-4",
                minRating === option.value ? "fill-primary-foreground" : "fill-gold text-gold"
              )} />
              {option.label}
            </button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="w-full mt-4"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Refine your product search
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20 bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-auto h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </h3>
          <FilterContent />
        </div>
      </div>
    </>
  );
};
