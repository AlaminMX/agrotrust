import { State, STATES } from '@/types';
import { MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface StateBannerProps {
  selectedState: State;
  onStateChange: (state: State) => void;
}

export const StateBanner = ({ selectedState, onStateChange }: StateBannerProps) => {
  const currentState = STATES.find(s => s.value === selectedState);
  const isAllStates = selectedState === 'all';

  return (
    <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {isAllStates ? <Globe className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Showing listings in</p>
            <p className="font-semibold text-foreground">
              {isAllStates ? 'All Nigeria' : `${currentState?.label}, Nigeria`}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              Change Location
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card">
            {STATES.map(state => (
              <DropdownMenuItem
                key={state.value}
                onClick={() => onStateChange(state.value)}
                className={cn(selectedState === state.value && "bg-primary/10 font-medium")}
              >
                {state.value === 'all' ? <Globe className="h-4 w-4 mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                {state.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
