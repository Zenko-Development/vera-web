// features/alert/alert-store.tsx
'use client';

import { createContext, useContext, useCallback } from "react";
import { Toaster, toast } from "@/components/ui/toast";

type AlertType = "default" | "success" | "info" | "warning" | "error" | "loading";

interface AlertOptions {
  title?: string;
  description?: string;
  type?: AlertType;
  duration?: number;
  priority?: "low" | "high";
  actionProps?: {
    children: React.ReactNode;
    onClick: () => void;
  };
}

type AlertContextType = (alert: AlertOptions) => void;

const AlertContext = createContext<AlertContextType>(() => {});

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const showAlert = useCallback((alert: AlertOptions) => {
    const { 
      title, 
      description, 
      type = "default", 
      duration,
      priority,
      actionProps 
    } = alert;

    const id = toast.add({
      title,
      description,
      type,
      priority,
      actionProps,
    });

    // Авто-закрытие через duration
    if (duration) {
      setTimeout(() => {
        toast.close(id);
      }, duration);
    }
  }, []);

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <Toaster />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};