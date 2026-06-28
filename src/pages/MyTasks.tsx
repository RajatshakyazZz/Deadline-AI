import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Mic, 
  Search, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Zap,
  MoreVertical,
  SlidersHorizontal,
  ChevronDown,
  BookOpen,
  Check,
  CalendarDays,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  ArrowDown,
  Plus
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { Task, CategoryType, ComplexityType } from '../types';
import { AddTaskModal } from '../components/AddTaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { CrisisModal } from '../components/CrisisModal';
import { callGemini } from '../services/gemini';
import { fetchUpcomingEvents, GoogleCalendarEvent } from '../services/googleCalendar';

// Self-updating Countdown Timer Component
const CountdownTimer: React.FC<{ deadline: string }> = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('Overdue');
        setIsUrgent(true);
        return;
      }

      const sec = Math.floor((diff / 1000) % 60);
      const min = Math.floor((diff / (1000 * 60)) % 60);
      const hour = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const day = Math.floor(diff / (1000 * 60 * 60 * 24));

      setIsUrgent(diff < 3 * 60 * 60 * 1000); // urgent if < 3 hours

      let formatted = '';
      if (day > 0) formatted += `${day}d `;
      if (hour > 0 || day > 0) formatted += `${hour}h `;
      formatted += `${min}m ${sec}s`;

      setTimeLeft(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={`font-mono text-xs font-bold ${isUrgent ? 'text-[#FC8181]' : 'text-[#63B3ED]'}`}>
      {timeLeft}
    </span>
  );
};

