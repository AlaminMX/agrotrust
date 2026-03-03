import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { State } from '@/types';

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
