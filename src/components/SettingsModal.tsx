import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  CalendarDays, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  User, 
  Mail, 
  Clock, 
  Flame, 
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useApp } from './AppContext';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { 
    profile, 
    updateProfile, 
    googleAccessToken, 
    connectGoogleCalendar, 
    syncTaskToGoogleCalendar,
    tasks,
    isDemo
  } = useApp();

  const [isSyncingAll, setIsSyncingAll] = useState(false);

  if (!profile) return null;

  const totalFocusHours = ((profile.totalFocusMinutes || 0) / 60).toFixed(1);
  const unsyncedCount = tasks.filter(t => !t.completed && !t.googleEventId).length;

  const handleToggleSync = async () => {
    const nextState = !profile.googleCalendarSyncEnabled;
    
    if (nextState && !googleAccessToken) {
      // Connect first if enabling sync and token isn't present
      const token = await connectGoogleCalendar();
      if (token) {
        await updateProfile({ googleCalendarSyncEnabled: true });
      }
    } else {
      await updateProfile({ googleCalendarSyncEnabled: nextState });
    }
  };

  const handleSyncAllPending = async () => {
    if (!googleAccessToken) {
      await connectGoogleCalendar();
      return;
    }

    setIsSyncingAll(true);
    const unsyncedTasks = tasks.filter(t => !t.completed && !t.googleEventId);
    
    for (const task of unsyncedTasks) {
      try {
        await syncTaskToGoogleCalendar(task.id);
      } catch (err) {
        console.error(`Failed to sync task: ${task.title}`, err);
      }
    }
    setIsSyncingAll(false);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="bg-[#0C0E17] border border-white/10 rounded-2xl max-w-2xl w-full shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        id="settings-modal-container"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA]/30 border border-[#63B3ED]/20">
              <Sparkles className="w-5 h-5 text-[#63B3ED]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-white">System Settings</h2>
              <p className="text-xs font-medium text-gray-400 font-sans">Configure your profile & calendar synchronization</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            id="close-settings-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Left: Profile & Stats Overview */}
            <div className="md:col-span-2 space-y-4">
              <div className="liquid-glass p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative p-1 rounded-full bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA]">
                    <img 
                      referrerPolicy="no-referrer"
                      src={profile.photoURL} 
                      alt={profile.name} 
                      className="w-20 h-20 rounded-full border border-black/80 shadow-inner"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans truncate max-w-[180px]">{profile.name}</h3>
                    <p className="text-xs text-gray-400 font-sans truncate max-w-[180px]">{profile.email}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-[#63B3ED]">
                    {isDemo ? 'Guest Mode' : 'Account Connected'}
                  </span>
                </div>

                {/* Performance Stats */}
                <div className="border-t border-white/5 pt-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-sans">
                      <Clock className="w-3.5 h-3.5 text-[#63B3ED]" /> Total Focus
                    </span>
                    <span className="font-mono font-bold text-white">{totalFocusHours}h</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5 font-sans">
                      <Flame className="w-3.5 h-3.5 text-[#E53E3E]" /> Longest Streak
                    </span>
                    <span className="font-mono font-bold text-white">{profile.longestStreak || 0} days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Google Calendar Hub */}
            <div className="md:col-span-3 space-y-4">
              <div className="liquid-glass p-5 rounded-2xl border border-white/5 space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="w-5 h-5 text-[#63B3ED]" />
                    <h4 className="text-xs font-mono font-bold uppercase text-[#63B3ED] tracking-wider">
                      Google Calendar Integration
                    </h4>
                  </div>
                </div>

                {/* Switch Area */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white font-sans">Sync Task Deadlines</p>
                    <p className="text-[10px] font-medium text-gray-400 font-sans max-w-[200px]">
                      Automatically sync task deadlines directly to your GCal account.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={handleToggleSync}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer outline-none relative flex items-center ${
                      profile.googleCalendarSyncEnabled ? 'bg-emerald-500' : 'bg-white/10'
                    }`}
                    id="toggle-sync-switch"
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white shadow-md"
                      style={{
                        marginLeft: profile.googleCalendarSyncEnabled ? '20px' : '0px'
                      }}
                    />
                  </button>
                </div>

                {/* Connection Status & Trigger */}
                <div className="space-y-3">
                  {googleAccessToken ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium font-sans">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>Google Account Connected successfully</span>
                      </div>
                      
                      {unsyncedCount > 0 && (
                        <button
                          onClick={handleSyncAllPending}
                          disabled={isSyncingAll}
                          className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-white/5 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                          <span>Sync All Pending Deadlines ({unsyncedCount})</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-950/10 border border-yellow-500/10 text-yellow-400 text-[11px] leading-normal font-medium font-sans">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span>Authentication token is required to start syncing. Permissions are required to add/retrieve events.</span>
                      </div>

                      <button 
                        onClick={connectGoogleCalendar}
                        className="w-full gsi-material-button flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white text-gray-900 font-sans font-bold text-xs hover:bg-gray-10 transition-all shadow-md cursor-pointer"
                      >
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                        <span>Link Calendar Permissions</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Guide / Help */}
          <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-2.5">
            <h5 className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
              <HelpCircle className="w-4 h-4 text-[#9F7AEA]" /> How Calendar Synchronization Works:
            </h5>
            <ul className="list-disc list-inside space-y-1.5 text-[11px] text-gray-400 font-sans leading-relaxed pl-1">
              <li>Creates a <strong className="text-gray-300">1-hour time block</strong> directly preceding your deadline as a structured work window.</li>
              <li>Automatically embeds <strong className="text-gray-300">detailed AI context</strong>, checklists, and customized recommended workflows inside the event description.</li>
              <li>Color-codes calendar events dynamically based on task complexity (e.g. Red for critical, Yellow for high risk, Blue for standard tasks).</li>
              <li>Disables sync blocks or updates title metadata when tasks are toggled complete.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/[0.01] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
            id="close-settings-footer-btn"
          >
            Close Settings
          </button>
        </div>
      </motion.div>
    </div>
  );
};
