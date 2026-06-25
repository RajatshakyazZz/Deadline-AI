import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  Award,
  Activity,
  Heart,
  Smile,
  Zap,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { Habit } from '../types';
import { callGemini } from '../services/gemini';

export const Habits: React.FC = () => {
  const { habits, addHabit, toggleHabit, deleteHabit, profile } = useApp();

  // Habits states
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Flame');
  const [analysis, setAnalysis] = useState('Calculating progress analysis vectors...');
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  // Available custom icons list
  const iconList = [
    { name: 'Flame', icon: Flame },
    { name: 'Activity', icon: Activity },
    { name: 'Heart', icon: Heart },
    { name: 'Smile', icon: Smile },
    { name: 'Zap', icon: Zap },
    { name: 'BookOpen', icon: BookOpen }
  ];

  // Fetch AI habit advice / status analysis
  const fetchHabitAnalysis = async () => {
    if (habits.length === 0) {
      setAnalysis("Add daily habits and start clicking to generate performance analytics.");
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
      setAnalysis("Consistency is the catalyst of mastery. Maintain your streaks and defend your morning routine.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchHabitAnalysis();
  }, [habits.length]);

  // Form submission
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    await addHabit(newHabitName, selectedIcon);
    setNewHabitName('');
  };

  // Build the 30-day contribution grid details
  const today = new Date();
  const contributionDays = Array.from({ length: 30 }).map((_, idx) => {
    const d = new Date();
    d.setDate(today.getDate() - (29 - idx));
    const dateStr = d.toISOString().split('T')[0];
    
    // Check which habits were completed on this date
    // Note: in Guest/Demo mode, we track lastCompleted string
    const completedCount = habits.filter(h => h.lastCompleted === dateStr).length;
    const totalHabitsCount = habits.length;

    let intensity = 0; // 0: none, 1: low, 2: mid, 3: high
    if (completedCount > 0 && totalHabitsCount > 0) {
      const ratio = completedCount / totalHabitsCount;
      if (ratio <= 0.34) intensity = 1;
      else if (ratio <= 0.67) intensity = 2;
      else intensity = 3;
    }

    return {
      dateStr,
      dayNum: d.getDate(),
      intensity
    };
  });

  // Calculate highest active streak
  const currentHighestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const longestStreakRecord = profile?.longestStreak || currentHighestStreak;

  // Custom 7-day bar chart mock completions (e.g. mock heights for consistency)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekCompletions = [65, 40, 85, 50, 100, 30, 90]; // mock rates for aesthetic layout

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      
      {/* Page Title Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-sans font-bold text-[#F7FAFC] tracking-tight">Atomic Habits Console</h2>
        <p className="text-xs md:text-sm font-medium text-[#A0AEC0] font-sans">
          Anchor your routines. Defend your timeline with consistent micro-commitments.
        </p>
      </div>

      {/* Grid: 30-Day Contribution Grid & Streaks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (2/3): Contribution calendar & Habit form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* GitHub-style Contribution grid */}
          <section className="p-5 rounded-2xl bg-[#131929] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider font-sans">30-Day Completion Matrix</h3>
              <div className="flex items-center gap-1.5 text-xs text-[#A0AEC0] font-mono">
                <span>Less</span>
                <div className="w-2.5 h-2.5 rounded-sm bg-[#131929]" />
                <div className="w-2.5 h-2.5 rounded-sm bg-[#68D391]/30" />
                <div className="w-2.5 h-2.5 rounded-sm bg-[#68D391]/60" />
                <div className="w-2.5 h-2.5 rounded-sm bg-[#68D391]" />
                <span>More</span>
              </div>
            </div>

            {/* 30 grid cells */}
            <div className="grid grid-cols-10 sm:grid-cols-15 gap-2 justify-center">
              {contributionDays.map((day) => {
                let cellBg = 'bg-[#131929] border-white/5';
                if (day.intensity === 1) cellBg = 'bg-[#68D391]/30 border-[#68D391]/10';
                else if (day.intensity === 2) cellBg = 'bg-[#68D391]/60 border-[#68D391]/20';
                else if (day.intensity === 3) cellBg = 'bg-[#68D391] border-[#68D391]/30';

                return (
                  <motion.div
                    key={day.dateStr}
                    whileHover={{ scale: 1.15, zIndex: 10 }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center font-mono text-[9px] font-bold text-[#A0AEC0] hover:text-[#F7FAFC] cursor-pointer transition-all ${cellBg}`}
                    title={`${day.dateStr}: Completion Intensity level ${day.intensity}`}
                  >
                    {day.dayNum}
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Add Habit Form */}
          <section className="p-5 rounded-2xl bg-[#131929] border border-white/5">
            <h3 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider font-sans mb-4">Establish Routine Anchor</h3>
            
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider font-mono">Habit Objective Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plan morning sprint list"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-[#0E1320] border border-white/5 focus:border-[#63B3ED]/30 focus:outline-none text-[#F7FAFC]"
                  />
                </div>

                {/* Icon selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider font-mono">Anchor Icon Representation</label>
                  <div className="flex gap-2">
                    {iconList.map((ic) => {
                      const IconComp = ic.icon;
                      const isSelected = selectedIcon === ic.name;
                      return (
                        <button
                          key={ic.name}
                          type="button"
                          onClick={() => setSelectedIcon(ic.name)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#63B3ED]/15 border-[#63B3ED] text-[#63B3ED]' 
                              : 'bg-[#0E1320] border-white/5 text-[#A0AEC0] hover:text-[#F7FAFC]'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] text-[#080B14] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(159,122,234,0.2)] hover:shadow-[0_4px_25px_rgba(159,122,234,0.4)] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Anchor Habit</span>
              </button>
            </form>
          </section>

          {/* Habits Grid List */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider font-sans">Active Habits</h3>
            {habits.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A0AEC0] bg-[#131929] border border-white/5 rounded-2xl">
                No active habits established yet. Deploy an anchor above!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {habits.map((h) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isDoneToday = h.lastCompleted === todayStr;
                  const IconComp = iconList.find(i => i.name === h.icon)?.icon || Flame;

                  return (
                    <motion.div
                      key={h.id}
                      layoutId={h.id}
                      className="p-4 rounded-xl bg-[#131929] border border-white/5 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Interactive toggle block with satisfying scale bounce */}
                        <motion.button
                          onClick={() => toggleHabit(h.id)}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.9 }}
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            isDoneToday 
                              ? 'bg-[#68D391] border-[#68D391] text-[#080B14] shadow-[0_0_15px_rgba(104,211,145,0.3)]' 
                              : 'bg-[#0E1320] border-white/5 text-[#A0AEC0] hover:border-[#68D391]'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </motion.button>

                        <div className="truncate">
                          <h4 className="text-xs font-bold text-[#F7FAFC] truncate">{h.name}</h4>
                          <span className="text-[10px] font-mono text-[#F6AD55] font-bold flex items-center gap-1 mt-0.5">
                            <Flame className="w-3.5 h-3.5" /> {h.streak} day streak
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Custom icon */}
                        <div className="p-2 rounded-lg bg-[#0E1320] text-[#63B3ED] border border-white/5">
                          <IconComp className="w-4 h-4" />
                        </div>

                        {/* Delete trigger */}
                        <button
                          onClick={() => deleteHabit(h.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-[#4A5568] hover:text-[#FC8181] transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (1/3): Streak meter & Weekly completion chart */}
        <div className="space-y-6">
          
          {/* Day Streak & Record */}
          <section className="p-5 rounded-2xl bg-[#131929] border border-[#F6AD55]/30 shadow-lg relative overflow-hidden flex flex-col items-center justify-center text-center">
            {/* Ambient flame overlay */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#F6AD55]/10 to-transparent blur-xl" />
            
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F6AD55] mb-2">Streak Flame Meter</span>
            
            <div className="relative p-6 rounded-full bg-[#F6AD55]/10 text-[#F6AD55] mb-4 animate-bounce" style={{ animationDuration: '4s' }}>
              <Flame className="w-12 h-12 filter drop-shadow-[0_0_15px_rgba(246,173,85,0.6)]" />
              <span className="absolute inset-0 rounded-full bg-[#F6AD55]/5 animate-ping" />
            </div>

            <h3 className="text-4xl font-extrabold text-[#F7FAFC] font-sans">
              {currentHighestStreak} <span className="text-2xl text-[#F6AD55]">🔥</span>
            </h3>
            
            <div className="mt-4 pt-4 border-t border-white/5 w-full flex justify-between text-xs font-mono">
              <span className="text-[#A0AEC0]">Record Streak:</span>
              <span className="font-bold text-[#F6AD55]">{longestStreakRecord} Days</span>
            </div>
          </section>

          {/* Weekly completion chart (pure CSS layout) */}
          <section className="p-5 rounded-2xl bg-[#131929] border border-white/5 space-y-4">
            <h3 className="text-xs font-bold text-[#F7FAFC] uppercase tracking-wider font-sans">Weekly Consistency Rate</h3>
            
            <div className="flex justify-between items-end h-28 pt-4">
              {weekCompletions.map((pct, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 w-7">
                  <span className="text-[9px] font-mono text-[#A0AEC0] font-bold">{pct}%</span>
                  
                  {/* Column block */}
                  <div className="w-full bg-[#0E1320] h-16 rounded-md overflow-hidden relative border border-white/5 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: idx * 0.05 }}
                      className="w-full bg-gradient-to-t from-[#63B3ED] to-[#9F7AEA]"
                    />
                  </div>

                  <span className="text-[10px] font-mono text-[#4A5568] font-bold uppercase">{weekDays[idx]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Gemini Habit Progress Analysis Advice */}
          <section className="p-5 rounded-2xl bg-gradient-to-br from-[#9F7AEA]/10 via-[#131929] to-transparent border border-[#9F7AEA]/25 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4.5 h-4.5 text-[#9F7AEA] animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9F7AEA]">Routine Analysis</span>
            </div>

            <AnimatePresence mode="wait">
              {loadingAnalysis ? (
                <div className="flex items-center gap-2 text-xs text-[#A0AEC0]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing routines progress...</span>
                </div>
              ) : (
                <motion.p
                  key="habit-analysis"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-[#A0AEC0] leading-relaxed font-sans font-medium italic"
                >
                  "{analysis}"
                </motion.p>
              )}
            </AnimatePresence>
          </section>

        </div>

      </div>

    </div>
  );
};
