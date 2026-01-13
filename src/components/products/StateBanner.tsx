import { State, STATES } from '@/types';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface StateBannerProps {
  selectedState: State;
  onStateChange: (state: State) => void;
  hasItemsInCart?: boolean;
}

export const StateBanner = ({ selectedState, onStateChange, hasItemsInCart }: StateBannerProps) => {
  const currentState = STATES.find(s => s.value === selectedState);

  const handleStateChange = (newState: State) => {
    onStateChange(newState);
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Showing products available in</p>
            <p className="font-semibold text-lg">{currentState?.label}, Nigeria</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              Change Location
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Your Location</AlertDialogTitle>
              <AlertDialogDescription>
                {hasItemsInCart ? (
                  <span className="flex items-start gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>
                      Changing your location will clear your cart as products are specific to each state.
                    </span>
                  </span>
                ) : (
                  'Select a different state to see products available for delivery in that area.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="grid gap-2 py-4">
              {STATES.map(state => (
                <AlertDialogAction
                  key={state.value}
                  onClick={() => handleStateChange(state.value)}
                  className={cn(
                    "justify-start",
                    selectedState === state.value && "bg-primary"
                  )}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {state.label}
                  {selectedState === state.value && ' (Current)'}
                </AlertDialogAction>
              ))}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Products listed are only available for delivery within {currentState?.label}. 
        Farmers in other states cannot deliver to your location.
      </p>
    </div>
  );
};
