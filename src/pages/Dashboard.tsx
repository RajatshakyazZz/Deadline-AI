import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Timer, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Folder 
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { Task, Habit } from '../types';
import { CrisisModal } from '../components/CrisisModal';
import { TaskDetailModal } from '../components/TaskDetailModal';

// Animated CountUp Helper Component
const CountUpValue: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ end, duration = 1000, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let rAFId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        rAFId = window.requestAnimationFrame(step);
      }
    };
    rAFId = window.requestAnimationFrame(step);

    return () => {
      if (rAFId) {
        window.cancelAnimationFrame(rAFId);
      }
    };
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

export const Dashboard: React.FC = () => {
  const { profile, tasks, habits, sessions } = useApp();
  const navigate = useNavigate();

  const [greeting, setGreeting] = useState('');
  const [selectedCrisisTask, setSelectedCrisisTask] = useState<Task | null>(null);
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);

  // Set greeting according to system time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Compute stats
  const activeTasks = tasks.filter(t => !t.completed);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = tasks.filter(t => t.completed && t.completedAt && t.completedAt.split('T')[0] === todayStr).length;
  
  const totalTasksToday = tasks.filter(t => {
    const isTodayTask = t.deadline.split('T')[0] === todayStr;
    const isCompToday = t.completed && t.completedAt && t.completedAt.split('T')[0] === todayStr;
    return isTodayTask || isCompToday;
  }).length;

  const todayCompletedCount = tasks.filter(t => t.completed && t.completedAt && t.completedAt.split('T')[0] === todayStr).length;
  const todayProgressPercent = totalTasksToday > 0 ? Math.round((todayCompletedCount / totalTasksToday) * 100) : 0;

  const totalFocusHours = Number(((profile?.totalFocusMinutes || 0) / 60).toFixed(1));
  const dayStreak = profile?.longestStreak || 0;

  // Crisis tasks: active, and deadline is less than 3 hours away
  const crisisTasks = activeTasks.filter(t => {
    const deadlineTime = new Date(t.deadline).getTime();
    const nowTime = Date.now();
    const diffHours = (deadlineTime - nowTime) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours < 3;
  });

  // Recent tasks (last 3 added/updated)
  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  // Calculate last 7 days list for the mini-calendar
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const dayNum = d.getDate();
    
    // Check if any habit was completed on this day
    const completedOnDay = habits.some(h => h.lastCompleted === dateStr);

    return {
      dateStr,
      dayName,
      dayNum,
      active: dateStr === todayStr,
      completed: completedOnDay
    };
  });

  return (
    <div className="space-y-8 select-none">
      
      {/* Animated Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-1"
      >
        <h2 className="text-3xl md:text-4xl font-sans font-bold tracking-tight text-[#F7FAFC]">
          {greeting}, <span className="bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] bg-clip-text text-transparent font-extrabold">{profile?.name || 'Developer'}</span>
        </h2>
        <p className="text-sm font-medium text-[#A0AEC0] font-sans">
          Welcome back to the command center. Let's crush these timelines today.
        </p>
      </motion.div>

      {/* Grid: Stat Cards & Progress Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metric stats list */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          
          {/* Active Tasks card (Blue) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            whileHover={{ y: -4, borderColor: 'rgba(99, 179, 237, 0.3)' }}
            className="p-5 rounded-2xl bg-[#131929] border border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A0AEC0] uppercase font-mono tracking-wider">Active Tasks</span>
              <div className="p-2 rounded-xl bg-[#63B3ED]/10 text-[#63B3ED]">
                <Folder className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-3xl font-extrabold text-[#F7FAFC] font-sans">
                <CountUpValue end={activeTasks.length} />
              </h4>
              <p className="text-xs text-[#A0AEC0] mt-1 font-medium">Ticking and waiting</p>
            </div>
          </motion.div>

          {/* Completed Today card (Green) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ y: -4, borderColor: 'rgba(104, 211, 145, 0.3)' }}
            className="p-5 rounded-2xl bg-[#131929] border border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A0AEC0] uppercase font-mono tracking-wider">Completed Today</span>
              <div className="p-2 rounded-xl bg-[#68D391]/10 text-[#68D391]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-3xl font-extrabold text-[#F7FAFC] font-sans">
                <CountUpValue end={completedToday} />
              </h4>
              <p className="text-xs text-[#A0AEC0] mt-1 font-medium">Beaten to the clock</p>
            </div>
          </motion.div>

          {/* Day Streak card (Orange Flame) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            whileHover={{ y: -4, borderColor: 'rgba(246, 173, 85, 0.3)' }}
            className="p-5 rounded-2xl bg-[#131929] border border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A0AEC0] uppercase font-mono tracking-wider">Day Streak</span>
              <div className="p-2 rounded-xl bg-[#F6AD55]/10 text-[#F6AD55] animate-pulse">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-3xl font-extrabold text-[#F7FAFC] font-sans flex items-center gap-1">
                <CountUpValue end={dayStreak} /> <span className="text-lg">🔥</span>
              </h4>
              <p className="text-xs text-[#A0AEC0] mt-1 font-medium">Consecutive execution</p>
            </div>
          </motion.div>

          {/* Focus Hours card (Purple) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ y: -4, borderColor: 'rgba(159, 122, 234, 0.3)' }}
            className="p-5 rounded-2xl bg-[#131929] border border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A0AEC0] uppercase font-mono tracking-wider">Focus Hours</span>
              <div className="p-2 rounded-xl bg-[#9F7AEA]/10 text-[#9F7AEA]">
                <Timer className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-3xl font-extrabold text-[#F7FAFC] font-sans">
                <CountUpValue end={totalFocusHours} suffix="h" />
              </h4>
              <p className="text-xs text-[#A0AEC0] mt-1 font-medium">Deep work metrics</p>
            </div>
          </motion.div>
        </div>

        {/* Circular SVG Completion Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="p-6 rounded-2xl bg-[#131929] border border-white/5 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA]" />
          <span className="text-xs font-bold text-[#A0AEC0] uppercase font-mono tracking-wider mb-3">Today's Target Rate</span>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Outer grey circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-white/5"
                strokeWidth="7"
                fill="none"
              />
              {/* Colored active stroke */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-[url(#gradient)]"
                strokeWidth="7"
                strokeDasharray="263.8"
                initial={{ strokeDashoffset: 263.8 }}
                animate={{ strokeDashoffset: 263.8 - (263.8 * todayProgressPercent) / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="none"
              />
              {/* Gradients defs */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#63B3ED" />
                  <stop offset="100%" stopColor="#9F7AEA" />
                </linearGradient>
              </defs>
            </svg>
            {/* Inner text percent */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-[#F7FAFC] font-sans">
                {todayProgressPercent}%
              </span>
              <span className="text-[10px] text-[#A0AEC0] uppercase font-mono tracking-wider">Beaten</span>
            </div>
          </div>

          <p className="text-xs text-[#A0AEC0] mt-4 max-w-[180px] leading-relaxed">
            {todayCompletedCount} of {totalTasksToday} schedule tasks cleared today
          </p>
        </motion.div>
      </div>

      {/* Main dashboard columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3 Content: Crisis Zone & Recent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dedicated Crisis Zone Section */}
          <motion.section
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-6 rounded-2xl border shadow-xl relative overflow-hidden transition-all duration-300 ${
              crisisTasks.length > 0 
                ? 'bg-gradient-to-br from-[#FC8181]/10 to-transparent border-[#FC8181]/20 crisis-pulse' 
                : 'bg-[#131929] border-white/5'
            }`}
          >
            {crisisTasks.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-[#FC8181] animate-bounce" />
                  <h3 className="text-lg font-bold text-[#FC8181] tracking-tight font-sans">🚨 Crisis Zone: Due within 3 Hours</h3>
                </div>

                <div className="space-y-3">
                  {crisisTasks.map((task) => {
                    const deadlineTime = new Date(task.deadline).getTime();
                    const remainingMinutes = Math.max(0, Math.floor((deadlineTime - Date.now()) / (1000 * 60)));
                    const mm = String(remainingMinutes % 60).padStart(2, '0');
                    const hh = String(Math.floor(remainingMinutes / 60)).padStart(2, '0');

                    return (
                      <div 
                        key={task.id}
                        className="p-4 rounded-xl bg-[#0E1320]/80 border border-[#FC8181]/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-[#FC8181] bg-[#FC8181]/10 border border-[#FC8181]/20 mr-2 uppercase tracking-wider">
                            CRISIS
                          </span>
                          <span className="text-sm font-bold text-[#F7FAFC] font-sans truncate">{task.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 justify-between md:justify-end">
                          <div className="text-right flex items-center gap-1.5 text-[#FC8181] font-mono font-bold text-xs bg-[#FC8181]/10 px-2 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                            <span>{hh}:{mm} Left</span>
                          </div>
                          <button
                            onClick={() => setSelectedCrisisTask(task)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#FC8181] hover:bg-[#e47474] text-[#080B14] text-xs font-extrabold uppercase tracking-wide cursor-pointer hover:shadow-[0_0_15px_rgba(252,129,129,0.35)] transition-all"
                          >
                            Crisis Help
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-[#68D391]/10 text-[#68D391] mt-0.5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#68D391] tracking-tight font-sans">🚨 Crisis Zone: Safe & Stable</h3>
                    <p className="text-sm text-[#A0AEC0] mt-1 font-sans font-medium">
                      All timelines are stable. No active tasks are due in the next 3 hours.
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-mono font-bold text-[#68D391] bg-[#68D391]/10 border border-[#68D391]/20 uppercase tracking-widest">
                    All Systems Nominal
                  </span>
                </div>
              </div>
            )}
          </motion.section>

          {/* Recent Tasks List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between select-none">
              <h3 className="text-lg font-bold text-[#F7FAFC] tracking-tight">Recent Tasks</h3>
              <Link to="/tasks" className="text-xs font-bold text-[#63B3ED] hover:text-[#9F7AEA] flex items-center gap-1 transition-colors">
                <span>View All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentTasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#131929] border border-white/5 text-center text-sm text-[#A0AEC0]">
                No active tasks logged yet. Hit the FAB + to launch your first task!
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task, idx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ x: 3, borderColor: 'rgba(255,255,255,0.12)' }}
                    className="p-4 rounded-xl bg-[#131929] border border-white/5 flex items-center justify-between gap-4 transition-colors cursor-pointer"
                    onClick={() => setSelectedDetailTask(task)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Check checkbox draw animation */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/tasks');
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                          task.completed 
                            ? 'bg-[#68D391] border-[#68D391] text-[#080B14]' 
                            : 'border-[#4A5568] hover:border-[#63B3ED]'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-[#080B14]" />}
                      </button>

                      <div className="truncate">
                        <h4 className={`text-sm font-bold text-[#F7FAFC] ${task.completed ? 'line-through text-[#4A5568]' : ''}`}>
                          {task.title}
                        </h4>
                        <p className="text-xs text-[#A0AEC0] font-medium mt-0.5 truncate max-w-sm md:max-w-md">
                          {task.context}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-[#A0AEC0]">
                        {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        task.complexity === 'critical' ? 'bg-[#FC8181]/15 text-[#FC8181]' :
                        task.complexity === 'high' ? 'bg-[#F6AD55]/15 text-[#F6AD55]' :
                        task.complexity === 'medium' ? 'bg-[#63B3ED]/15 text-[#63B3ED]' : 'bg-[#68D391]/15 text-[#68D391]'
                      }`}>
                        {task.complexity}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right 1/3 Column: AI Briefing Preview & 7-Day Habit Tracker */}
        <div className="space-y-6">
          
          {/* AI Briefing Gradient Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onClick={() => navigate('/briefing')}
            className="p-5 rounded-2xl bg-[#131929] border border-transparent bg-gradient-to-r from-[#131929] to-[#1a2235] hover:shadow-[0_0_20px_rgba(159,122,234,0.15)] relative cursor-pointer group"
            style={{
              borderImage: 'linear-gradient(135deg, #63B3ED, #9F7AEA) 1',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: '16px' // CSS workaround for border-image with border-radius
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest text-[#9F7AEA] bg-[#9F7AEA]/10 border border-[#9F7AEA]/20">
                Briefing Pending
              </span>
              <Sparkles className="w-5 h-5 text-[#9F7AEA]" />
            </div>

            <h4 className="text-base font-bold text-[#F7FAFC] leading-snug group-hover:text-[#63B3ED] transition-colors">
              Synthesize Your Tactical Daily Roadmap
            </h4>
            <p className="text-xs text-[#A0AEC0] mt-1.5 leading-relaxed font-sans font-medium">
              Let Gemini 2.0 scan all pending items and draft your custom morning checklist.
            </p>

            <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#63B3ED]">
              <span>Review AI Briefing</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* 7-Day Habit Streak Mini-Calendar */}
          <section className="p-5 rounded-2xl bg-[#131929] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider font-sans">Streak Mini-Calendar</h3>
              <span className="text-[10px] font-mono text-[#F6AD55] font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Weekly Track
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {last7Days.map((day) => (
                <div 
                  key={day.dateStr}
                  className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                    day.active 
                      ? 'bg-gradient-to-br from-[#63B3ED]/15 to-[#9F7AEA]/15 border-[#63B3ED] text-[#F7FAFC]' 
                      : day.completed 
                        ? 'bg-[#1A2235]/60 border-[#F6AD55]/30 text-[#F6AD55]'
                        : 'bg-[#0E1320] border-transparent text-[#A0AEC0]'
                  }`}
                  title={`${day.dateStr} - Habits completed: ${day.completed ? 'Yes' : 'No'}`}
                >
                  <span className="text-[10px] font-mono font-bold opacity-60 uppercase">{day.dayName}</span>
                  <span className="text-sm font-bold mt-1 font-mono">{day.dayNum}</span>
                  
                  {/* Status dot/icon */}
                  <div className="mt-1.5">
                    {day.completed ? (
                      <Flame className="w-3.5 h-3.5 text-[#F6AD55] animate-pulse" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/habits')}
              className="w-full mt-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#A0AEC0] hover:text-[#F7FAFC] transition-all border border-transparent hover:border-white/5 cursor-pointer"
            >
              Open Habits Console
            </button>
          </section>
        </div>
      </div>

      {/* Task detail overlay modal */}
      <AnimatePresence>
        {selectedDetailTask && (
          <TaskDetailModal task={selectedDetailTask} onClose={() => setSelectedDetailTask(null)} />
        )}
      </AnimatePresence>

      {/* Crisis help overlay modal */}
      <AnimatePresence>
        {selectedCrisisTask && (
          <CrisisModal task={selectedCrisisTask} onClose={() => setSelectedCrisisTask(null)} />
        )}
      </AnimatePresence>

    </div>
  );
};
