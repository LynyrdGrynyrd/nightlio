import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';

// ========== Types ==========

type ToastType = 'info' | 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, duration?: number) => void;
}

interface ToastProviderProps {
  children: ReactNode;
}

// ========== Context ==========

const ToastContext = createContext<ToastContextValue>({
  show: (_msg: string, _type?: ToastType) => {},
});

// ========== Provider ==========

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    if (duration > 0) setTimeout(() => remove(id), duration);
  }, [remove]);

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} onClick={() => remove(t.id)}>
            {t.message}
          </div>
        ))}
      </div>
      <style>
        {`
        .toast-container {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: 90px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 1000;
        }
        .toast {
          padding: 10px 14px;
          border-radius: 10px;
          background: var(--bg-card);
          box-shadow: var(--shadow-2);
          border: 1px solid var(--border);
          color: var(--fg-strong);
          cursor: pointer;
          min-width: 220px;
          text-align: center;
        }
  .toast--success { border-color: color-mix(in oklab, var(--success), transparent 60%); }
  .toast--error { border-color: color-mix(in oklab, var(--danger), transparent 60%); }
  .toast--info { border-color: color-mix(in oklab, var(--accent-600), transparent 60%); }
        `}
      </style>
    </ToastContext.Provider>
  );
};

// ========== Hook ==========

export const useToast = (): ToastContextValue => useContext(ToastContext);
