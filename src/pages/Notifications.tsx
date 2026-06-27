import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Send, 
  BellOff, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Zap, 
  RefreshCw, 
  Award, 
  Sparkles,
  Smartphone,
  Check,
  Server,
  Terminal,
  Trash2
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { requestNotificationPermission, getSafeNotificationPermission } from '../services/messaging';
import { playNotificationSound } from '../utils/notificationSound';
import { safeStorage } from '../utils/storage';
import confetti from 'canvas-confetti';

interface NotificationLog {
  id: string;
  time: string;
  type: string;
  title: string;
  body: string;
  status: 'sent' | 'delivered' | 'clicked';
}

export const Notifications: React.FC = () => {
  const { 
    user, 
    notificationPreferences, 
    updateNotificationPrefs, 
    testPushNotification,
    notificationSupport 
  } = useApp();

  const [isLight, setIsLight] = useState(document.body.classList.contains('light-theme'));
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');
  const [selectedTemplate, setSelectedTemplate] = useState<'habit_reminder' | 'streak_milestone' | 'deadline_alert'>('habit_reminder');
  const [soundEnabled, setSoundEnabled] = useState(() => safeStorage.getItem('notif_sound') !== 'false');

  const handleToggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    safeStorage.setItem('notif_sound', String(newVal));
    if (newVal) {
      playNotificationSound('success');
    }
  };

  // Interactive logs stored in local storage
  const [logs, setLogs] = useState<NotificationLog[]>([]);

  // Monitor Theme Changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.body.classList.contains('light-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Load logs
    const cachedLogs = safeStorage.getItem(`deadlineai_notif_logs_${user?.uid || 'guest'}`);
    if (cachedLogs) {
      try { setLogs(JSON.parse(cachedLogs)); } catch (_) {}
    } else {
      // Default initial logging entries
      const initialLogs: NotificationLog[] = [
        {
          id: 'log-1',
          time: new Date(Date.now() - 3600000).toLocaleTimeString(),
          type: 'System Core',
          title: 'Neural FCM Gateway Initialized',
          body: 'Subscribed to deadline milestones updates successfully.',
          status: 'delivered'
        }
      ];
      setLogs(initialLogs);
    }

    return () => observer.disconnect();
  }, [user?.uid]);

  const saveLogs = (updatedLogs: NotificationLog[]) => {
    setLogs(updatedLogs);
    safeStorage.setItem(`deadlineai_notif_logs_${user?.uid || 'guest'}`, JSON.stringify(updatedLogs));
  };

  useEffect(() => {
    setPermission(getSafeNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission(user?.uid || 'guest');
    setPermission(getSafeNotificationPermission());
    
    // Add log
    const newLog: NotificationLog = {
      id: `log-${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      type: 'Permission Update',
      title: `System Permission: ${getSafeNotificationPermission().toUpperCase()}`,
      body: `Permission configuration changed by client.`,
      status: 'delivered'
    };
    saveLogs([newLog, ...logs]);
  };

  const handleTestNotification = async () => {
    setDispatchStatus('sending');
    
    let templateTitle = 'Daily Routine Check';
    let templateBody = 'Your daily schedule and micro-actions are ready. Tap to focus!';
    if (selectedTemplate === 'streak_milestone') {
      templateTitle = '🔥 Streak Milestone Achieved!';
      templateBody = 'Outstanding momentum! You completed 4 consecutive study daily goals.';
    } else if (selectedTemplate === 'deadline_alert') {
      templateTitle = '⚡ Crucial Clock Alarm';
      templateBody = 'Urgent tasks are due in 2 hours. Tap to view schedule.';
    }

    try {
      const res = await testPushNotification(templateTitle, templateBody, selectedTemplate);
      if (res) {
        setDispatchStatus('success');
        
        // Add log entry
        const newLog: NotificationLog = {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: selectedTemplate === 'habit_reminder' ? 'Routine' : selectedTemplate === 'streak_milestone' ? 'Streak' : 'Deadline',
          title: templateTitle,
          body: templateBody,
          status: 'delivered'
        };
        const updatedLogs = [newLog, ...logs];
        saveLogs(updatedLogs);

        // Burst confetti for milestone tests!
        if (selectedTemplate === 'streak_milestone') {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 }
          });
        }

        setTimeout(() => {
          setDispatchStatus('idle');
        }, 3000);
      } else {
        setDispatchStatus('failed');
      }
    } catch (e) {
      console.error(e);
      setDispatchStatus('failed');
    }
  };

  const handleClearLogs = () => {
    saveLogs([]);
  };

  const currentPrefs = notificationPreferences || {
    deadlines: true,
    habits: true,
    briefings: true,
    system: true
  };

  // Stagger wrapper variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 140 } }
  };

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto pb-12">
      
      {/* Header bar */}
      <div className="flex flex-col gap-1">
        <h2 className={`text-2xl md:text-3xl font-sans font-extrabold tracking-tight ${
          isLight ? 'text-slate-800' : 'text-slate-100'
        }`}>Reminders & Notifications</h2>
        <p className={`text-xs md:text-sm font-medium ${
          isLight ? 'text-slate-500' : 'text-[#A0AEC0]'
        } font-sans`}>
          Manage how and when you receive push notifications and deadline reminders.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Card 1: Connection Status Banner */}
        <motion.div
          variants={itemVariants}
          className={`p-6 md:col-span-3 rounded-2xl border ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-800 shadow-sm' 
              : 'bg-[#0f1423] border-white/5 text-[#f8fafc] shadow-md'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                permission === 'granted' 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : permission === 'denied' 
                    ? 'bg-rose-500/10 text-rose-400' 
                    : 'bg-amber-500/10 text-amber-400'
              }`}>
                {permission === 'granted' ? (
                  <Bell className="w-6 h-6 animate-pulse" />
                ) : permission === 'denied' ? (
                  <BellOff className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">
                  {permission === 'granted' 
                    ? 'Browser Notifications Active' 
                    : permission === 'denied' 
                      ? 'Browser Notifications Blocked' 
                      : 'Enable Browser Reminders'}
                </h3>
                <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {permission === 'granted'
                    ? 'Real-time push reminders are active. You will receive notifications when you have upcoming deadlines.'
                    : permission === 'denied'
                      ? 'Push notifications are blocked in your browser. Please clear the site permissions to re-enable.'
                      : 'Allow browser notifications so we can warn you of tight deadlines and streak records.'}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0">
              {permission !== 'granted' ? (
                <button
                  onClick={handleRequestPermission}
                  disabled={permission === 'denied'}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                    permission === 'denied'
                      ? 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  Request Permission
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-500 tracking-wider">ACTIVE</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Left Area: Preferences and Live Dispatcher */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Card 2: Notification Preferences */}
          <motion.div
            variants={itemVariants}
            className={`p-6 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.01] border-white/5 shadow-md'
            } space-y-5`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-500">Preference Settings</h4>
              </div>
              <span className="text-[9px] font-mono text-slate-400 font-bold">SAVED AUTOMATICALLY</span>
            </div>

            <div className="space-y-4">
              {/* Toggle 1: Deadlines */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-indigo-500/20 transition-all">
                <div className="pr-4">
                  <h5 className="text-sm font-bold">Task Deadline Warnings</h5>
                  <p className="text-xs text-slate-400 mt-0.5">Receive high-urgency warnings when tasks are due within 12 hours.</p>
                </div>
                <button
                  onClick={() => updateNotificationPrefs({
                    deadlines: !currentPrefs.deadlines
                  })}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 relative flex items-center ${
                    currentPrefs.deadlines ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    currentPrefs.deadlines ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 2: Briefings */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-indigo-500/20 transition-all">
                <div className="pr-4">
                  <h5 className="text-sm font-bold">Daily Summaries & AI Briefings</h5>
                  <p className="text-xs text-slate-400 mt-0.5">Get daily notification trays containing morning routines and focus reports.</p>
                </div>
                <button
                  onClick={() => updateNotificationPrefs({
                    briefings: !currentPrefs.briefings
                  })}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 relative flex items-center ${
                    currentPrefs.briefings ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    currentPrefs.briefings ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 3: Habits */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-indigo-500/20 transition-all">
                <div className="pr-4">
                  <h5 className="text-sm font-bold">Streak Milestones</h5>
                  <p className="text-xs text-slate-400 mt-0.5">Receive alerts when hitting key study milestones and daily streak goals.</p>
                </div>
                <button
                  onClick={() => updateNotificationPrefs({
                    habits: !currentPrefs.habits
                  })}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 relative flex items-center ${
                    currentPrefs.habits ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    currentPrefs.habits ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 4: System */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-indigo-500/20 transition-all">
                <div className="pr-4">
                  <h5 className="text-sm font-bold">System Alerts & Logs</h5>
                  <p className="text-xs text-slate-400 mt-0.5">Stay informed about safety check-ins and backend configuration updates.</p>
                </div>
                <button
                  onClick={() => updateNotificationPrefs({
                    system: !currentPrefs.system
                  })}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 relative flex items-center ${
                    currentPrefs.system ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    currentPrefs.system ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 5: Audio Feedback */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/[0.01] border border-slate-100 dark:border-white/5 hover:border-indigo-500/20 transition-all">
                <div className="pr-4">
                  <h5 className="text-sm font-bold">Subtle Audio Feedback</h5>
                  <p className="text-xs text-slate-400 mt-0.5">Play synth-generated tone alerts when notifications arrive in-app.</p>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 relative flex items-center ${
                    soundEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Test Notification Dispatcher */}
          <motion.div
            variants={itemVariants}
            className={`p-6 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.01] border-white/5 shadow-md'
            } space-y-4`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2 text-indigo-500">
                <Send className="w-4 h-4" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider">Test Notifications</h4>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Select a reminder template below and send a test notification directly to this browser to confirm compatibility.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedTemplate('habit_reminder')}
                className={`px-4 py-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTemplate === 'habit_reminder'
                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 text-slate-400'
                }`}
              >
                <Clock className="w-4 h-4 mb-2" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Daily Reminder</div>
                  <div className="text-[10px] mt-0.5 opacity-80">Daily routine check</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTemplate('streak_milestone')}
                className={`px-4 py-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTemplate === 'streak_milestone'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 text-slate-400'
                }`}
              >
                <Award className="w-4 h-4 mb-2" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Streak Alert</div>
                  <div className="text-[10px] mt-0.5 opacity-80">Milestone unlocked</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedTemplate('deadline_alert')}
                className={`px-4 py-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTemplate === 'deadline_alert'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 text-slate-400'
                }`}
              >
                <Zap className="w-4 h-4 mb-2" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Deadline Alarm</div>
                  <div className="text-[10px] mt-0.5 opacity-80">Urgent task warning</div>
                </div>
              </button>
            </div>

            <button
              onClick={handleTestNotification}
              disabled={permission !== 'granted' || dispatchStatus === 'sending'}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2 ${
                permission !== 'granted'
                  ? 'bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-white/10 cursor-not-allowed'
                  : dispatchStatus === 'sending'
                    ? 'bg-amber-500 text-white animate-pulse'
                    : dispatchStatus === 'success'
                      ? 'bg-emerald-500 text-white'
                      : dispatchStatus === 'failed'
                        ? 'bg-rose-500 text-white'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              {dispatchStatus === 'sending' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {dispatchStatus === 'success' && <Check className="w-3.5 h-3.5" />}
              {dispatchStatus === 'idle' && <Send className="w-3.5 h-3.5" />}
              {dispatchStatus === 'sending' 
                ? 'Sending test...' 
                : dispatchStatus === 'success'
                  ? 'Notification Dispatched!'
                  : dispatchStatus === 'failed'
                    ? 'Blocked'
                    : 'Dispatch Test Notification'}
            </button>
          </motion.div>

        </div>

        {/* Right Area: Notification History */}
        <div className="md:col-span-1 space-y-6">
          
          <motion.div
            variants={itemVariants}
            className={`p-5 rounded-2xl border h-[420px] flex flex-col justify-between ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/[0.01] border-white/5 shadow-md'
            }`}
          >
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5 flex-shrink-0">
                <div className="flex items-center gap-2 text-violet-400">
                  <Bell className="w-4 h-4" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Notification History</span>
                </div>
                {logs.length > 0 && (
                  <button 
                    onClick={handleClearLogs}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scrollable logs list */}
              <div className="flex-grow space-y-3 overflow-y-auto pr-1 mt-3 scrollbar-none">
                {logs.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 text-xs font-medium">
                    No recent notifications.
                  </div>
                ) : (
                  logs.map((l) => (
                    <div key={l.id} className="text-xs border-b border-slate-100 dark:border-white/[0.02] pb-3 last:border-0">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-indigo-400 font-semibold">{l.time} • {l.type}</span>
                        <span className="uppercase text-[9px] font-bold text-emerald-500">
                          Delivered
                        </span>
                      </div>
                      <div className="text-slate-200 font-bold mt-1 truncate">{l.title}</div>
                      <div className="text-slate-400 mt-0.5 leading-normal text-[11px] line-clamp-2">{l.body}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-[9px] font-mono text-slate-500 border-t border-slate-100 dark:border-white/5 pt-2 flex items-center justify-between flex-shrink-0">
              <span>Ready for active deadlines</span>
              <span>v1.2.0</span>
            </div>
          </motion.div>

        </div>

      </motion.div>

    </div>
  );
};

