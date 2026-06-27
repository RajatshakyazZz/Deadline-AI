import { createContext, useContext, useCallback, useState, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'ai' | 'crisis';

export interface ToastOptions {
  duration?: number;
  persistent?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  persistent: boolean;
}

export interface ToastContextType {
  toasts: ToastItem[];
  addToast: (title: string, message: string, type: ToastType, options?: ToastOptions) => void;
  removeToast: (id: string) => void;
  showToast: {
    (message: string, type?: 'success' | 'error' | 'info'): void; // Compatibility signature
    success: (title: string, message?: string, options?: ToastOptions) => void;
    error: (title: string, message?: string, options?: ToastOptions) => void;
    warning: (title: string, message?: string, options?: ToastOptions) => void;
    info: (title: string, message?: string, options?: ToastOptions) => void;
    ai: (title: string, message?: string, options?: ToastOptions) => void;
    crisis: (title: string, message?: string, options?: ToastOptions) => void;
  };
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
