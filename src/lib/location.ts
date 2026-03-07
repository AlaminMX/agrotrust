import { STATES } from '@/types';

/**
 * Format location consistently as "State, Area" or just "State" if no area.
 */
export const formatLocation = (state: string | null | undefined, area?: string | null): string => {
  if (!state) return 'Nigeria';
  const stateLabel = STATES.find(s => s.value === state)?.label || state;
  if (area && area.trim()) {
    return `${stateLabel}, ${area.trim()}`;
  }
  return stateLabel;
};
