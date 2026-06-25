import React, { useState, useEffect } from 'react';
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
  BookOpen
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { Task, CategoryType, ComplexityType } from '../types';
import { AddTaskModal } from '../components/AddTaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { CrisisModal } from '../components/CrisisModal';
import { callGemini } from '../services/gemini';

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
  const { tasks, completeTask, updateTask, deleteTask } = useApp();
  
  // Navigation & filter states
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'crisis'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [voiceLaunchPreActive, setVoiceLaunchPreActive] = useState(false);

  // Focus & detail modal states
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);
  const [selectedCrisisTask, setSelectedCrisisTask] = useState<Task | null>(null);

  // Sorting overrides (e.g. if prioritized by Gemini)
  const [prioritizedOrder, setPrioritizedOrder] = useState<string[]>([]);
  const [isSortingByAI, setIsSortingByAI] = useState(false);

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
            onClick={handleAIPrioritize}
            disabled={isSortingByAI || tasks.length === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-transparent transition-all active:scale-[0.98] cursor-pointer ${
              isSortingByAI 
                ? 'bg-[#131929] text-[#A0AEC0] border-white/5 animate-pulse' 
                : 'bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] hover:from-[#5aa2d6] hover:to-[#906cd9] text-[#080B14] shadow-[0_4px_15px_rgba(159,122,234,0.2)]'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isSortingByAI ? 'animate-spin' : ''}`} />
            <span>{isSortingByAI ? 'Optimizing...' : 'AI Prioritize All'}</span>
          </button>

          <button
            onClick={triggerVoiceAdd}
            className="p-2.5 rounded-xl bg-[#131929] hover:bg-[#1A2235] text-[#A0AEC0] hover:text-[#F7FAFC] border border-white/5 hover:border-white/10 transition-all flex items-center justify-center cursor-pointer"
            title="Add task via Voice"
          >
            <Mic className="w-5 h-5 text-[#63B3ED]" />
          </button>
        </div>
      </div>

      {/* Tabs list with Framer Motion Sliding Indicators */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-white/5 pb-2">
        <div className="flex gap-1 relative overflow-x-auto w-full md:w-auto">
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
                    className="absolute inset-0 bg-[#63B3ED]/5 border border-[#63B3ED]/20 rounded-xl -z-10"
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
            className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl bg-[#131929] border border-white/5 focus:border-[#63B3ED]/30 focus:outline-none text-[#F7FAFC] placeholder-[#4A5568]"
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
            className="p-12 rounded-2xl bg-[#131929] border border-white/5 flex flex-col items-center text-center max-w-md mx-auto"
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
              onClick={() => setIsAddTaskOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#131929] border border-white/10 hover:border-white/20 hover:bg-[#1A2235] text-xs font-bold text-[#F7FAFC] transition-colors cursor-pointer"
            >
              Add Task Now
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
                    className={`p-5 rounded-2xl bg-[#131929] border border-white/5 relative flex flex-col justify-between overflow-hidden shadow-lg ${
                      isCrisis && !isCompleted ? 'crisis-pulse border-[#FC8181]/40' : ''
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
                        <div className="flex items-center justify-between bg-[#0E1320] border border-white/5 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#4A5568]" />
                            <span className="text-[10px] font-mono font-bold text-[#A0AEC0] uppercase tracking-wider">Clock</span>
                          </div>
                          <CountdownTimer deadline={task.deadline} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-[#68D391]/10 border border-[#68D391]/20 rounded-xl px-3 py-2">
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
                          <div className="w-full h-1.5 bg-[#0E1320] rounded-full overflow-hidden border border-white/5 relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA]"
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
                          onClick={() => completeTask(task.id)}
                          className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isCompleted 
                              ? 'bg-[#131929] border border-[#68D391]/20 text-[#68D391]' 
                              : 'bg-white/5 hover:bg-[#68D391]/10 text-[#A0AEC0] hover:text-[#68D391] border border-transparent hover:border-[#68D391]/15'
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
