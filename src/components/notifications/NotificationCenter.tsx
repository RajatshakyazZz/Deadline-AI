import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications, DBNotification } from '../../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Split notifications into TODAY and YESTERDAY/OLDER
  const todayList: DBNotification[] = [];
  const olderList: DBNotification[] = [];

  const todayDateStr = new Date().toDateString();

  notifications.forEach((notif) => {
    const notifDateStr = new Date(notif.createdAt).toDateString();
    if (notifDateStr === todayDateStr) {
      todayList.push(notif);
    } else {
      olderList.push(notif);
    }
  });

  return (
    <div ref={containerRef} className="relative z-40">
      {/* Bell trigger button */}
      <button
        id="bell-notification-trigger"
        onClick={() => setIsOpen(prev => !prev)}
        className="p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer relative group flex items-center justify-center"
      >
        <Bell className="w-[22px] h-[22px] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />

        {/* Unread badge with pulse animation and spring scale */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 14 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 border border-[#0d121e] text-[10px] font-extrabold text-white flex items-center justify-center shadow-lg"
            >
              {unreadCount > 9 ? '9+' : unreadCount}

              {/* Infinite ambient glow pulse */}
              <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping -z-10" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Menu panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-[52px] right-0 w-[380px] max-h-[500px] flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(13, 18, 30, 0.96)',
              backdropFilter: 'blur(45px)',
              WebkitBackdropFilter: 'blur(45px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header row */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white tracking-tight">🔔 Notifications</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-white/5 text-slate-400">
                  {unreadCount} unread
                </span>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-[10px] font-extrabold text-[#63B3ED] hover:text-[#9F7AEA] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Mark all ✓
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Notification settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable list content */}
            <div className="flex-grow overflow-y-auto p-3 space-y-4 max-h-[380px] scrollbar-none">
              {notifications.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
                  <div className="p-3 rounded-full bg-white/5 text-slate-500">
                    <Bell className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">All caught up! No active notifications.</span>
                </div>
              ) : (
                <>
                  {/* TODAY group */}
                  {todayList.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[9px] font-mono font-extrabold tracking-widest text-slate-500 uppercase px-1">
                        TODAY
                      </div>
                      {todayList.map((notif) => (
                        <NotificationItem
                          key={notif.id}
                          notification={notif}
                          onRead={markAsRead}
                          onDismiss={dismissNotification}
                        />
                      ))}
                    </div>
                  )}

                  {/* OLDER group */}
                  {olderList.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[9px] font-mono font-extrabold tracking-widest text-slate-500 uppercase px-1">
                        YESTERDAY & OLDER
                      </div>
                      {olderList.map((notif) => (
                        <NotificationItem
                          key={notif.id}
                          notification={notif}
                          onRead={markAsRead}
                          onDismiss={dismissNotification}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer row */}
            <div className="p-3 border-t border-white/5 text-center flex items-center justify-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="text-xs font-extrabold text-[#63B3ED] hover:text-[#9F7AEA] transition-colors tracking-wide flex items-center gap-1 cursor-pointer"
              >
                View all notifications →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
