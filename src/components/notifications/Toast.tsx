import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertTriangle, Info, Sparkles, AlertCircle, X } from 'lucide-react';
import { playNotificationSound } from '../../utils/notificationSound';
import { safeStorage } from '../../utils/storage';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'ai' | 'crisis';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  persistent: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  duration,
  persistent,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isHovered, setIsHovered] = useState(false);
  const soundPlayedRef = useRef(false);

  // Sound alert triggered on creation (respecting user setting)
  useEffect(() => {
    if (!soundPlayedRef.current) {
      soundPlayedRef.current = true;
      const soundEnabled = safeStorage.getItem('notif_sound') !== 'false';
      if (soundEnabled) {
        if (type === 'success') playNotificationSound('success');
        else if (type === 'error') playNotificationSound('success'); // fallback
        else if (type === 'warning') playNotificationSound('warning');
        else if (type === 'crisis') playNotificationSound('crisis');
        else playNotificationSound('success');
      }
    }
  }, [type]);

  // Countdown and pause on hover logic
  useEffect(() => {
    if (persistent || isHovered) return;

    const intervalTime = 20; // 50fps smooth updates
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= intervalTime) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - intervalTime;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isHovered, persistent, onClose]);

  // Styling based on type
  let accentColor = '#3B82F6'; // Default Info (Blue)
  let iconColor = 'text-blue-400';
  let IconComponent = Info;
  let borderLeftStyle = 'border-l-[3px] border-l-blue-500';
  let containerBg = 'rgba(13, 18, 30, 0.95)';
  let isCrisis = type === 'crisis';

  if (type === 'success') {
    accentColor = '#10B981'; // Green
    iconColor = 'text-emerald-400';
    IconComponent = CheckCircle;
    borderLeftStyle = 'border-l-[3px] border-l-emerald-500';
  } else if (type === 'error') {
    accentColor = '#EF4444'; // Red
    iconColor = 'text-rose-400';
    IconComponent = AlertCircle;
    borderLeftStyle = 'border-l-[3px] border-l-rose-500';
  } else if (type === 'warning') {
    accentColor = '#F59E0B'; // Orange
    iconColor = 'text-amber-400';
    IconComponent = AlertTriangle;
    borderLeftStyle = 'border-l-[3px] border-l-amber-500';
  } else if (type === 'ai') {
    accentColor = '#8B5CF6'; // Purple
    iconColor = 'text-purple-400';
    IconComponent = Sparkles;
    borderLeftStyle = 'border-l-[3px] border-l-purple-500';
  } else if (type === 'crisis') {
    accentColor = '#EF4444'; // Red Pulse
    iconColor = 'text-red-500 animate-pulse';
    IconComponent = AlertCircle;
    borderLeftStyle = 'border-l-[3px] border-l-red-600';
  }

  const progressPercent = persistent ? 0 : (timeLeft / duration) * 100;

  return (
    <div
      id={`toast-${type}`}
      className={`relative select-none pointer-events-auto rounded-[14px] p-[14px_16px] min-w-[300px] max-w-[400px] flex flex-col gap-2.5 transition-all duration-300 ${borderLeftStyle} ${
        isCrisis ? 'animate-[pulse_2s_infinite]' : ''
      }`}
      style={{
        background: containerBg,
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Upper row: Icon, Title, and Close Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <IconComponent className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
          <h4 className="text-sm font-bold text-[#F7FAFC] leading-none tracking-tight">{title}</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtitle Message */}
      {message && (
        <p className="text-xs text-slate-400 leading-relaxed pl-7.5">{message}</p>
      )}

      {/* Progress Bar (if not persistent) */}
      {!persistent && (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1 pl-7.5">
          <div
            className="h-full rounded-full transition-all duration-20 ease-linear"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>
      )}
    </div>
  );
};
