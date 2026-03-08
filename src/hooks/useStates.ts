import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STATES } from '@/types';

interface PlatformState {
  value: string;
  label: string;
}

export function useStates() {
  const [states, setStates] = useState<PlatformState[]>(STATES.filter(s => s.value !== 'all'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStates = async () => {
      const { data, error } = await supabase
        .from('platform_states' as any)
        .select('value, label')
        .eq('is_active', true)
        .order('sort_order');

      if (!error && data?.length) {
        setStates(data as unknown as PlatformState[]);
      }
      setLoading(false);
    };
    fetchStates();
  }, []);

  const allStates = [{ value: 'all', label: 'All Nigeria' }, ...states];

  return { states, allStates, loading };
}
