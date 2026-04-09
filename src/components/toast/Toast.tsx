import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import './Toast.css';

// ── Types ──────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

// ── Context ────────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

// ── Icons ──────────────────────────────────────────────────────────────────────
const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

// ── Provider ───────────────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]); // max 5 at once

    const timer = setTimeout(() => dismiss(id), 4000);
    timers.current.set(id, timer);
  }, [dismiss]);

  // Listen for global glitch errors from non-react contexts (Self-Healing Reporting)
  useEffect(() => {
    const handler = (e: any) => {
      const message = e.detail?.message || 'GLOBAL SYSTEM UNSTABLE';
      toast(message, 'error');
    };
    window.addEventListener('app-error-glitch', handler);
    return () => window.removeEventListener('app-error-glitch', handler);
  }, [toast]);

  const value: ToastContextValue = {
    toast,
    success: (msg) => toast(msg, 'success'),
    error:   (msg) => toast(msg, 'error'),
    warning: (msg) => toast(msg, 'warning'),
    info:    (msg) => toast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" role="region" aria-label="Notifications">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast--${t.type}`}
            role="alert"
            onClick={() => dismiss(t.id)}
          >
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" aria-label="Dismiss">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ── Hook ───────────────────────────────────────────────────────────────────────
export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