export const MyTasks: React.FC = () => {
  const { 
    tasks, 
    completeTask, 
    updateTask, 
    deleteTask,
    googleAccessToken,
    connectGoogleCalendar,
    syncTaskToGoogleCalendar,
    importGoogleCalendarEvent,
    isAddTaskOpen,
    setIsAddTaskOpen
  } = useApp();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#63B3ED', '#9F7AEA', '#FC8181', '#68D391', '#F6AD55'];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      vRot: number;
    }> = [];

    const spawnCount = 120;
    for (let i = 0; i < spawnCount; i++) {
      const fromLeft = i < spawnCount / 2;
      particles.push({
        x: fromLeft ? 0 : canvas.width,
        y: canvas.height * 0.8,
        vx: fromLeft ? Math.random() * 8 + 5 : -(Math.random() * 8 + 5),
        vy: -(Math.random() * 15 + 10),
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }

    let frames = 0;
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        p.vx *= 0.98;
        p.rotation += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        if (p.y > canvas.height) {
          particles.splice(idx, 1);
        }
      });

      frames++;
      if (particles.length > 0 && frames < 180) {
        requestAnimationFrame(drawParticles);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    drawParticles();
  };

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && !task.completed) {
      triggerConfetti();
    }
    await completeTask(taskId);
  };
  
  // Navigation & filter states
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'crisis'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceLaunchPreActive, setVoiceLaunchPreActive] = useState(false);

  // Focus & detail modal states
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);
  const [selectedCrisisTask, setSelectedCrisisTask] = useState<Task | null>(null);

  // Sorting overrides (e.g. if prioritized by Gemini)
  const [prioritizedOrder, setPrioritizedOrder] = useState<string[]>([]);
  const [isSortingByAI, setIsSortingByAI] = useState(false);

  // Google Calendar states
  const [isCalendarPanelOpen, setIsCalendarPanelOpen] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Load Google Calendar Events
  useEffect(() => {
    const loadEvents = async () => {
      if (!googleAccessToken) return;
      setIsLoadingEvents(true);
      try {
        const events = await fetchUpcomingEvents(googleAccessToken, 5);
        setGoogleEvents(events);
      } catch (err) {
        console.error('Failed to load Google Calendar events:', err);
      } finally {
        setIsLoadingEvents(false);
      }
    };
    
    if (googleAccessToken) {
      loadEvents();
    }
  }, [googleAccessToken]);

  const handleRefreshEvents = async () => {
    if (!googleAccessToken) return;
    setIsLoadingEvents(true);
    try {
      const events = await fetchUpcomingEvents(googleAccessToken, 5);
      setGoogleEvents(events);
    } catch (err) {
      console.error('Failed to refresh Google Calendar events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleSyncAllTasksToGoogle = async () => {
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

  // Speech helper inside the task board
  const triggerVoiceAdd = () => {
    setVoiceLaunchPreActive(true);
    setIsAddTaskOpen(true);
  };

  // Compile tasks and send to Gemini to optimize the list
  const handleAIPrioritize = async () => {
    if (tasks.length === 0) return;
    setIsSortingByAI(true);

    const taskPayload = tasks.map(t => ({
      id: t.id,
      title: t.title,
      deadline: t.deadline,
      complexity: t.complexity,
      subtaskCount: t.subtasks.length,
      estimatedHours: t.estimatedHours
    }));

    const prompt = `You are DeadlineAI. Given the following array of user tasks with their deadlines, optimize and rank them in order of absolute execution priority to avoid missing any deadlines.
Return ONLY a valid JSON string containing an array of task IDs in prioritized order, sorted from highest priority (must do now) to lowest priority.
JSON response structure: {"prioritizedIds": ["id1", "id2", "id3"]}

Task List:
${JSON.stringify(taskPayload, null, 2)}`;

    try {
      const response = await callGemini(prompt, true);
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.prioritizedIds && Array.isArray(parsed.prioritizedIds)) {
        setPrioritizedOrder(parsed.prioritizedIds);
      }
    } catch (err) {
      console.error('Failed to query Gemini for prioritizer ordering:', err);
    } finally {
      setIsSortingByAI(false);
    }
  };

  // Reset sorting override when tasks count changes
  useEffect(() => {
    setPrioritizedOrder([]);
  }, [tasks.length]);

  // Handle active lists filter & search query match
  const filteredTasks = tasks
    .filter((task) => {
      // 1. Search filter
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.context.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Tab filter
      if (activeTab === 'active') return !task.completed;
      if (activeTab === 'completed') return task.completed;
      if (activeTab === 'crisis') {
        if (task.completed) return false;
        const diffHrs = (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60);
        return diffHrs > 0 && diffHrs < 3;
      }
      return true; // 'all'
    })
    .sort((a, b) => {
      // If AI priority order has been computed, use that order index first
      if (prioritizedOrder.length > 0) {
        const indexA = prioritizedOrder.indexOf(a.id);
        const indexB = prioritizedOrder.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
      }
      // Fallback: uncompleted tasks first, then sort by deadline ascending (soonest first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  return (
    <div className="space-y-6 select-none">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-sans font-bold text-[#F7FAFC] tracking-tight">Timeline Workspace</h2>
          <p className="text-xs md:text-sm font-medium text-[#A0AEC0] font-sans">
            Tackle assignment priorities before they run out of hours.
          </p>
        </div>

        {/* Buttons Toolbar */}
        <div className="flex gap-2.5">
          <button
            onClick={() => setIsCalendarPanelOpen(!isCalendarPanelOpen)}
            className={`apple-glass-btn text-xs font-bold uppercase tracking-wider !text-white ${
              googleAccessToken 
                ? 'apple-glass-green' 
                : 'apple-glass-blue'
            }`}
            title="Google Calendar Integration"
          >
            <CalendarDays className="w-4 h-4 !text-white" />
            <span className="!text-white">Calendar Sync</span>
          </button>

          <button
            onClick={handleAIPrioritize}
            disabled={isSortingByAI || tasks.length === 0}
            className={`apple-glass-btn text-xs font-bold uppercase tracking-wider !text-white ${
              isSortingByAI 
                ? 'apple-glass-gray animate-pulse' 
                : 'apple-glass-purple text-white'
            }`}
          >
            <Sparkles className={`w-4 h-4 !text-white ${isSortingByAI ? 'animate-spin' : ''}`} />
            <span className="!text-white">{isSortingByAI ? 'Optimizing...' : 'AI Prioritize All'}</span>
          </button>

          <button
            onClick={() => setIsAddTaskOpen(true)}
            className="apple-glass-btn apple-glass-indigo !p-2.5 !text-white"
            title="Add Task"
          >
            <Plus className="w-5 h-5 !text-white" />
          </button>
        </div>
      </div>

      {/* Google Calendar Panel */}
      <AnimatePresence>
        {isCalendarPanelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="overflow-hidden"
          >
            <div className="liquid-glass p-6 space-y-6 rounded-2xl border border-white/10 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#4285F4]/10 border border-[#4285F4]/20">
                    <CalendarDays className="w-5 h-5 text-[#4285F4]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F7FAFC] font-sans">Google Calendar Sync Hub</h3>
                    <p className="text-[11px] font-medium text-[#A0AEC0] font-sans">Sync tasks with your Google Calendar and import schedule events</p>
                  </div>
                </div>

                {googleAccessToken && (
                  <button
                    onClick={handleRefreshEvents}
                    disabled={isLoadingEvents}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-[#A0AEC0] hover:text-[#F7FAFC] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                    title="Refresh Calendar Events"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                )}
              </div>

              {!googleAccessToken ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <div className="max-w-md">
                    <p className="text-xs text-[#A0AEC0] leading-relaxed font-sans font-medium">
                      Connect your Google Calendar to synchronize DeadlineAI tasks directly to your personal schedule, set customizable notifications, and pull in upcoming calendar events as actionable tasks.
                    </p>
                  </div>
                  
                  {/* Styled Sign In with Google Button */}
                  <button 
                    onClick={connectGoogleCalendar}
                    className="gsi-material-button flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white text-gray-900 font-sans font-bold text-xs hover:bg-gray-10 transition-all hover:scale-[1.02] shadow-md cursor-pointer mx-auto"
                  >
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>Connect Google Calendar</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Column 1: Import Events */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase text-[#63B3ED] tracking-wider flex items-center gap-1.5">
                      <ArrowDown className="w-3.5 h-3.5 text-[#63B3ED]" />
                      <span>Pull Events from GCal</span>
                    </h4>

                    {isLoadingEvents ? (
                      <div className="space-y-2 py-4">
                        <div className="h-10 bg-white/[0.02] border border-white/5 rounded-xl animate-pulse" />
                        <div className="h-10 bg-white/[0.02] border border-white/5 rounded-xl animate-pulse" />
                      </div>
                    ) : googleEvents.length === 0 ? (
                      <p className="text-xs text-[#A0AEC0] py-4 text-center bg-white/[0.01] rounded-xl border border-dashed border-white/10 font-sans font-medium">
                        No upcoming calendar events detected in primary calendar.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {googleEvents.map((evt) => {
                          const hasImported = tasks.some(t => t.googleEventId === evt.id);
                          const dateStr = evt.start?.dateTime 
                            ? new Date(evt.start.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                            : evt.start?.date 
                              ? new Date(evt.start.date).toLocaleDateString()
                              : 'All Day';

                          return (
                            <div 
                              key={evt.id} 
                              className="p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:border-[#63B3ED]/20 hover:bg-white/[0.04] transition-all flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <h5 className="font-bold text-[#F7FAFC] truncate font-sans">{evt.summary}</h5>
                                <p className="text-[10px] font-mono font-bold text-[#A0AEC0]">{dateStr}</p>
                              </div>

                              <button
                                onClick={() => importGoogleCalendarEvent(evt)}
                                disabled={hasImported}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                                  hasImported
                                    ? 'bg-emerald-950/20 text-[#68D391] border border-emerald-500/20'
                                    : 'bg-[#63B3ED]/10 border border-[#63B3ED]/20 text-[#63B3ED] hover:bg-[#63B3ED]/20'
                                }`}
                              >
                                {hasImported ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Imported</span>
                                  </>
                                ) : (
                                  <>
                                    <PlusCircle className="w-3 h-3" />
                                    <span>Import</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Column 2: Push Tasks */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono font-bold uppercase text-[#9F7AEA] tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#9F7AEA]" />
                        <span>Push Deadlines to GCal</span>
                      </h4>
                      <p className="text-xs text-[#A0AEC0] leading-relaxed font-sans font-medium">
                        Push all active, unsynced tasks as time blocks in Google Calendar. Syncing sets a 1-hour event directly preceding each task's deadline with complete AI summaries and actionable tactics.
                      </p>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleSyncAllTasksToGoogle}
                        disabled={isSyncingAll || tasks.filter(t => !t.completed && !t.googleEventId).length === 0}
                        className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                          tasks.filter(t => !t.completed && !t.googleEventId).length === 0
                            ? 'bg-white/[0.02] border border-white/5 text-[#4A5568]'
                            : 'bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] text-[#080B14] hover:from-[#5aa2d6] hover:to-[#906cd9]'
                        }`}
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
                        <span>
                          {isSyncingAll ? 'Syncing...' : `Sync Active Tasks (${tasks.filter(t => !t.completed && !t.googleEventId).length} pending)`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs list with Framer Motion Sliding Indicators */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-white/5 pb-2">
        <div className="flex gap-1 p-1 bg-white/[0.02] border border-white/5 rounded-2xl relative overflow-x-auto w-full md:w-auto">
          {(['all', 'active', 'completed', 'crisis'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider relative transition-colors ${
                  isActive ? 'text-[#63B3ED]' : 'text-[#A0AEC0] hover:text-[#F7FAFC]'
                }`}
              >
                {/* Slidable background */}
                {isActive && (
                  <motion.div
                    layoutId="tasks-active-tab"
                    className="absolute inset-0 bg-[#63B3ED]/10 border border-[#63B3ED]/30 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="capitalize">{tab}</span>
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-64 flex-shrink-0">
          <input
            type="text"
            placeholder="Search tasks, details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs font-medium rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#63B3ED]/40 focus:outline-none text-[#F7FAFC] placeholder-[#4A5568] focus:bg-white/[0.05] transition-all"
          />
          <Search className="w-4 h-4 text-[#4A5568] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Tasks grid */}
      <AnimatePresence mode="wait">
        {filteredTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="liquid-glass p-12 flex flex-col items-center text-center max-w-md mx-auto"
          >
            {/* Inline SVG empty state illustration */}
            <svg className="w-32 h-32 mb-4 text-[#4A5568]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h4 className="text-lg font-bold text-[#F7FAFC] mb-2 font-sans">No tasks found</h4>
            <p className="text-xs text-[#A0AEC0] mb-6 max-w-[280px]">
              Looks like your timeline is completely clean. Click the floating + button to schedule your next prioritized event.
            </p>
            <button
              id="add-task-empty-state-btn"
              onClick={() => setIsAddTaskOpen(true)}
              className="apple-glass-btn apple-glass-indigo font-bold text-xs uppercase tracking-wider px-6 py-3"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Task Now</span>
            </button>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, idx) => {
                const isCompleted = task.completed;
                const totalSubtasks = task.subtasks.length;
                const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
                const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

                // Urgency calculation for the dot indicator pulsing color
                const deadlineTime = new Date(task.deadline).getTime();
                const nowTime = Date.now();
                const diffHours = (deadlineTime - nowTime) / (1000 * 60 * 60);
                
                const isCrisis = diffHours > 0 && diffHours < 3;
                let dotColor = 'bg-[#68D391]'; // Completed / Safe
                if (!isCompleted) {
                  if (diffHours < 3) dotColor = 'bg-[#FC8181] animate-ping'; // Crisis red
                  else if (diffHours < 24) dotColor = 'bg-[#F6AD55]'; // Due within a day
                  else dotColor = 'bg-[#63B3ED]'; // Safe
                }

                return (
                  <motion.div
                    key={task.id}
                    layoutId={task.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220, delay: idx * 0.05 }}
                    className={`liquid-glass p-5 relative flex flex-col justify-between overflow-hidden shadow-lg ${
                      isCompleted 
                        ? 'liquid-glass-safe' 
                        : isCrisis 
                          ? 'liquid-glass-crisis crisis-pulse' 
                          : diffHours < 24 
                            ? 'liquid-glass-warning' 
                            : ''
                    }`}
                  >
                    {/* Top action details */}
                    <div>
                      {/* Urgency Dot & Category Tags */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          {/* Pulsing urgency indicator */}
                          <div className="relative w-2.5 h-2.5">
                            <span className={`absolute inset-0 rounded-full ${dotColor}`} />
                          </div>
                          
                          <span className="text-[10px] font-mono font-bold text-[#A0AEC0] uppercase tracking-wider capitalize">
                            {task.category}
                          </span>
                        </div>

                        {/* Complexity Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                          task.complexity === 'critical' ? 'bg-[#FC8181]/15 text-[#FC8181]' :
                          task.complexity === 'high' ? 'bg-[#F6AD55]/15 text-[#F6AD55]' :
                          task.complexity === 'medium' ? 'bg-[#63B3ED]/15 text-[#63B3ED]' : 'bg-[#68D391]/15 text-[#68D391]'
                        }`}>
                          {task.complexity}
                        </span>
                      </div>

                      {/* Task title and context summary */}
                      <div className="space-y-1.5 cursor-pointer" onClick={() => setSelectedDetailTask(task)}>
                        <h4 className={`text-base font-bold text-[#F7FAFC] leading-snug tracking-tight ${
                          isCompleted ? 'line-through text-[#4A5568]' : ''
                        }`}>
                          {task.title}
                        </h4>
                        
                        <p className="text-xs text-[#A0AEC0] line-clamp-3 leading-relaxed font-sans font-medium">
                          {task.summary || task.context}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Progress bars & timings */}
                    <div className="mt-5 space-y-4">
                      
                      {/* Countdown element */}
                      {!isCompleted ? (
                        <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#4A5568]" />
                            <span className="text-[10px] font-mono font-bold text-[#A0AEC0] uppercase tracking-wider">Clock</span>
                          </div>
                          <CountdownTimer deadline={task.deadline} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-1.5 text-[#68D391]">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Completed</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#68D391]">
                            Beaten
                          </span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      {totalSubtasks > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#A0AEC0] uppercase">
                            <span>Tactics ({completedSubtasks}/{totalSubtasks})</span>
                            <span>{progressPercent}%</span>
                          </div>
                          
                          {/* Progress track */}
                          <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/5 relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] progress-sheen"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Toolbar actions */}
                    <div className="mt-5 pt-4 border-t border-white/5 flex gap-2">
                      <button
                        onClick={() => setSelectedDetailTask(task)}
                        className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-bold text-[#F7FAFC] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#63B3ED]" />
                        <span>View Plan</span>
                      </button>

                      <button
                        onClick={() => syncTaskToGoogleCalendar(task.id)}
                        disabled={isCompleted}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          task.googleEventId 
                            ? 'bg-emerald-950/20 text-[#68D391] border border-emerald-500/20'
                            : 'bg-white/5 hover:bg-white/10 text-[#A0AEC0] hover:text-[#F7FAFC] border border-white/5'
                        }`}
                        title={task.googleEventId ? "Synced to Google Calendar" : "Sync to Google Calendar"}
                      >
                        {task.googleEventId ? (
                          <Check className="w-3.5 h-3.5 text-[#68D391]" />
                        ) : (
                          <CalendarDays className="w-3.5 h-3.5 text-[#63B3ED]" />
                        )}
                      </button>

                      {isCrisis && !isCompleted ? (
                        <button
                          onClick={() => setSelectedCrisisTask(task)}
                          className="px-3 py-2 rounded-xl bg-[#FC8181] hover:bg-[#eb7474] hover:shadow-[0_0_15px_rgba(252,129,129,0.3)] text-[#080B14] text-[11px] font-extrabold uppercase tracking-wide transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Crisis</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isCompleted 
                              ? 'bg-white/[0.04] border border-[#68D391]/30 text-[#68D391]' 
                              : 'bg-white/[0.04] hover:bg-[#68D391]/10 text-[#A0AEC0] hover:text-[#68D391] border border-white/5 hover:border-[#68D391]/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays / Modals */}
      <AnimatePresence>
        {isAddTaskOpen && (
          <AddTaskModal onClose={() => setIsAddTaskOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDetailTask && (
          <TaskDetailModal task={selectedDetailTask} onClose={() => setSelectedDetailTask(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCrisisTask && (
          <CrisisModal task={selectedCrisisTask} onClose={() => setSelectedCrisisTask(null)} />
        )}
      </AnimatePresence>

    </div>
  );
};
