import { useState } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/context/CartContext';
import { STATES, State } from '@/types';

export const LocationBanner = () => {
  const { selectedState, setSelectedState } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const currentStateLabel = STATES.find(s => s.value === selectedState)?.label || 'All Nigeria';

  const handleStateChange = (newState: State) => {
    setSelectedState(newState);
    setIsOpen(false);
  };

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Showing listings in</p>
              <p className="font-semibold text-foreground truncate">
                {currentStateLabel === 'All Nigeria' ? '🇳🇬 All Nigeria' : `📍 ${currentStateLabel}, Nigeria`}
              </p>
            </div>
          </div>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary flex-shrink-0">
                <span className="hidden sm:inline">Change Location</span>
                <span className="sm:hidden">Change</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {STATES.map((state) => (
                <DropdownMenuItem key={state.value} onClick={() => handleStateChange(state.value)}
                  className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">{state.value === 'all' ? '🌍' : '📍'}{state.label}</span>
                  {selectedState === state.value && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
