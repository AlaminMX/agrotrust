import { STATES, State } from '@/types';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface StateSelectorProps {
  selected: State;
  onChange: (state: State) => void;
}

export const StateSelector = ({ selected, onChange }: StateSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {STATES.map(state => (
        <button
          key={state.value}
          onClick={() => onChange(state.value)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            selected === state.value
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary"
          )}
        >
          <MapPin className="h-4 w-4" />
          {state.label}
        </button>
      ))}
    </div>
  );
};
