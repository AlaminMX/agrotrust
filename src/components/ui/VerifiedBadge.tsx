import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'default' | 'prominent';
}

export const VerifiedBadge = ({ 
  className, 
  size = 'md', 
  showText = true,
  variant = 'default'
}: VerifiedBadgeProps) => {
  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (variant === 'prominent') {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold px-2.5 py-1 rounded-full",
          textSizes[size],
          className
        )}
      >
        <ShieldCheck className={cn(iconSizes[size])} />
        {showText && <span>Verified Farmer</span>}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-primary font-medium",
        textSizes[size],
        className
      )}
    >
      <ShieldCheck className={cn(iconSizes[size], "fill-primary/20")} />
      {showText && <span>Verified</span>}
    </span>
  );
};
