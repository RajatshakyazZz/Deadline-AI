import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  Calendar, 
  Timer, 
  Flame, 
  Info,
  X
} from 'lucide-react';
import { DBNotification } from '../../hooks/useNotifications';

interface NotificationItemProps {
  notification: DBNotification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onDismiss
}) => {
  const navigate = useNavigate();

  // Pick icon & colors based on type
  let Icon = Info;
  let iconBg = 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  if (notification.type === 'crisis') {
    Icon = AlertCircle;
    iconBg = 'bg-rose-500/15 text-rose-400 border-rose-500/20';
  } else if (notification.type === 'warning') {
    Icon = AlertTriangle;
    iconBg = 'bg-amber-500/15 text-amber-400 border-amber-500/20';
  } else if (notification.type === 'complete') {
    Icon = CheckCircle;
    iconBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  } else if (notification.type === 'ai') {
    Icon = Sparkles;
    iconBg = 'bg-purple-500/15 text-purple-400 border-purple-500/20';
  } else if (notification.type === 'calendar') {
    Icon = Calendar;
    iconBg = 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  } else if (notification.type === 'focus') {
    Icon = Timer;
    iconBg = 'bg-teal-500/15 text-teal-400 border-teal-500/20';
  } else if (notification.type === 'streak') {
    Icon = Flame;
    iconBg = 'bg-orange-500/15 text-orange-400 border-orange-500/20';
  }

  const handleItemClick = (e: React.MouseEvent) => {
    // If clicking target is a button or children of button, ignore
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    onRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getRelativeTimeString = (isoString: string) => {
    try {
      const ms = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return 'now';
      if (mins < 60) return `${mins}m`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h`;
      const days = Math.floor(hrs / 24);
      return `${days}d`;
    } catch (_) {
      return '';
    }
  };

  return (
    <div
      onClick={handleItemClick}
      className={`p-3.5 rounded-xl border border-white/5 transition-all duration-200 cursor-pointer flex gap-3 relative group overflow-hidden ${
        notification.read 
          ? 'bg-white/[0.01] hover:bg-white/[0.03]' 
          : 'bg-white/[0.04] hover:bg-white/[0.06] border-l-[3px] border-l-blue-500'
      }`}
    >
      {/* Unread circle badge */}
      {!notification.read && (
        <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}

      {/* Category Icon */}
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Main Column */}
      <div className="flex-grow min-w-0 pr-4">
        <div className="flex items-start justify-between gap-2">
          <h5 className="text-xs font-bold text-[#F7FAFC] truncate">{notification.title}</h5>
          <span className="text-[10px] text-slate-500 font-mono font-bold flex-shrink-0 whitespace-nowrap">
            {getRelativeTimeString(notification.createdAt)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-normal line-clamp-2">
          {notification.message}
        </p>

        {/* Action button if related to a page */}
        {notification.actionUrl && (
          <button
            onClick={() => {
              onRead(notification.id);
              navigate(notification.actionUrl!);
            }}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors mt-2 uppercase tracking-wider flex items-center gap-0.5"
          >
            View →
          </button>
        )}
      </div>

      {/* Dismiss Button on Right Hover */}
      <button
        onClick={() => onDismiss(notification.id)}
        className="absolute right-2 top-3 p-1 rounded-md bg-transparent hover:bg-white/10 text-slate-500 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
        title="Dismiss alert"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
