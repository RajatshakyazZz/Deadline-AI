import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Target, 
  Zap, 
  Flame, 
  Play, 
  Clock, 
  ArrowRight, 
  Check, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useToast } from '../components/Toast';
import { callGemini } from '../services/gemini';
import { safeStorage } from '../utils/storage';
import confetti from 'canvas-confetti';

interface BriefingData {
  greeting: string;
  topPriority: {
    taskTitle: string;
    urgencyReason: string;
    taskId: string;
  };
  rankedTasks: {
    taskId: string;
    title: string;
    rank: number;
    aiReason: string;
    estimatedHours: number;
    deadline: string;
    urgencyColor: 'danger' | 'warning' | 'info';
  }[];
  quickWins: {
    title: string;
    estimatedMinutes: number;
    taskId: string;
  }[];
  focusSuggestion: {
    taskTitle: string;
    durationMinutes: number;
    specificAdvice: string;
  };
  motivationMessage: string;
  weekStats: {
    pendingCount: number;
    dueTodayCount: number;
    onTrackPercent: number;
    weekAdvice: string;
  };
}

// Subcomponent: CountUp Animation with IntersectionObserver
const CountUp: React.FC<{ value: number; colorClass: string; isPercent?: boolean }> = ({ value, colorClass, isPercent }) => {
  const [count, setCount] = useState(0);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setHasIntersected(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    if (!hasIntersected) return;
    let start = 0;
    const end = value;
    if (end === 0) {
      setCount(0);
      return;
    }
    const duration = 1200; // 1.2s
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value, hasIntersected]);
  
  return (
    <span ref={elementRef} className={`font-mono text-4xl font-extrabold tracking-tight ${colorClass}`}>
      {count}
      {isPercent ? '%' : ''}
    </span>
  );
};

// Subcomponent: Smooth Animated Progress Bar with IntersectionObserver
const AnimatedProgressBar: React.FC<{ percentage: number }> = ({ percentage }) => {
  const [width, setWidth] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setWidth(percentage);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => observer.disconnect();
  }, [percentage]);
  
  return (
    <div ref={elementRef} className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden mt-3">
      <div 
        className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all ease-out"
        style={{ 
          width: `${width}%`,
          transitionDuration: '800ms'
        }}
      />
    </div>
  );
};

const validateBriefingData = (parsed: any, activeTasks: any[], fallbackName: string): BriefingData => {
  if (!parsed || typeof parsed !== 'object') {
    parsed = {};
  }
  return {
    greeting: parsed.greeting || `Good morning ☀️\nHere's your plan, ${fallbackName}`,
    topPriority: {
      taskTitle: parsed.topPriority?.taskTitle || (activeTasks[0]?.title || 'Tackle core tasks'),
      urgencyReason: parsed.topPriority?.urgencyReason || 'This objective currently holds the highest execution priority.',
      taskId: parsed.topPriority?.taskId || (activeTasks[0]?.id || '')
    },
    rankedTasks: Array.isArray(parsed.rankedTasks) ? parsed.rankedTasks.map((t: any, idx: number) => ({
      taskId: t.taskId || `task-${idx}`,
      title: t.title || 'Untitled Task',
      rank: typeof t.rank === 'number' ? t.rank : (idx + 1),
      aiReason: t.aiReason || 'Essential milestone to maintain continuous progress.',
      estimatedHours: typeof t.estimatedHours === 'number' ? t.estimatedHours : 1,
      deadline: t.deadline || new Date().toISOString(),
      urgencyColor: t.urgencyColor || 'info'
    })) : [],
    quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins.map((qw: any) => ({
      title: qw.title || 'Quick checkin',
      estimatedMinutes: typeof qw.estimatedMinutes === 'number' ? qw.estimatedMinutes : 10,
      taskId: qw.taskId || ''
    })) : [],
    focusSuggestion: {
      taskTitle: parsed.focusSuggestion?.taskTitle || (activeTasks[0]?.title || 'Tackle core tasks'),
      durationMinutes: typeof parsed.focusSuggestion?.durationMinutes === 'number' ? parsed.focusSuggestion.durationMinutes : 25,
      specificAdvice: parsed.focusSuggestion?.specificAdvice || 'Focus on establishing the core skeleton flow first.'
    },
    motivationMessage: parsed.motivationMessage || 'One step at a time, you are making incredible progress today.',
    weekStats: {
      pendingCount: typeof parsed.weekStats?.pendingCount === 'number' ? parsed.weekStats.pendingCount : activeTasks.length,
      dueTodayCount: typeof parsed.weekStats?.dueTodayCount === 'number' ? parsed.weekStats.dueTodayCount : 1,
      onTrackPercent: typeof parsed.weekStats?.onTrackPercent === 'number' ? parsed.weekStats.onTrackPercent : 100,
      weekAdvice: parsed.weekStats?.weekAdvice || 'Stay consistent and focus on one objective at a time.'
    }
  };
};

