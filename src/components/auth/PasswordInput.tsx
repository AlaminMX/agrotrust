import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  showStrength?: boolean;
  required?: boolean;
}

const getStrength = (password: string): { level: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-destructive' };
  if (score <= 4) return { level: 2, label: 'Medium', color: 'bg-orange' };
  return { level: 3, label: 'Strong', color: 'bg-green-500' };
};

export const PasswordInput = ({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  showStrength = false,
  required = false,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const strength = getStrength(value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  level <= strength.level ? strength.color : 'bg-muted'
                )}
              />
            ))}
          </div>
          <p className={cn('text-xs', strength.level === 1 ? 'text-destructive' : strength.level === 2 ? 'text-orange' : 'text-green-500')}>
            Password strength: {strength.label}
          </p>
        </div>
      )}
    </div>
  );
};
