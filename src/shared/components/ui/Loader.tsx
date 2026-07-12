import { Sparkles } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface LoaderProps {
  /** Full-height (default) centres in a 60vh area; set false for inline use. */
  fullscreen?: boolean;
  className?: string;
}

export function Loader({ fullscreen = true, className }: LoaderProps = {}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-6',
        fullscreen && 'min-h-[60vh]',
        className,
      )}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Outer rotating ring (jewelry/bracelet aesthetic) */}
        <div className="absolute inset-0 rounded-full border-y-2 border-brand-primary/40 animate-[spin_3s_linear_infinite]"></div>
        
        {/* Inner reverse rotating ring */}
        <div className="absolute inset-2 rounded-full border-x-2 border-brand-primary/60 animate-[spin_2s_linear_infinite_reverse]"></div>
        
        {/* Third delicate ring */}
        <div className="absolute inset-4 rounded-full border border-brand-primary/20 animate-[spin_4s_linear_infinite]"></div>
        
        {/* Soft glowing aura */}
        <div className="absolute inset-6 rounded-full bg-brand-blush/40 blur-md animate-pulse"></div>

        {/* Center spark (diamond/gem logic) */}
        <div className="relative flex h-10 w-10 items-center justify-center">
          <Sparkles className="h-6 w-6 text-brand-primary animate-pop" style={{ animationIterationCount: 'infinite', animationDuration: '2s' }} />
        </div>
      </div>
      <p className="font-(family-name:--font-display) text-sm font-medium tracking-widest text-text-muted animate-pulse uppercase">
        Curating elegance
      </p>
    </div>
  );
}
