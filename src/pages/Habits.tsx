import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Calendar as CalendarIcon, 
  Award,
  Activity,
  Heart,
  Smile,
  Zap,
  RefreshCw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lock,
  Edit2,
  X,
  TrendingUp,
  Info
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { Habit } from '../types';
import { callGemini } from '../services/gemini';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const Habits: React.FC = () => {
  const { 
    habits, 
    addHabit, 
    toggleHabit, 
    updateHabit, 
    deleteHabit, 
    profile
  } = useApp();

  // Selected date context
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-indexed
  const isStrict = true;
  const [missedStreakModalOpen, setMissedStreakModalOpen] = useState(false);
  const [selectedSarcasticMessage, setSelectedSarcasticMessage] = useState('');

  const sarcasticMessages = [
    "Nice try, but you cannot bring back the time that is gone forever.",
    "Trying to rewrite history? Sadly, you cannot bring back lost time, buddy.",
    "Ah, trying to cheat the universe? You cannot bring back the time that is already gone.",
    "Cute attempt, but you can't bring back the time that has slipped away.",
    "Lost time is like a popped balloon – you can't bring it back, no matter how hard you click!"
  ];

  const handleMissedDayClick = () => {
    const randomMsg = sarcasticMessages[Math.floor(Math.random() * sarcasticMessages.length)];
    setSelectedSarcasticMessage(randomMsg);
    setMissedStreakModalOpen(true);
  };

  // Dynamic light/dark theme tracking for charting
  const [isLight, setIsLight] = useState(document.body.classList.contains('light-theme'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.body.classList.contains('light-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Modal States
  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState(false);
  const [isEditHabitModalOpen, setIsEditHabitModalOpen] = useState(false);
  const [selectedEditHabit, setSelectedEditHabit] = useState<Habit | null>(null);

  // New Habit Form States
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('💧');
  const [customEmoji, setCustomEmoji] = useState('');

  // Edit Habit Form States
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitEmoji, setEditHabitEmoji] = useState('💧');

  // AI analysis state
  const [analysis, setAnalysis] = useState('Analyzing routine consistency metrics across your timeline...');
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  // Popular habit emojis
  const popularEmojis = ['💧', '📚', '💪', '🚿', '⏰', '🧘', '🥗', '🏃', '💻', '🎯', '🍎', '🔥', '🧠', '🌿', '🧹'];

  // Current date formatted beautifully
  const formattedTodayDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Calculate days in the currently selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Generate array of day numbers [1, 2, ..., N]
  const monthDaysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  // Selected Month name
  const monthName = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }, [selectedYear, selectedMonth]);

  // Calendar Navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  // Check if a day-number of the selected month is in the future
  const isDayInFuture = (dayNum: number) => {
    const checkDate = new Date(selectedYear, selectedMonth, dayNum);
    // Clear time for precise day comparison
    const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return checkDate > compareToday;
  };

  // Format date string as YYYY-MM-DD for a day in the selected calendar month
  const getDayDateString = (dayNum: number) => {
    const yyyy = selectedYear;
    const mm = String(selectedMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Fetch AI Advisor response
  const fetchHabitAnalysis = async () => {
    if (habits.length === 0) {
      setAnalysis("Establish your routine anchors below. Daily repetitions forge indestructible cognitive pathways.");
      setLoadingAnalysis(false);
      return;
    }

    setLoadingAnalysis(true);
    const habitsPayload = habits.map(h => ({
      name: h.name,
      streak: h.streak,
      lastCompleted: h.lastCompleted
    }));

    const prompt = `You are DeadlineAI. Analyze the user's daily habits list and streaks and output a single sentence of encouraging, analytical evaluation of their progress and consistency.
Habits Data:
${JSON.stringify(habitsPayload, null, 2)}

Return ONLY a single sentence of tactical guidance. No emojis, no markdown wrapper.`;

    try {
      const response = await callGemini(prompt, false);
      setAnalysis(response.trim());
    } catch (err) {
      setAnalysis("Mastery is a product of consistent micro-commitments. Defend your timeline and lock in your daily streaks.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchHabitAnalysis();
  }, [habits.length]);

  // Form Submissions
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const finalEmoji = customEmoji.trim() || newHabitEmoji;
    const nameToCreate = newHabitName.trim();
    
    // Reset and close modal immediately for a snappy user experience
    setNewHabitName('');
    setCustomEmoji('');
    setIsNewHabitModalOpen(false);

    try {
      await addHabit(nameToCreate, finalEmoji);
    } catch (err) {
      console.error("Failed to add habit:", err);
    }
  };

  const handleEditHabitClick = (habit: Habit) => {
    setSelectedEditHabit(habit);
    setEditHabitName(habit.name);
    setEditHabitEmoji(habit.icon);
    setIsEditHabitModalOpen(true);
  };

  // Note: we can delete a habit directly or edit its name/icon in Guest mode or Cloud.
  // For standard compatibility, if we edit a habit, we delete the old one and re-create, or just rename it.
  // Let's implement an edit system. If a habit's name or icon changes, we can delete and re-create,
  // or since AppContext doesn't have an updateHabit method yet, we can simply delete and add back, 
  // or simulate it. Wait, deleting and adding is a perfect fallback if we want to change it.
  // Let's implement a clean handler:
  const handleSaveEditHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditHabit || !editHabitName.trim()) return;

    await updateHabit(selectedEditHabit.id, {
      name: editHabitName.trim(),
      icon: editHabitEmoji
    });
    setIsEditHabitModalOpen(false);
    setSelectedEditHabit(null);
  };

  const handleDeleteClick = async (habitId: string) => {
    await deleteHabit(habitId);
    setIsEditHabitModalOpen(false);
    setSelectedEditHabit(null);
  };

  // --- MATH METRICS FOR THE SELECTED MONTH ---

  // Calculate percentage completion for each habit in the selected month
  const habitCompletionsList = useMemo(() => {
    return habits.map(h => {
      // Get completions that belong to the currently selected month and year
      const completionsInMonth = (h.completedDates || []).filter(dateStr => {
        const [y, m] = dateStr.split('-').map(Number);
        return y === selectedYear && (m - 1) === selectedMonth;
      });

      // Days elapsed in the selected month up to today (or all days if it's a past month)
      let daysElapsed = daysInMonth;
      if (selectedYear === today.getFullYear() && selectedMonth === today.getMonth()) {
        daysElapsed = today.getDate(); // up to today's day number
      } else if (selectedYear > today.getFullYear() || (selectedYear === today.getFullYear() && selectedMonth > today.getMonth())) {
        daysElapsed = 0; // future month
      }

      const rate = daysElapsed > 0 ? Math.round((completionsInMonth.length / daysElapsed) * 100) : 0;
      const rateClamped = Math.min(100, Math.max(0, rate));

      return {
        ...h,
        completionsInMonth,
        rate: rateClamped,
        completionsCount: completionsInMonth.length
      };
    });
  }, [habits, selectedYear, selectedMonth, daysInMonth, today]);

  // Overall statistics
  const overallCompletionsCount = useMemo(() => {
    return habitCompletionsList.reduce((acc, h) => acc + h.completionsCount, 0);
  }, [habitCompletionsList]);

  const overallMaxPossible = useMemo(() => {
    let daysElapsed = daysInMonth;
    if (selectedYear === today.getFullYear() && selectedMonth === today.getMonth()) {
      daysElapsed = today.getDate();
    } else if (selectedYear > today.getFullYear() || (selectedYear === today.getFullYear() && selectedMonth > today.getMonth())) {
      daysElapsed = 0;
    }
    return daysElapsed * habits.length;
  }, [daysInMonth, habits.length, selectedYear, selectedMonth, today]);

  const overallComplianceRate = useMemo(() => {
    if (overallMaxPossible === 0) return 0;
    return Math.round((overallCompletionsCount / overallMaxPossible) * 100);
  }, [overallCompletionsCount, overallMaxPossible]);

  // Best Completion Day
  const bestDayDetails = useMemo(() => {
    if (habits.length === 0) return { day: 'N/A', count: 0 };
    
    const dayCounts: Record<number, number> = {};
    monthDaysArray.forEach(day => {
      dayCounts[day] = 0;
    });

    habits.forEach(h => {
      (h.completedDates || []).forEach(dateStr => {
        const [y, m, d] = dateStr.split('-').map(Number);
        if (y === selectedYear && (m - 1) === selectedMonth) {
          dayCounts[d] = (dayCounts[d] || 0) + 1;
        }
      });
    });

    let bestDayNum = -1;
    let maxCount = 0;
    
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestDayNum = Number(day);
      }
    });

    return {
      day: bestDayNum !== -1 ? `${bestDayNum}` : 'None',
      count: maxCount
    };
  }, [habits, selectedYear, selectedMonth, monthDaysArray]);

  // Active Habits
  const activeHabitsCount = habits.length;

  // Chart Data preparation: daily completions for the selected month
  const trendChartData = useMemo(() => {
    return monthDaysArray.map(day => {
      const dateStr = getDayDateString(day);
      
      // Count completions for all habits on this day
      let completedCount = 0;
      habits.forEach(h => {
        const dates = h.completedDates || (h.lastCompleted ? [h.lastCompleted] : []);
        if (dates.includes(dateStr)) {
          completedCount++;
        }
      });

      return {
        day: `${day}`,
        Completions: completedCount
      };
    });
  }, [monthDaysArray, habits, selectedYear, selectedMonth]);

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto px-1 sm:px-4">
      
      {/* Dynamic Header Section matching "Daily Tracker" */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#F7FAFC] tracking-tight font-sans">Daily Tracker</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold text-[#A0AEC0] flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-[#63B3ED]" />
              {formattedTodayDate}
            </span>
            <div
              className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border transition-all flex items-center gap-1.5 bg-red-500/15 border-red-500/30 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
              title="Strict Mode is permanently locked ON"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>STRICT MODE: ON 🔒</span>
            </div>
          </div>
        </div>

        {/* Apple liquid glass button for adding habit */}
        <button
          onClick={() => setIsNewHabitModalOpen(true)}
          className="apple-glass-btn apple-glass-blue self-start md:self-auto shadow-lg"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* AI Advisory Panel Styled like a Premium Siri Widget */}
      <div className="liquid-glass p-5 relative overflow-hidden border border-white/5 rounded-2xl bg-white/[0.01]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#9F7AEA]/15 to-transparent blur-2xl pointer-events-none" />
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#9F7AEA]/10 text-[#9F7AEA] mt-0.5 border border-[#9F7AEA]/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9F7AEA]">AI Consistency Agent</span>
            <p className="text-xs sm:text-sm text-[#A0AEC0] leading-relaxed font-medium font-sans">
              {loadingAnalysis ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#9F7AEA]" />
                  Recalculating routine compliance factors across your 30-day timeline...
                </span>
              ) : (
                `"${analysis}"`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Monthly Calendar Selector Panel */}
      <div className="liquid-glass p-6 space-y-6 rounded-3xl border border-white/5 shadow-xl bg-white/[0.02]">
        
        {/* Calendar Month Header Controller */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#9F7AEA]" />
            <h3 className="text-xl font-extrabold text-[#F7FAFC] font-sans tracking-tight">
              {monthName}
            </h3>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.06] text-[#A0AEC0] hover:text-[#F7FAFC] transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleGoToToday}
              className="px-3.5 py-1.5 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20 text-[#9F7AEA] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              TODAY
            </button>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.06] text-[#A0AEC0] hover:text-[#F7FAFC] transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 30-Day Grid Layout: Dynamic, Beautiful, & Scrollable */}
        <div className="overflow-x-auto calendar-scrollbar pb-4 relative">
          <div 
            className="grid gap-y-3 min-w-[950px] pr-2"
            style={{
              gridTemplateColumns: `16rem repeat(${daysInMonth}, minmax(2rem, 1fr))`
            }}
          >
            {/* --- COLUMN HEADERS (Day Numbers) --- */}
            <div className={`text-xs font-black uppercase tracking-widest font-mono self-center sticky left-0 z-20 ${
              isLight ? 'bg-slate-50/95 text-slate-400 border-r border-slate-100' : 'bg-[#0a0e17]/95 text-[#A0AEC0] border-r border-white/5'
            } px-3 py-2.5 h-full flex items-center shadow-[4px_0_12px_-4px_rgba(0,0,0,0.15)] mr-2`}>
              🚀 Routines
            </div>
            {monthDaysArray.map((day) => {
              const dateStr = getDayDateString(day);
              const isTodayCell = today.getDate() === day && today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;

              return (
                <div 
                  key={day} 
                  className={`text-center py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                    isTodayCell 
                      ? 'text-[#8B5CF6] scale-110 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]' 
                      : 'text-[#4A5568]'
                  }`}
                  title={isTodayCell ? "Today's column" : `Day ${day}`}
                >
                  {day}
                </div>
              );
            })}

            {/* --- HABIT ROWS --- */}
            {habits.length === 0 ? (
              <div 
                className="col-span-full py-12 text-center text-sm text-[#A0AEC0] font-medium"
              >
                No routine anchors deployed yet. Click "+ New Habit" to forge your first micro-commitment!
              </div>
            ) : (
              habits.map((h) => {
                const habitIcon = h.icon || '🔥';

                return (
                  <React.Fragment key={h.id}>
                    
                    {/* Habit Label Column - Sticky left frozen with custom premium 3D design */}
                    <div className={`flex items-center justify-between gap-3 px-3 py-2 rounded-2xl border sticky left-0 z-10 transition-all ${
                      isLight 
                        ? 'bg-white border-slate-200 shadow-sm text-slate-800' 
                        : 'bg-[#0b101f] border-white/5 shadow-[4px_0_16px_rgba(0,0,0,0.2)] text-white backdrop-blur-md'
                    } min-w-0 mr-2`}>
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Emoji with bubble container */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                          isLight ? 'bg-slate-100' : 'bg-white/[0.03] border border-white/5'
                        }`}>
                          {habitIcon}
                        </div>
                        <div className="truncate">
                          <h4 className={`text-xs font-extrabold tracking-tight truncate ${
                            isLight ? 'text-slate-800' : 'text-slate-100'
                          }`} title={h.name}>
                            {h.name}
                          </h4>
                          <span className="text-[9px] font-mono text-[#F6AD55] font-extrabold flex items-center gap-1 mt-0.5 bg-[#F6AD55]/10 px-1.5 py-0.5 rounded-full w-max">
                            <Flame className="w-2.5 h-2.5 text-[#F6AD55] fill-[#F6AD55]/10" /> {h.streak}d streak
                          </span>
                        </div>
                      </div>

                      {/* Edit Pencil icon */}
                      <button
                        onClick={() => handleEditHabitClick(h)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                          isLight 
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-slate-700' 
                            : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.06] text-gray-400 hover:text-gray-200'
                        }`}
                        title={`Edit "${h.name}"`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Completion Days Checkboxes Column */}
                    {monthDaysArray.map((day) => {
                      const dateStr = getDayDateString(day);
                      const isFuture = isDayInFuture(day);
                      const completedDates = h.completedDates || (h.lastCompleted ? [h.lastCompleted] : []);
                      const isCompleted = completedDates.includes(dateStr);
                      const isTodayCell = today.getDate() === day && today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;

                      // Past days are locked in Strict Mode unless already completed
                      const isCellLocked = isFuture || (isStrict && !isTodayCell);

                      const isMissedDay = !isFuture && !isCompleted && !isTodayCell;

                      // Classes for rendering
                      let cellClass = '';
                      let content = null;

                      if (isFuture) {
                        // Future locked cell
                        cellClass = 'bg-white/[0.01] border-white/[0.03] text-white/[0.04] cursor-not-allowed';
                        content = <Lock className="w-2.5 h-2.5 opacity-20" />;
                      } else if (isCompleted) {
                        // Completed day cell (gorgeous purple gradient checkmark)
                        cellClass = 'bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] border-[#8B5CF6]/30 text-white shadow-[0_0_12px_rgba(139,92,246,0.35)]';
                        if (isCellLocked) {
                          cellClass += ' cursor-not-allowed opacity-85';
                        } else {
                          cellClass += ' cursor-pointer';
                        }
                        content = <Check className="w-3.5 h-3.5 stroke-[3]" />;
                      } else {
                        // Past uncompleted day cell or today cell
                        if (isCellLocked) {
                          // Past locked cell in Strict Mode (a missed day box)
                          cellClass = 'bg-white/[0.01] border-white/[0.02] text-white/[0.05] cursor-pointer hover:border-red-500/20 hover:bg-red-500/5';
                          content = <Lock className="w-2.5 h-2.5 opacity-25 text-red-400" />;
                        } else {
                          // Interactive uncompleted cell (today or past if not strict)
                          cellClass = isTodayCell
                            ? 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40 text-purple-400 hover:bg-purple-500/10 cursor-pointer shadow-[0_0_8px_rgba(139,92,246,0.15)]'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/20 text-[#4A5568] hover:bg-white/[0.05] cursor-pointer';
                        }
                      }

                      return (
                        <div key={`${h.id}-${day}`} className="flex items-center justify-center">
                          <motion.button
                            whileHover={isFuture ? {} : { scale: 1.12 }}
                            whileTap={isFuture ? {} : { scale: 0.92 }}
                            onClick={() => {
                              if (isMissedDay) {
                                handleMissedDayClick();
                              } else if (!isCellLocked) {
                                toggleHabit(h.id, dateStr);
                              }
                            }}
                            disabled={isFuture}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all ${cellClass}`}
                            title={isFuture ? "Locked (Future Day)" : isMissedDay ? "Missed Day - Nice try but you cannot change history!" : `${h.name} - ${dateStr} (${isCompleted ? 'Done' : 'Incomplete'})`}
                          >
                            {content}
                          </motion.button>
                        </div>
                      );
                    })}

                  </React.Fragment>
                );
              })
            )}

          </div>
        </div>

      </div>

      {/* Overall Progress Bars Section */}
      {habits.length > 0 && (
        <div className="liquid-glass p-6 rounded-3xl border border-white/5 shadow-xl bg-white/[0.02]">
          <h3 className="text-sm font-extrabold text-[#F7FAFC] uppercase tracking-wider font-sans mb-4 flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-[#63B3ED]" />
            Overall Monthly Progress
          </h3>

          <div className="space-y-4">
            {habitCompletionsList.map((h) => (
              <div key={h.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#F7FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{h.icon || '🔥'}</span>
                    <span>{h.name}</span>
                  </div>
                  <span className="font-mono text-[#63B3ED]">{h.rate}%</span>
                </div>
                
                {/* Modern Apple-style glow progress bar */}
                <div className="h-2 rounded-full bg-white/[0.03] border border-white/5 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${h.rate}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Trends Section with Line Chart and Bottom Analytics Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Left 2/3) */}
        <div className="lg:col-span-2 liquid-glass p-6 rounded-3xl border border-white/5 shadow-xl bg-white/[0.02] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#F7FAFC] uppercase tracking-wider font-sans mb-1 flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#8B5CF6]" />
              Daily Trends
            </h3>
            <p className="text-[11px] font-medium text-[#A0AEC0] mb-4">
              Total number of habits completed each day for {monthName}
            </p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendChartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isLight ? "#4F46E5" : "#8B5CF6"} stopOpacity={isLight ? 0.25 : 0.4}/>
                    <stop offset="95%" stopColor={isLight ? "#4F46E5" : "#8B5CF6"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255,255,255,0.02)"} vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke={isLight ? "#718096" : "#4A5568"} 
                  fontSize={10}
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke={isLight ? "#718096" : "#4A5568"} 
                  fontSize={10} 
                  fontWeight={600}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, habits.length || 5]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(11, 15, 26, 0.95)',
                    border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '10px 14px',
                    fontSize: '11px',
                    color: isLight ? '#1A202C' : '#F7FAFC'
                  }}
                  cursor={{ stroke: isLight ? 'rgba(79, 70, 229, 0.2)' : 'rgba(139, 92, 246, 0.2)', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Completions" 
                  stroke={isLight ? "#4F46E5" : "#8B5CF6"} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorCompletions)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: isLight ? '#4F46E5' : '#8B5CF6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytics Summary Cards (Right 1/3) */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          
          {/* Card: TOTAL */}
          <div className="liquid-glass p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col justify-between">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#63B3ED]">
              TOTAL
            </span>
            <div className="mt-2">
              <h4 className="text-4xl font-extrabold text-[#F7FAFC] font-sans">
                {overallCompletionsCount}
              </h4>
              <p className="text-[10px] text-[#A0AEC0] font-medium mt-1">
                Completed events this month
              </p>
            </div>
          </div>

          {/* Card: RATE */}
          <div className="liquid-glass p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col justify-between">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#48BB78]">
              RATE
            </span>
            <div className="mt-2">
              <h4 className="text-4xl font-extrabold text-[#48BB78] font-sans">
                {overallComplianceRate}%
              </h4>
              <p className="text-[10px] text-[#A0AEC0] font-medium mt-1">
                Routine compliance index
              </p>
            </div>
          </div>

          {/* Card: BEST DAY */}
          <div className="liquid-glass p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col justify-between col-span-2 lg:col-span-1">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#ED64A6]">
              BEST DAY
            </span>
            <div className="mt-2">
              <h4 className="text-4xl font-extrabold text-[#F7FAFC] font-sans">
                {bestDayDetails.day}
              </h4>
              <p className="text-[10px] text-[#A0AEC0] font-medium mt-1">
                Peak completion date in selected month
              </p>
            </div>
          </div>

          {/* Card: ACTIVE */}
          <div className="liquid-glass p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col justify-between col-span-2 lg:col-span-1">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#ED8936]">
              ACTIVE
            </span>
            <div className="mt-2">
              <h4 className="text-4xl font-extrabold text-[#ED8936] font-sans">
                {activeHabitsCount}
              </h4>
              <p className="text-[10px] text-[#A0AEC0] font-medium mt-1">
                Live routines tracked
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* --- ADD NEW HABIT MODAL (Apple Glass overlay) --- */}
      <AnimatePresence>
        {isNewHabitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewHabitModalOpen(false)}
              className="absolute inset-0 bg-[#0B0F19]/80 backdrop-filter backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-md p-6 rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl space-y-5 z-10"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F7FAFC] font-sans">Deploy Routine Anchor</h3>
                <button
                  onClick={() => setIsNewHabitModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/5 text-[#A0AEC0] hover:text-[#F7FAFC] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateHabit} className="space-y-4">
                
                {/* Habit Name input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#A0AEC0] uppercase tracking-wider font-mono">
                    Habit Name / Objective
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4L Water Daily"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="w-full px-4 py-3 text-xs rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#63B3ED]/40 focus:outline-none text-[#F7FAFC] focus:bg-white/[0.06] transition-all"
                  />
                </div>

                {/* Popular Emojis selection list */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#A0AEC0] uppercase tracking-wider font-mono">
                    Pick an Emoji Icon
                  </label>
                  <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto calendar-scrollbar p-1 bg-white/[0.01] rounded-xl border border-white/5">
                    {popularEmojis.map((emoji) => {
                      const isSelected = newHabitEmoji === emoji && !customEmoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setNewHabitEmoji(emoji);
                            setCustomEmoji('');
                          }}
                          className={`py-2 text-xl rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] scale-105' 
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06]'
                          }`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Emoji override */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#A0AEC0] uppercase tracking-wider font-mono">
                    Or Type Custom Emoji/Icon Representation
                  </label>
                  <input
                    type="text"
                    placeholder="Type an emoji (e.g. 🎯)"
                    maxLength={2}
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    className="w-full px-4 py-2 text-xs rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#63B3ED]/40 focus:outline-none text-[#F7FAFC] transition-all"
                  />
                </div>

                {/* Buttons styled like premium glass */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewHabitModalOpen(false)}
                    className="apple-glass-btn apple-glass-gray text-[#F3F4F6] hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="apple-glass-btn apple-glass-blue text-white"
                  >
                    Anchor Routine
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT / MODIFY EXISTING HABIT MODAL --- */}
      <AnimatePresence>
        {isEditHabitModalOpen && selectedEditHabit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditHabitModalOpen(false)}
              className="absolute inset-0 bg-[#0B0F19]/80 backdrop-filter backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-md p-6 rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl space-y-5 z-10"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F7FAFC] font-sans">Modify Routine Anchor</h3>
                <button
                  onClick={() => setIsEditHabitModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/5 text-[#A0AEC0] hover:text-[#F7FAFC] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditHabit} className="space-y-4">
                
                {/* Habit Name input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#A0AEC0] uppercase tracking-wider font-mono">
                    Habit Name / Objective
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4L Water Daily"
                    value={editHabitName}
                    onChange={(e) => setEditHabitName(e.target.value)}
                    className="w-full px-4 py-3 text-xs rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#63B3ED]/40 focus:outline-none text-[#F7FAFC] focus:bg-white/[0.06] transition-all"
                  />
                </div>

                {/* Popular Emojis selection list */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#A0AEC0] uppercase tracking-wider font-mono">
                    Pick an Emoji Icon
                  </label>
                  <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto calendar-scrollbar p-1 bg-white/[0.01] rounded-xl border border-white/5">
                    {popularEmojis.map((emoji) => {
                      const isSelected = editHabitEmoji === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setEditHabitEmoji(emoji)}
                          className={`py-2 text-xl rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] scale-105' 
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06]'
                          }`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Emoji override */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-[#A0AEC0] uppercase tracking-wider font-mono">
                    Or Type Custom Emoji/Icon Representation
                  </label>
                  <input
                    type="text"
                    placeholder="Type an emoji (e.g. 🎯)"
                    maxLength={2}
                    value={editHabitEmoji}
                    onChange={(e) => setEditHabitEmoji(e.target.value)}
                    className="w-full px-4 py-2 text-xs rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#63B3ED]/40 focus:outline-none text-[#F7FAFC] transition-all"
                  />
                </div>

                {/* Buttons styled like premium glass */}
                <div className="flex items-center justify-between pt-2">
                  
                  {/* Destructive red apple button to delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(selectedEditHabit.id)}
                    className="apple-glass-btn apple-glass-red font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditHabitModalOpen(false)}
                      className="apple-glass-btn apple-glass-gray text-[#F3F4F6] hover:text-white"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="apple-glass-btn apple-glass-blue text-white"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MISSED STREAK SARCASTIC WARNING MODAL --- */}
      <AnimatePresence>
        {missedStreakModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMissedStreakModalOpen(false)}
              className="absolute inset-0 bg-[#0B0F19]/80 backdrop-filter backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-sm p-6 rounded-3xl bg-[#0F172A] border border-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.1)] text-center space-y-4 z-10"
            >
              <div className="flex justify-center">
                <div className="p-3.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 animate-bounce">
                  <Lock className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-[#F7FAFC] font-sans tracking-tight">
                  Strict Mode Warning
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">
                  TEMPORAL RECONCILIATION DENIED
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#A0AEC0] leading-relaxed px-1 font-medium font-sans italic">
                "{selectedSarcasticMessage}"
              </p>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setMissedStreakModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 text-red-400 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.1)] hover:scale-105 active:scale-95"
                >
                  Accept Regret & Move On
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
