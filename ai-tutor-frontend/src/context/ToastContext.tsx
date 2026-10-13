import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { ToastContainer, type ToastItem, type ToastType } from '../components/common/Toast';

export interface ToastOptions {
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toast: {
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    info: (message: string, options?: ToastOptions) => string;
    warning: (message: string, options?: ToastOptions) => string;
    custom: (item: Omit<ToastItem, 'id'>) => string;
  };
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_VISIBLE_TOASTS = 5;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback((item: Omit<ToastItem, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = { ...item, id };

    setToasts((prev) => {
      const updated = [...prev, newToast];
      // Keep only up to MAX_VISIBLE_TOASTS
      if (updated.length > MAX_VISIBLE_TOASTS) {
        return updated.slice(updated.length - MAX_VISIBLE_TOASTS);
      }
      return updated;
    });

    return id;
  }, []);

  const toastMethods = useMemo(() => {
    const createTypedToast = (type: ToastType) => (message: string, options?: ToastOptions) => {
      return addToast({
        type,
        message,
        title: options?.title,
        duration: options?.duration ?? 4000,
        action: options?.action,
      });
    };

    return {
      success: createTypedToast('success'),
      error: createTypedToast('error'),
      info: createTypedToast('info'),
      warning: createTypedToast('warning'),
      custom: addToast,
    };
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toast: toastMethods,
        dismiss,
        dismissAll,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} position="bottom-right" />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export type { ToastItem, ToastType };
