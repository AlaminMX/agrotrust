import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ProductFiltersProps {
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (value: boolean) => void;
}

export const ProductFilters = ({
  minPrice, maxPrice, onMinPriceChange, onMaxPriceChange,
  onClearFilters, activeFiltersCount, verifiedOnly, onVerifiedOnlyChange,
}: ProductFiltersProps) => {
  const [priceOpen, setPriceOpen] = useState(true);

  const FilterContent = () => (
    <div className="space-y-4">
      <Collapsible open={priceOpen} onOpenChange={setPriceOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 font-medium">
          <span>Price Range</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", priceOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1"><Label htmlFor="minPrice" className="text-xs text-muted-foreground">Min (₦)</Label><Input id="minPrice" type="number" placeholder="0" value={minPrice} onChange={(e) => onMinPriceChange(e.target.value)} className="h-9" /></div>
            <span className="mt-5 text-muted-foreground">-</span>
            <div className="flex-1"><Label htmlFor="maxPrice" className="text-xs text-muted-foreground">Max (₦)</Label><Input id="maxPrice" type="number" placeholder="50000" value={maxPrice} onChange={(e) => onMaxPriceChange(e.target.value)} className="h-9" /></div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex items-center justify-between py-2">
        <Label htmlFor="verifiedOnly" className="font-medium">Verified farmers only</Label>
        <Switch id="verifiedOnly" checked={verifiedOnly} onCheckedChange={onVerifiedOnlyChange} />
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" size="sm" onClick={onClearFilters} className="w-full mt-4">
          <X className="h-4 w-4 mr-2" /> Clear Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
              {activeFiltersCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{activeFiltersCount}</span>}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader><SheetTitle>Filters</SheetTitle><SheetDescription>Refine your search</SheetDescription></SheetHeader>
            <div className="mt-6"><FilterContent /></div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20 bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeFiltersCount > 0 && <span className="ml-auto h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{activeFiltersCount}</span>}
          </h3>
          <FilterContent />
        </div>
      </div>
    </>
  );
};
