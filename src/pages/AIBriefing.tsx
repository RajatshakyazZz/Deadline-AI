import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertTriangle, Zap, Target, BookOpen, Flame, RefreshCw } from 'lucide-react';
import { useApp } from '../components/AppContext';
import { callGemini } from '../services/gemini';

interface BriefingData {
  greeting: string;
  primaryPriority: {
    title: string;
    reason: string;
  };
  quickWins: string[];
  focusSuggestion: string;
  weekOverview: string;
  motivation: string;
}

export const AIBriefing: React.FC = () => {
  const { tasks } = useApp();
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeTasks = tasks.filter(t => !t.completed);

  const fetchBriefing = async () => {
    setLoading(true);
    
    const taskSummary = activeTasks.map(t => ({
      title: t.title,
      deadline: t.deadline,
      complexity: t.complexity,
      context: t.context,
      estimatedHours: t.estimatedHours
    }));

    const prompt = `You are DeadlineAI. Analyze the following list of pending user tasks and construct a beautifully cohesive morning tactical roadmap and briefing.
Tasks:
${JSON.stringify(taskSummary, null, 2)}

Return ONLY valid JSON (no markdown backticks, no raw text):
{
  "greeting": "a high-energy, creative morning/day greeting based on the workload",
  "primaryPriority": {
    "title": "the absolute #1 most urgent task title from the list, or a consolidation",
    "reason": "why this task takes immediate precedent above all else today"
  },
  "quickWins": ["quick action win 1 under 15 min", "quick action win 2 under 15 min"],
  "focusSuggestion": "customized Pomodoro target suggestion for their active project workload",
  "weekOverview": "a concise timeline breakdown of how they should pace their upcoming deadlines",
  "motivation": "a badass, deep, inspiring customized quote to combat procrastination"
}`;

    try {
      const response = await callGemini(prompt, true);
      const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setBriefing(parsed);
    } catch (err) {
      console.error('Failed to compile Gemini briefing roadmap, using high-fidelity offline synthesis:', err);
      // Clean fallback briefing
      setBriefing({
        greeting: "Welcome back, Commander. Time to assert dominance over your timeline.",
        primaryPriority: {
          title: activeTasks[0]?.title || "Tackle core assignment tasks",
          reason: "This task holds the highest complexity quotient and soonest deadline. Frontloading this today will secure your week."
        },
        quickWins: [
          "Audit server credentials (5 mins)",
          "Draft product sync design sliders (10 mins)",
          "Review habit completion metrics (3 mins)"
        ],
        focusSuggestion: "Target 2 Focus blocks (50 mins total) for " + (activeTasks[0]?.title || "general study") + " today. Break immediately after.",
        weekOverview: "Your workload is heavily weighted toward high-complexity tasks. Focus strictly on executing milestones rather than multi-tasking.",
        motivation: "Procrastination is the arrogant assumption that you will have the same amount of time tomorrow as you do today. Beat the ticking clock."
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [tasks.length]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBriefing();
  };

  // Stagger wrapper variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20 } }
  };

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      
      {/* Header bar with Refresh trigger */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-sans font-bold text-[#F7FAFC] tracking-tight">AI Tactical Briefing</h2>
          <p className="text-xs md:text-sm font-medium text-[#A0AEC0] font-sans">
            Gemini 3.5 compiler scanning your entire workload queue.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
          className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#A0AEC0] hover:text-[#F7FAFC] transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh Briefing</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          /* High-Fidelity Skeleton Loading state */
          <motion.div
            key="briefing-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Greeting card shimmer */}
            <div className="liquid-glass p-6 md:col-span-3 space-y-4 relative overflow-hidden">
              <div className="w-1/3 h-5 bg-white/5 rounded-full animate-pulse" />
              <div className="w-2/3 h-4 bg-white/5 rounded-full animate-pulse" />
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-shimmer" />
            </div>

            {/* Left large col shimmers */}
            <div className="md:col-span-2 space-y-6">
              <div className="liquid-glass p-6 h-48 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
                <div className="w-1/2 h-4 bg-white/5 rounded-full animate-pulse" />
                <div className="w-full h-3 bg-white/5 rounded-full animate-pulse" />
                <div className="w-3/4 h-3 bg-white/5 rounded-full animate-pulse" />
              </div>
              <div className="liquid-glass p-6 h-40 space-y-4">
                <div className="w-1/4 h-4 bg-white/5 rounded-full animate-pulse" />
                <div className="w-full h-3 bg-white/5 rounded-full animate-pulse" />
                <div className="w-5/6 h-3 bg-white/5 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Right col shimmers */}
            <div className="md:col-span-1 space-y-6">
              <div className="liquid-glass p-6 h-44 space-y-3">
                <div className="w-1/3 h-4 bg-white/5 rounded-full animate-pulse" />
                <div className="w-full h-10 bg-white/5 rounded-xl animate-pulse" />
                <div className="w-full h-10 bg-white/5 rounded-xl animate-pulse" />
              </div>
              <div className="liquid-glass p-6 h-44 space-y-4">
                <div className="w-1/3 h-4 bg-white/5 rounded-full animate-pulse" />
                <div className="w-full h-3 bg-white/5 rounded-full animate-pulse" />
                <div className="w-2/3 h-3 bg-white/5 rounded-full animate-pulse" />
              </div>
            </div>
          </motion.div>
        ) : (
          briefing && (
            /* Briefing Content Grid */
            <motion.div
              key="briefing-content"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Card 1: Greeting Card with Glowing Animated Gradient Bg */}
              <motion.div
                variants={itemVariants}
                className="liquid-glass liquid-glass-ai p-6 md:col-span-3 shadow-xl relative overflow-hidden"
              >
                {/* Floating particles or gradient corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#63B3ED]/10 to-transparent blur-xl pointer-events-none" />
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-[#63B3ED]/15 text-[#63B3ED]">
                    <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#63B3ED] uppercase tracking-wider">Tactical Report</span>
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-[#F7FAFC] leading-snug">
                  {briefing.greeting}
                </h3>
                <p className="text-xs text-[#A0AEC0] mt-1 font-sans">
                  Compiled on {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </motion.div>

              {/* Left 2 Columns: Primary Priority & Week Overview */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Card 2: Today's #1 Priority (Red Accent Glow) */}
                <motion.div
                  variants={itemVariants}
                  className="liquid-glass liquid-glass-crisis p-6 shadow-lg relative overflow-hidden"
                >
                  {/* Warning banner background */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#FC8181]" />

                  <div className="flex items-center gap-2 mb-4 text-[#FC8181]">
                    <Target className="w-5 h-5" />
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider">Today's #1 Execution Objective</h4>
                  </div>

                  <h3 className="text-lg md:text-xl font-bold text-[#F7FAFC] leading-snug">
                    {briefing.primaryPriority.title}
                  </h3>
                  
                  <p className="text-xs text-[#A0AEC0] mt-2 leading-relaxed font-sans font-medium">
                    {briefing.primaryPriority.reason}
                  </p>
                </motion.div>

                 {/* Card 3: Week Overview */}
                <motion.div
                  variants={itemVariants}
                  className="liquid-glass p-6 space-y-3"
                >
                  <div className="flex items-center gap-2 text-[#9F7AEA]">
                    <BookOpen className="w-5 h-5" />
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider">Weekly Workload Context</h4>
                  </div>
                  
                  <p className="text-xs md:text-sm text-[#A0AEC0] leading-relaxed font-sans font-medium">
                    {briefing.weekOverview}
                  </p>
                </motion.div>
              </div>

              {/* Right 1 Column: Quick Wins & Focus Suggestion & Motivation */}
              <div className="md:col-span-1 space-y-6">
                
                {/* Card 4: Quick Wins < 15 Min Pill List */}
                <motion.div
                  variants={itemVariants}
                  className="liquid-glass p-5 space-y-3.5"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs font-mono font-bold text-[#63B3ED] uppercase">Quick Wins &lt; 15m</span>
                    <Zap className="w-4 h-4 text-[#63B3ED]" />
                  </div>

                  {briefing.quickWins.length === 0 ? (
                    <p className="text-xs text-[#A0AEC0]">No instant wins available.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {briefing.quickWins.map((win, idx) => (
                        <div 
                          key={idx}
                          className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#63B3ED]/20 text-xs font-semibold text-[#F7FAFC] flex items-center gap-2 transition-colors"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#63B3ED]" />
                          <span className="truncate">{win}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Card 5: Focus Suggestion (Green Accent) */}
                <motion.div
                  variants={itemVariants}
                  className="liquid-glass liquid-glass-safe p-5 relative overflow-hidden"
                >
                  {/* Accent border */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#68D391]" />

                  <div className="flex items-center gap-2 mb-2 text-[#68D391]">
                    <Flame className="w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Suggested Focus Session</span>
                  </div>

                  <p className="text-xs text-[#A0AEC0] leading-relaxed font-sans font-medium">
                    {briefing.focusSuggestion}
                  </p>
                </motion.div>

                {/* Card 6: Italic Purple Motivation Message */}
                <motion.div
                  variants={itemVariants}
                  className="liquid-glass p-5 relative overflow-hidden text-center"
                >
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#9F7AEA]">Tactical Fuel</span>
                  <p className="text-xs text-[#A0AEC0] font-bold font-sans italic leading-relaxed mt-2.5">
                    "{briefing.motivation}"
                  </p>
                </motion.div>
              </div>

            </motion.div>
          )
        )}
      </AnimatePresence>

    </div>
  );
};
