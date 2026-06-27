import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission, getSafeNotificationPermission } from '../../services/messaging';
import { registerServiceWorker } from '../../utils/pushNotifications';
import { useApp } from '../AppContext';

export const PermissionModal: React.FC = () => {
  const { user } = useApp();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if user is authenticated and hasn't made a decision yet
    if (!user) return;

    const currentPermission = getSafeNotificationPermission();
    if (currentPermission !== 'default') return;

    // Check if shown in this session
    let shownThisSession = 'false';
    try {
      shownThisSession = sessionStorage.getItem('deadlineai_push_modal_shown') || 'false';
    } catch (_) {}
    if (shownThisSession === 'true') return;

    // Slide up after 30 seconds (30000ms)
    const timer = setTimeout(() => {
      setShow(true);
      try {
        sessionStorage.setItem('deadlineai_push_modal_shown', 'true');
      } catch (_) {}
    }, 30000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleEnable = async () => {
    setShow(false);
    if (!user) return;
    try {
      const granted = await requestNotificationPermission(user.uid);
      if (granted === 'granted') {
        await registerServiceWorker();
      }
    } catch (err) {
      console.warn('Failed to enable push notifications:', err);
    }
  };

  const handleDismiss = () => {
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex items-center justify-center px-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', damping: 24, stiffness: 150 }}
            className="w-full max-w-md p-5 rounded-2xl border border-white/10 pointer-events-auto shadow-2xl relative overflow-hidden"
            style={{
              background: 'rgba(13, 18, 30, 0.95)',
              backdropFilter: 'blur(45px)',
              WebkitBackdropFilter: 'blur(45px)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Top Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute right-3.5 top-3.5 p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content Row */}
            <div className="flex gap-4 items-start pr-6">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-bounce" style={{ animationDuration: '3s' }}>
                <Bell className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-white tracking-tight leading-none">
                  🔔 Stay on top of your deadlines!
                </h4>
                <p className="text-xs text-slate-400 leading-normal font-medium">
                  Get high-urgency warnings and daily routine check-ins even when DeadlineAI is closed.
                </p>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Not now
              </button>
              <button
                onClick={handleEnable}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Enable 🔔
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
