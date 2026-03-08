import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { State } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const STATE_STORAGE_KEY = 'agrotrust_state';

interface LocationContextType {
  selectedState: State;
  setSelectedState: (state: State) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const loadStateFromStorage = (): State => {
  try {
    const stored = localStorage.getItem(STATE_STORAGE_KEY);
    return (stored as State) || 'all';
  } catch {
    return 'all';
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedState, setSelectedStateInternal] = useState<State>(() => loadStateFromStorage());

  useEffect(() => {
    localStorage.setItem(STATE_STORAGE_KEY, selectedState);
  }, [selectedState]);

  // Auto-set state from user profile if logged in and no explicit selection
  useEffect(() => {
    const setFromProfile = async () => {
      const stored = localStorage.getItem(STATE_STORAGE_KEY);
      // Only auto-set if user hasn't explicitly chosen a state
      if (stored && stored !== 'all') return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_state')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profile?.preferred_state && profile.preferred_state !== 'all') {
        setSelectedStateInternal(profile.preferred_state as State);
      }
    };
    setFromProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') setFromProfile();
      if (event === 'SIGNED_OUT') setSelectedStateInternal('all');
    });
    return () => subscription.unsubscribe();
  }, []);

  const setSelectedState = useCallback((state: State) => {
    setSelectedStateInternal(state);
  }, []);

  return (
    <LocationContext.Provider value={{ selectedState, setSelectedState }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
