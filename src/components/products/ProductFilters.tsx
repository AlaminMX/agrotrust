import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface ProductFiltersProps {
  verifiedOnly: boolean;
  availability: 'all' | 'In Stock' | 'Limited' | 'Out of Stock';
  onVerifiedOnlyChange: (value: boolean) => void;
  onAvailabilityChange: (value: 'all' | 'In Stock' | 'Limited' | 'Out of Stock') => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export const ProductFilters = ({ verifiedOnly, availability, onVerifiedOnlyChange, onAvailabilityChange, onClearFilters, activeFiltersCount }: ProductFiltersProps) => {
  const Content = () => (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 flex items-center justify-between">
        <div>
          <Label htmlFor="verifiedOnly">Verified farmers only</Label>
          <p className="text-xs text-muted-foreground">Show listings from approved farmers</p>
        </div>
        <Switch id="verifiedOnly" checked={verifiedOnly} onCheckedChange={onVerifiedOnlyChange} />
      </div>

      <div className="space-y-2">
        <Label>Availability</Label>
        <Select value={availability} onValueChange={onAvailabilityChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="In Stock">In Stock</SelectItem>
            <SelectItem value="Limited">Limited</SelectItem>
            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeFiltersCount > 0 && <Button variant="outline" size="sm" onClick={onClearFilters} className="w-full"><X className="h-4 w-4 mr-2" />Clear Filters ({activeFiltersCount})</Button>}
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild><Button variant="outline" size="sm"><SlidersHorizontal className="h-4 w-4 mr-2" />Filters</Button></SheetTrigger>
          <SheetContent side="left"><SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader><div className="mt-4"><Content /></div></SheetContent>
        </Sheet>
      </div>
      <div className="hidden lg:block w-72 shrink-0"><div className="sticky top-24 rounded-xl border bg-card p-5"><h3 className="font-semibold mb-4">Filters</h3><Content /></div></div>
    </>
  );
};
