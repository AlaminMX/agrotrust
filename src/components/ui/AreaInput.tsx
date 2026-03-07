import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { getAreaSuggestions } from '@/data/nigerianAreas';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';

interface AreaInputProps {
  value: string;
  onChange: (value: string) => void;
  state: string;
  placeholder?: string;
  className?: string;
}

export const AreaInput = ({ value, onChange, state, placeholder = 'e.g., Gwarimpa', className }: AreaInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuggestions(getAreaSuggestions(state, value));
  }, [state, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => { onChange(area); setIsOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors',
                value === area && 'bg-primary/5 text-primary font-medium'
              )}
            >
              {area}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
