// features/api/ApiInitializer.tsx
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { sessionController } from "@/entities/auth/controller/session.controller";
import { initApiClient, resetApiClient } from "@/shared/api/client";
import { AUTH_FAILURE_EVENT, tokenStorage } from "@/shared/lib/storage";

const ApiContext = createContext<{ isInitialized: boolean }>({ isInitialized: false });

export const useApiInitialized = () => useContext(ApiContext);

export function ApiInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    initApiClient({
      fetchImpl: window.fetch.bind(window),
      getAccessToken: tokenStorage.getAccess,
      refresh: async () => {
        const tokens = await sessionController.refresh();
        return tokens
          ? {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
            }
          : null;
      },
      onAuthFailure: () => {
        tokenStorage.clear();
        window.dispatchEvent(new Event(AUTH_FAILURE_EVENT));
      },
    });

    setIsInitialized(true);

    return () => {
      resetApiClient();
      isInitializedRef.current = false;
    };
  }, []);

  return (
    <ApiContext.Provider value={{ isInitialized }}>
      {children}
    </ApiContext.Provider>
  );
}
