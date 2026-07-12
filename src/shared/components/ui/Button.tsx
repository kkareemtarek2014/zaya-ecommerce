import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-primary text-text-inverse hover:bg-brand-secondary shadow-sm',
  secondary: 'bg-brand-blush text-brand-secondary hover:bg-border',
  outline:
    'border border-border-strong text-text-primary hover:border-brand-primary hover:text-brand-primary bg-transparent',
  ghost: 'text-text-secondary hover:text-brand-primary bg-transparent',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-12 px-8 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', fullWidth, isLoading, className, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-(--radius) font-medium tracking-wide transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <svg className="h-5 w-5 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span className="opacity-0">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
