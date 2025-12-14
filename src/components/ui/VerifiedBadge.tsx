import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const VerifiedBadge = ({ className, size = 'md', showText = true }: VerifiedBadgeProps) => {
  const sizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-gold font-medium",
        textSizes[size],
        className
      )}
    >
      <BadgeCheck className={cn(sizes[size], "fill-gold text-primary-foreground")} />
      {showText && <span>Verified</span>}
    </span>
  );
};
