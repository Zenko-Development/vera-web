// features/api/ApiInitializer.tsx
'use client';

import { useEffect, useState, createContext, useContext, useRef } from 'react';
import { useAlert } from '@/features/alert/alert-store';

const ApiContext = createContext<{ isInitialized: boolean }>({ isInitialized: false });

export const useApiInitialized = () => useContext(ApiContext);

export function ApiInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const showAlert = useAlert();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    console.log('[ApiInitializer] Initializing API client...');
    
    // Для моков просто устанавливаем флаг
    setIsInitialized(true);
    console.log('[ApiInitializer] API client initialized');
  }, []);

  return (
    <ApiContext.Provider value={{ isInitialized }}>
      {children}
    </ApiContext.Provider>
  );
}