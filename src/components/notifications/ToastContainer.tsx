import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toast, ToastType } from './Toast';
import { useToast, ToastItem } from '../../hooks/useToast';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  // Show only up to 3 visible toasts. If more, we slice to show the latest 3.
  const visibleToasts = toasts.slice(-3);

  return (
    <div
      id="toast-container"
      className="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-3 w-full max-w-[400px] pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              x: '-120%', 
              height: 0,
              transition: { duration: 0.3, ease: 'easeIn' }
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
            }}
            className="w-full"
          >
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              persistent={toast.persistent}
              onClose={() => removeToast(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