export const AIBriefing: React.FC = () => {
  const { tasks, profile, completeTask, setIsAddTaskOpen } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [timeAgoText, setTimeAgoText] = useState('just now');
  const [completedWins, setCompletedWins] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Auto-update generated time ago text
  useEffect(() => {
    if (!generatedAt) return;
    const updateAgo = () => {
      const diffSec = Math.floor((Date.now() - generatedAt) / 1000);
      if (diffSec < 60) {
        setTimeAgoText('just now');
      } else {
        const mins = Math.floor(diffSec / 60);
        setTimeAgoText(`${mins}m ago`);
      }
    };
    
    updateAgo();
    const interval = setInterval(updateAgo, 15000);
    return () => clearInterval(interval);
  }, [generatedAt]);

  // Live countdown logic for TOP PRIORITY TODAY card
  useEffect(() => {
    if (!briefing?.topPriority?.taskId) return;
    
    const updateCountdown = () => {
      const realTask = tasks.find(t => t.id === briefing.topPriority.taskId);
      const deadlineStr = realTask?.deadline || briefing.rankedTasks.find(rt => rt.taskId === briefing.topPriority.taskId)?.deadline;
      if (!deadlineStr) {
        setTimeRemaining('');
        return;
      }
      
      const diffMs = new Date(deadlineStr).getTime() - Date.now();
      if (diffMs < 0) {
        setTimeRemaining('⚠️ OVERDUE');
        return;
      }
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeRemaining(`Due in ${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`Due in ${minutes} minutes`);
      } else {
        setTimeRemaining(`Due in ${seconds} seconds`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [briefing, tasks]);

  const fetchBriefing = async (force: boolean = false) => {
    const cacheKey = `deadlineai_briefing_${profile?.email || 'guest'}`;
    const completedWinsCacheKey = `deadlineai_completed_wins_${profile?.email || 'guest'}`;
    
    // Load completed wins from cache using safeStorage
    try {
      const stored = safeStorage.getItem(completedWinsCacheKey);
      if (stored) {
        setCompletedWins(JSON.parse(stored));
      } else {
        setCompletedWins([]);
      }
    } catch (_) {}

    const activeTasks = tasks.filter(t => !t.completed);
    const name = profile?.name || 'Rajat';

    if (!force) {
      try {
        const cached = safeStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const todayStr = new Date().toDateString();
          if (parsed.dateStr === todayStr) {
            // Defensively validate the cached data to prevent TypeErrors from older formats
            const validated = validateBriefingData(parsed.data, activeTasks, name);
            setBriefing(validated);
            setGeneratedAt(parsed.timestamp || Date.now());
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to parse cached briefing:', e);
      }
    }

    if (force) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(false);
    
    const taskSummary = activeTasks.slice(0, 10).map(t => ({
      id: t.id,
      title: t.title,
      deadline: t.deadline,
      complexity: t.complexity,
      estimatedHours: t.estimatedHours
    }));

    const completedTodayCount = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length;
    const currentStreak = profile?.longestStreak || 0;

    const prompt = `Generate daily briefing for ${name}.
Current time: ${new Date().toISOString()}
Pending tasks: ${JSON.stringify(taskSummary, null, 2)}
Completed today: ${completedTodayCount}
Current streak: ${currentStreak}

Return this exact JSON:
{
  "greeting": "string (time-appropriate, personal, e.g. 'Good morning ☀️\\nHere\\'s your plan, ${name}')",
  "topPriority": {
    "taskTitle": "string",
    "urgencyReason": "string",
    "taskId": "string"
  },
  "rankedTasks": [
    {
      "taskId": "string",
      "title": "string",
      "rank": number,
      "aiReason": "string (max 60 chars)",
      "estimatedHours": number,
      "deadline": "string",
      "urgencyColor": "danger|warning|info"
    }
  ],
  "quickWins": [
    {
      "title": "string",
      "estimatedMinutes": number,
      "taskId": "string"
    }
  ],
  "focusSuggestion": {
    "taskTitle": "string",
    "durationMinutes": number,
    "specificAdvice": "string (actionable, max 100 chars)"
  },
  "motivationMessage": "string (personal, based on data, max 120 chars)",
  "weekStats": {
    "pendingCount": number,
    "dueTodayCount": number,
    "onTrackPercent": number,
    "weekAdvice": "string (max 80 chars)"
  }
}`;

    try {
      const response = await callGemini(prompt, true);
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      const validatedBriefing = validateBriefingData(parsed, activeTasks, name);
      
      setBriefing(validatedBriefing);
      const now = Date.now();
      setGeneratedAt(now);
      
      try {
        safeStorage.setItem(cacheKey, JSON.stringify({
          dateStr: new Date().toDateString(),
          timestamp: now,
          data: validatedBriefing
        }));
      } catch (_) {}
    } catch (err) {
      console.error('Failed to fetch Gemini briefing:', err);
      setError(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [profile?.email]);

  const handleRefresh = async () => {
    await fetchBriefing(true);
  };

  const handleCompleteQuickWin = async (winTitle: string, taskId?: string) => {
    // Burst micro confetti!
    confetti({
      particleCount: 20,
      spread: 40,
      origin: { y: 0.8 }
    });

    setCompletedWins(prev => {
      const updated = [...prev, winTitle];
      const completedWinsCacheKey = `deadlineai_completed_wins_${profile?.email || 'guest'}`;
      try {
        safeStorage.setItem(completedWinsCacheKey, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (taskId && tasks.some(t => t.id === taskId)) {
      await completeTask(taskId);
    }
    // showToast("✅ Marked as done!", "success");
  };

  const handleStartFocus = (taskTitle: string, taskId?: string) => {
    if (taskId) {
      try {
        safeStorage.setItem('focus_task_id', taskId);
      } catch (_) {}
    }
    navigate('/focus');
  };

  // Skeleton Loader design (staggered & premium)
  const SkeletonLoader = () => (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={{
        animate: { transition: { staggerChildren: 0.05 } }
      }}
      className="space-y-12 max-w-[800px] mx-auto"
    >
      {/* Hero Skeleton */}
      <motion.div 
        variants={{
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 }
        }}
        className="pt-12 pb-8 space-y-3"
      >
        <div className="h-4 bg-white/5 rounded w-24 animate-shimmer" />
        <div className="h-10 bg-white/5 rounded w-72 animate-shimmer" />
        <div className="flex items-center justify-between mt-6 pt-4 border-b border-white/[0.06]">
          <div className="h-4 bg-white/5 rounded w-36 animate-shimmer" />
          <div className="h-8 bg-white/5 rounded-full w-24 animate-shimmer" />
        </div>
      </motion.div>

      {/* Today's Single Focus Skeleton */}
      <motion.div 
        variants={{
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 }
        }}
        className="h-[180px] bg-white/[0.03] border border-white/[0.06] rounded-[20px] p-8 space-y-4 animate-shimmer"
      >
        <div className="h-3 bg-white/5 rounded w-32" />
        <div className="h-8 bg-white/5 rounded w-3/4" />
        <div className="h-4 bg-white/5 rounded w-40" />
      </motion.div>

      {/* Tasks & Quick Wins Columns Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Task Priority Cards Skeleton */}
        <motion.div 
          variants={{
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 }
          }}
          className="space-y-4"
        >
          <div className="h-4 bg-white/5 rounded w-48 mb-6 animate-shimmer" />
          <div className="h-[76px] bg-white/[0.03] border border-white/[0.06] rounded-[14px] animate-shimmer" />
          <div className="h-[76px] bg-white/[0.03] border border-white/[0.06] rounded-[14px] animate-shimmer" />
          <div className="h-[76px] bg-white/[0.03] border border-white/[0.06] rounded-[14px] animate-shimmer" />
        </motion.div>

        {/* Quick Wins Skeleton */}
        <motion.div 
          variants={{
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 }
          }}
          className="space-y-4"
        >
          <div className="h-4 bg-white/5 rounded w-40 mb-6 animate-shimmer" />
          <div className="flex gap-4 overflow-hidden">
            <div className="h-16 bg-[#68D391]/[0.02] border border-[#68D391]/10 rounded-[14px] w-48 shrink-0 animate-shimmer" />
            <div className="h-16 bg-[#68D391]/[0.02] border border-[#68D391]/10 rounded-[14px] w-48 shrink-0 animate-shimmer" />
          </div>
        </motion.div>
      </div>

      {/* Focus Suggestion Skeleton */}
      <motion.div 
        variants={{
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 }
        }}
        className="h-[160px] bg-white/[0.03] border border-white/[0.06] rounded-[20px] p-8 space-y-4 animate-shimmer"
      >
        <div className="h-3 bg-white/5 rounded w-40" />
        <div className="h-6 bg-white/5 rounded w-2/3" />
        <div className="h-4 bg-white/5 rounded w-1/2" />
      </motion.div>

      {/* Motivation Skeleton */}
      <motion.div 
        variants={{
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 }
        }}
        className="flex flex-col items-center space-y-3 pt-6 pb-6"
      >
        <div className="h-8 bg-white/5 rounded-full w-8 animate-shimmer" />
        <div className="h-4 bg-white/5 rounded w-1/2 animate-shimmer" />
        <div className="h-4 bg-white/5 rounded w-1/3 animate-shimmer" />
        <div className="h-3 bg-white/5 rounded w-1/4 animate-shimmer" />
      </motion.div>
    </motion.div>
  );

  // Styles for the shimmer backgrounds
  const stylesInject = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes shimmerBtn {
      0% { left: -100%; }
      100% { left: 200%; }
    }
    .animate-shimmer {
      background: linear-gradient(
        90deg,
        rgba(255,255,255,0.02) 25%,
        rgba(255,255,255,0.06) 50%,
        rgba(255,255,255,0.02) 25%
      );
      background-size: 200% 100%;
      animation: shimmer 2s infinite linear;
    }
  `;

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-5 md:px-0 py-12">
        <style>{stylesInject}</style>
        <SkeletonLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[800px] mx-auto px-5 md:px-0 py-24 flex items-center justify-center">
        <div className="p-8 md:p-12 rounded-[24px] bg-white/[0.02] border border-white/[0.08] text-center max-w-md w-full space-y-6">
          <div className="text-4xl animate-bounce">🤖</div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-100">Aria couldn't connect</h3>
            <p className="text-sm text-slate-500">Check your Gemini API key or internet connection</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="px-6 py-2.5 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-sm font-semibold text-slate-300 transition-all flex items-center gap-2 mx-auto cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Handle Empty State when there are no tasks
  const activeTasksCount = tasks.filter(t => !t.completed).length;
  if (activeTasksCount === 0 && (!briefing || briefing.rankedTasks.length === 0)) {
    return (
      <div className="max-w-[800px] mx-auto px-5 md:px-0 py-24 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">🎯</div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-100">Your briefing is ready when you are</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Add your first task and Aria will build your personalized daily plan
            </p>
          </div>
          <button 
            onClick={() => setIsAddTaskOpen(true)}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg transition-all transform hover:scale-105 cursor-pointer"
          >
            + Add Your First Task
          </button>
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  // Filter out any dismissed or completed quick wins
  const visibleQuickWins = briefing.quickWins.filter(qw => !completedWins.includes(qw.title));

  // Determine if the live countdown is under 1 hr or overdue to make it red
  const isCountdownUrgent = timeRemaining.includes('minutes') || timeRemaining.includes('seconds') || timeRemaining.includes('OVERDUE');

  return (
    <div className="max-w-[800px] mx-auto px-5 md:px-0 py-12 space-y-12 select-none">
      <style>{stylesInject}</style>

      {/* SECTION 1: HERO GREETING */}
      <header className="pt-12 pb-8 space-y-4">
        <span className="text-[16px] text-sky-400 font-semibold tracking-wider uppercase">
          Good morning ☀️
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-100 whitespace-pre-line leading-tight">
          Here's your plan, {profile?.name || 'Rajat'}
        </h1>
        
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-8 mt-6">
          <span className="text-sm text-slate-500 font-medium">
            Generated {timeAgoText}
          </span>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 text-xs font-semibold text-slate-300 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div 
          key={isRefreshing ? "refreshing-content" : "stable-content"}
          initial={{ opacity: 0 }}
          animate={{ opacity: isRefreshing ? 0.5 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-12"
        >
          {/* SECTION 2: TODAY'S SINGLE FOCUS */}
          <section className="space-y-4">
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(252,129,129,0.08), rgba(159,122,234,0.06))',
                border: '1px solid rgba(252,129,129,0.2)'
              }}
              className="rounded-[20px] p-8 md:p-10 space-y-6 flex flex-col justify-between relative overflow-hidden group shadow-xl"
            >
              <div className="space-y-4">
                <span className="text-[11px] font-bold tracking-[1.5px] text-rose-400 uppercase">
                  🎯 TOP PRIORITY TODAY
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-100 leading-tight tracking-tight">
                  "{briefing.topPriority.taskTitle}"
                </h2>
                {timeRemaining && (
                  <p className={`text-[15px] font-mono ${isCountdownUrgent ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                    {timeRemaining}
                  </p>
                )}
              </div>
              <motion.button 
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: 'rgba(252, 129, 129, 0.15)'
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStartFocus(briefing.topPriority.taskTitle, briefing.topPriority.taskId)}
                className="mt-5 px-5 py-2.5 rounded-full border border-[rgba(252,129,129,0.3)] text-[#FC8181] font-semibold text-xs flex items-center gap-1.5 cursor-pointer bg-transparent transition-all self-start"
              >
                <span>View Task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </section>

          {/* TWO-COLUMN GRID FOR SECTIONS 3 & 4 (Desktop only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            
            {/* SECTION 3: TASK PRIORITY CARDS */}
            <section className="space-y-4">
              <span className="block text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Your Tasks — Ranked by AI
              </span>
              <div className="space-y-3">
                {briefing.rankedTasks.slice(0, 5).map((task, index) => {
                  const subCount = tasks.find(t => t.id === task.taskId)?.subtasks || [];
                  const completedSubCount = subCount.filter(s => s.completed).length;
                  const progressPercentage = subCount.length > 0 ? Math.round((completedSubCount / subCount.length) * 100) : 0;
                  
                  const accentColor = task.urgencyColor === 'danger' 
                    ? 'bg-rose-400' 
                    : task.urgencyColor === 'warning' 
                      ? 'bg-amber-400' 
                      : 'bg-sky-400';

                  return (
                    <div 
                      key={task.taskId}
                      style={{ transition: 'all 0.2s ease' }}
                      className="bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] rounded-[14px] p-[18px] pl-[22px] relative overflow-hidden group hover:translate-x-1"
                    >
                      {/* Left accent line */}
                      <div className={`absolute left-0 top-0 w-[3px] h-full ${accentColor}`} />
                      
                      {/* Large subtle background number */}
                      <span className="absolute right-4 top-1 text-5xl font-extrabold text-white/[0.02] pointer-events-none group-hover:text-white/[0.04] transition-all">
                        {task.rank}
                      </span>

                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="text-[16px] font-semibold text-slate-100 group-hover:text-white transition-all leading-snug">
                            {task.title}
                          </h4>
                          <span className="font-mono text-[12px] text-sky-400 bg-sky-400/10 px-2.5 py-0.5 rounded-full shrink-0">
                            {task.estimatedHours}h
                          </span>
                        </div>
                        
                        <p className="text-[13px] text-slate-500 line-clamp-1 leading-normal">
                          {task.aiReason}
                        </p>

                        {subCount.length > 0 && (
                          <AnimatedProgressBar percentage={progressPercentage} />
                        )}
                      </div>
                    </div>
                  );
                })}

                {briefing.rankedTasks.length > 5 && (
                  <button 
                    onClick={() => navigate('/tasks')}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-all flex items-center gap-1 mt-4"
                  >
                    View all {briefing.rankedTasks.length} tasks <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </section>

            {/* SECTION 4: QUICK WINS */}
            {visibleQuickWins.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
                    ⚡ Quick Wins
                  </span>
                  <span className="text-[12px] italic text-slate-500">
                    Complete these first for momentum
                  </span>
                </div>

                {/* Mobile scroll / Desktop grid-wrap */}
                <div className="flex md:flex-wrap gap-4 overflow-x-auto pb-4 md:pb-0 scrollbar-none snap-x">
                  <AnimatePresence>
                    {visibleQuickWins.map((win) => (
                      <motion.div
                        key={win.title}
                        initial={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleCompleteQuickWin(win.title, win.taskId)}
                        className="bg-[#68D391]/[0.06] border border-[#68D391]/15 hover:bg-[#68D391]/[0.1] hover:border-[#68D391]/35 rounded-[14px] p-[14px] px-[18px] min-w-[180px] md:min-w-[150px] md:flex-1 shrink-0 snap-center cursor-pointer transition-all flex flex-col justify-between group text-left"
                      >
                        <div className="space-y-2">
                          <h4 className="text-[14px] font-semibold text-slate-200 group-hover:text-white transition-all leading-snug">
                            {win.title}
                          </h4>
                          <span className="block font-mono text-[12px] text-green-400">
                            ~{win.estimatedMinutes} min
                          </span>
                        </div>
                        <div className="mt-3 self-end opacity-0 group-hover:opacity-100 transition-opacity bg-green-500 text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

          </div>

          {/* SECTION 5: FOCUS SESSION SUGGESTION */}
          <section className="space-y-4">
            <div 
              style={{
                background: 'rgba(99,179,237,0.06)',
                border: '1px solid rgba(99,179,237,0.15)'
              }}
              className="rounded-[20px] p-[28px] md:p-[32px] space-y-6"
            >
              <div className="space-y-4">
                <span className="text-[11px] font-bold tracking-[1.5px] text-sky-400 uppercase">
                  ⏱ SUGGESTED FOCUS SESSION
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-slate-100 leading-tight">
                  Work on "{briefing.focusSuggestion.taskTitle}" for the next {briefing.focusSuggestion.durationMinutes} minutes
                </h3>
                <div className="border-l-2 border-[#63B3ED]/30 pl-4 py-1">
                  <p className="text-[14px] text-slate-400 italic leading-relaxed">
                    "{briefing.focusSuggestion.specificAdvice}"
                  </p>
                </div>
              </div>
              <div className="relative group/btn w-full md:w-auto inline-block mt-2">
                {/* Glowing Aura backdrop */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-30 group-hover/btn:opacity-60 transition duration-1000 group-hover/btn:duration-200 animate-pulse"></div>
                
                <motion.button 
                  whileHover={{ 
                    scale: 1.03,
                    boxShadow: "0 0 25px rgba(99, 179, 237, 0.45)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStartFocus(briefing.focusSuggestion.taskTitle, briefing.focusSuggestion.taskId)}
                  className="relative w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#3182CE] via-[#5A67D8] to-[#805AD5] text-white font-bold rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer overflow-hidden shadow-2xl border border-white/10"
                >
                  {/* Subtle inner linear highlight */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                  
                  {/* Shimmer line */}
                  <div className="absolute inset-y-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover/btn:animate-[shimmerBtn_1.5s_infinite]" />

                  <div className="p-2 rounded-lg bg-white/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-white text-white group-hover/btn:rotate-12 transition-transform" />
                  </div>
                  
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-bold tracking-wide">Start Focus Session</span>
                    <span className="text-[10px] text-blue-100 font-medium opacity-80 uppercase tracking-widest mt-0.5">Enter Deep Work Mode</span>
                  </div>
                  
                  <ArrowRight className="w-4 h-4 ml-2 opacity-60 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                </motion.button>
              </div>
            </div>
          </section>

          {/* SECTION 6: MOTIVATION MESSAGE */}
          <section className="py-12 relative overflow-hidden flex flex-col items-center text-center space-y-4">
            {/* Subtle radial gradient behind this section */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(159,122,234,0.04)_0%,transparent_70%)] pointer-events-none" />
            
            <span className="text-3xl opacity-40 select-none">💬</span>
            <p className="text-[20px] font-normal text-slate-300 leading-relaxed italic max-w-[600px]">
              "{briefing.motivationMessage}"
            </p>
            <span className="text-[13px] text-slate-500 font-medium">
              — Aria, your AI companion
            </span>
          </section>

          {/* SECTION 7: WEEK OVERVIEW */}
          <section className="space-y-6 border-t border-white/[0.06] pt-12">
            <span className="block text-center text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              This Week at a Glance
            </span>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              
              {/* Stat 1 */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-[16px] p-6 text-center space-y-2 hover:bg-white/[0.04] transition-all">
                <CountUp value={briefing.weekStats.pendingCount} colorClass="text-sky-400" />
                <span className="block text-[12px] text-slate-500 font-bold uppercase tracking-wider">
                  Pending
                </span>
              </div>

              {/* Stat 2 */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-[16px] p-6 text-center space-y-2 hover:bg-white/[0.04] transition-all">
                <CountUp value={briefing.weekStats.dueTodayCount} colorClass="text-amber-400" />
                <span className="block text-[12px] text-slate-500 font-bold uppercase tracking-wider">
                  Due Today
                </span>
              </div>

              {/* Stat 3 (Double column span on mobile for odd stat count) */}
              <div className="col-span-2 md:col-span-1 bg-white/[0.03] border border-white/[0.06] rounded-[16px] p-6 text-center space-y-2 hover:bg-white/[0.04] transition-all">
                <CountUp value={briefing.weekStats.onTrackPercent} colorClass="text-green-400" isPercent />
                <span className="block text-[12px] text-slate-500 font-bold uppercase tracking-wider">
                  On Track
                </span>
              </div>

            </div>

            <p className="text-center text-[14px] text-slate-500 italic max-w-lg mx-auto">
              "{briefing.weekStats.weekAdvice}"
            </p>
          </section>

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
