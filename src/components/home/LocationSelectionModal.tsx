import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { State, STATES } from '@/types';

const LOCATION_SELECTED_KEY = 'agrotrust_location_selected';

const ALL_NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const FILTER_STATES = STATES.filter(s => s.value !== 'all').map(s => s.value);
const FILTER_STATE_LABELS = STATES.filter(s => s.value !== 'all').map(s => s.label.toLowerCase());

export const LocationSelectionModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setSelectedState } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    if (!localStorage.getItem(LOCATION_SELECTED_KEY)) {
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStateSelect = async (stateName: string) => {
    const normalizedState = stateName.toLowerCase().replace('fct ', '');
    const matchedState = STATES.find(s => s.label.toLowerCase() === stateName.toLowerCase() || s.value === normalizedState);
    const filterState: State = matchedState && matchedState.value !== 'all' ? matchedState.value : 'all';
    setSelectedState(filterState);
    if (user?.id) {
      try { await supabase.from('profiles').update({ preferred_state: stateName.toLowerCase() }).eq('user_id', user.id); } catch {}
    }
    localStorage.setItem(LOCATION_SELECTED_KEY, 'true');
    setIsOpen(false);
  };

  const handleAllNigeria = () => { setSelectedState('all'); localStorage.setItem(LOCATION_SELECTED_KEY, 'true'); setIsOpen(false); };

  const availableStates = ALL_NIGERIA_STATES.filter(state => {
    const n = state.toLowerCase().replace('fct ', '');
    return FILTER_STATES.includes(n as State) || FILTER_STATE_LABELS.includes(state.toLowerCase());
  });
  const unavailableStates = ALL_NIGERIA_STATES.filter(state => !availableStates.includes(state));

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4"><div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"><MapPin className="h-8 w-8 text-primary" /></div></div>
          <DialogTitle className="text-2xl">Where are you located?</DialogTitle>
          <DialogDescription className="text-base">We'll show you produce available near you</DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-6">
          <Button onClick={handleAllNigeria} variant="outline" className="w-full h-14 text-lg justify-start gap-3 hover:bg-primary/5 hover:border-primary"><Globe className="h-5 w-5 text-primary" />All Nigeria - Browse Everything</Button>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2"><Check className="h-4 w-4 text-green-600" />States with listings</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableStates.map(state => <Button key={state} onClick={() => handleStateSelect(state)} variant="outline" className="h-12 justify-start hover:bg-primary hover:text-primary-foreground"><MapPin className="h-4 w-4 mr-2 flex-shrink-0" /><span className="truncate">{state}</span></Button>)}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Other states (will show all listings)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {unavailableStates.map(state => <Button key={state} onClick={() => handleStateSelect(state)} variant="ghost" className="h-10 justify-start text-muted-foreground hover:text-foreground"><span className="truncate">{state}</span></Button>)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
