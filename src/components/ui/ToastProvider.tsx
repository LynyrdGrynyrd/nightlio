/**
 * ToastProvider - Backwards-compatible wrapper around shadcn toast
 * 
 * This component maintains the existing ToastProvider API (useToast().show())
 * while internally using shadcn/ui toast primitives.
 * 
 * For new code, prefer using the shadcn toast directly:
 * import { toast } from '@/components/ui/use-toast';
 * toast({ title: "...", description: "..." });
 */
import { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { toast as shadcnToast } from './use-toast';
import { Toaster } from './toaster';

// ========== Types ==========

type ToastType = 'info' | 'success' | 'error';

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
}

interface ToastProviderProps {
  children: ReactNode;
}

// ========== Context ==========

const ToastContext = createContext<ToastContextValue>({
  show: () => { },
});

// ========== Provider ==========

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const show = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    // Map toast types to shadcn variants
    const variant = type === 'error' ? 'destructive' as const : 'default' as const;

    const { dismiss } = shadcnToast({
      description: message,
      variant,
      // Add a colored border based on type using className
      className: type === 'success'
        ? 'border-l-4 border-l-green-500'
        : type === 'error'
          ? 'border-l-4 border-l-red-500'
          : 'border-l-4 border-l-blue-500',
    });

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};

// ========== Hook ==========

export const useToast = (): ToastContextValue => useContext(ToastContext);
