import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer } from './notifications/ToastContainer';
import { ToastContext, ToastItem, ToastType, ToastOptions } from '../hooks/useToast';

export { useToast } from '../hooks/useToast';

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, message: string, type: ToastType, options?: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = options?.duration ?? 4000;
    const persistent = options?.persistent ?? false;

    const newToast: ToastItem = {
      id,
      type,
      title,
      message,
      duration,
      persistent,
    };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  // Compat + chained methods wrapper
  const showToastBase = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Legacy signature conversion
    const title = type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info';
    addToast(title, message, type as ToastType);
  }, [addToast]);

  // Construct showToast object with attached helper methods
  const showToast = showToastBase as any;
  showToast.success = (title: string, message = '', options?: ToastOptions) => addToast(title, message, 'success', options);
  showToast.error = (title: string, message = '', options?: ToastOptions) => addToast(title, message, 'error', options);
  showToast.warning = (title: string, message = '', options?: ToastOptions) => addToast(title, message, 'warning', options);
  showToast.info = (title: string, message = '', options?: ToastOptions) => addToast(title, message, 'info', options);
  showToast.ai = (title: string, message = '', options?: ToastOptions) => addToast(title, message, 'ai', options);
  showToast.crisis = (title: string, message = '', options?: ToastOptions) => addToast(title, message, 'crisis', options);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, showToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};
