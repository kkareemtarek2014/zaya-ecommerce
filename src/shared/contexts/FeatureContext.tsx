'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { type FeatureKey, isFeatureEnabled } from '@/config/features.config';

interface FeatureContextType {
  isEnabled: (key: FeatureKey) => boolean;
}

const FeatureContext = createContext<FeatureContextType>({
  isEnabled: isFeatureEnabled,
});

export function FeatureProvider({ children }: { children: ReactNode }) {
  return (
    <FeatureContext.Provider value={{ isEnabled: isFeatureEnabled }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature(key: FeatureKey): boolean {
  const context = useContext(FeatureContext);
  return context.isEnabled(key);
}
