import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AREA_SUGGESTIONS } from '@/data/nigerianAreas';

export function useAreaSuggestions(stateValue: string) {
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stateValue) { setAreas([]); return; }

    const fetchAreas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_areas' as any)
        .select('name')
        .eq('state_value', stateValue)
        .order('name');

      if (!error && data?.length) {
        setAreas((data as any[]).map(a => a.name));
      } else {
        setAreas(AREA_SUGGESTIONS[stateValue] || []);
      }
      setLoading(false);
    };
    fetchAreas();
  }, [stateValue]);

  const getFilteredAreas = (query: string) => {
    if (!query.trim()) return areas;
    const lower = query.toLowerCase();
    return areas.filter(a => a.toLowerCase().includes(lower));
  };

  return { areas, loading, getFilteredAreas };
}
