import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, MicOff, Sparkles, AlertCircle, Plus } from 'lucide-react';
import { useApp } from './AppContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { callGemini } from '../services/gemini';
import { CategoryType } from '../types';
import { sanitizeClipboardInput, LIMITS } from '../utils/security';

interface AddTaskModalProps {
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose }) => {
  const { addTask } = useApp();
  const { isListening, transcript, error: speechError, startListening, stopListening, setTranscript } = useSpeechToText();

  // Form states
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<CategoryType>('assignment');
  const [context, setContext] = useState('');

  // UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const categories: CategoryType[] = [
    'assignment',
    'meeting',
    'project',
    'personal',
    'payment',
    'interview',
    'other',
  ];

  // Map speech transcript to extra context textarea as the user speaks
  useEffect(() => {
    if (transcript) {
      setContext((prev) => {
        // Replace or append
        return transcript;
      });
    }
  }, [transcript]);

  // Loading steps text sequence for the Gemini analysis skeleton
  const analysisMessages = [
    "Establishing neural pipeline to Gemini 3.5...",
    "Estimating total execution duration hours...",
    "Assessing urgency vectors & risk factors...",
    "Synthesizing 4-step tactical subtask list...",
    "Generating optimal vertical calendar schedule...",
    "Injecting smart recommendations to prevent procrastination...",
    "Finalizing visual card mappings..."
  ];

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setAnalysisStep((prev) => (prev + 1) % analysisMessages.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Task name is required.");
      return;
    }
    if (!deadline) {
      setFormError("Deadline date and time is required.");
      return;
    }

    setFormError(null);
    setIsAnalyzing(true);
    setAnalysisStep(0);

    const prompt = `You are DeadlineAI. Analyze this task and return ONLY valid JSON (no backticks, no wrapping text):
Task Title: "${title}"
Deadline: ${deadline}
Category: ${category}
Extra Context: "${context}"

Return EXACTLY this JSON structure:
{
  "complexity": "low" | "medium" | "high" | "critical",
  "estimatedHours": number,
  "urgencyScore": number (1-10),
  "category": "${category}",
  "summary": "string summary",
  "subtasks": [{"id": "st_1", "title": "subtask title", "duration": "duration text e.g. 30m", "durationMinutes": 30, "priority": "must" | "should" | "nice", "tip": "helpful hover tip"}],
  "schedule": [{"day": "Today", "date": "${new Date().toISOString().split('T')[0]}", "blocks": [{"time": "12:00", "task": "task block description", "duration": "30 mins"}]}],
  "riskFactors": ["risk item 1", "risk item 2"],
  "aiRecommendation": "string AI recommendation tip"
}`;

    try {
      const geminiResult = await callGemini(prompt, true);
      let parsedAnalysis: any;
      try {
        // Strip out optional markdown block wraps if returned
        const cleanedJson = geminiResult.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedAnalysis = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON. Clean output was:", geminiResult);
        throw new Error("Could not parse AI response. Retrying with offline rules.");
      }

      // Add to Firestore/state
      await addTask({
        title,
        deadline,
        category: parsedAnalysis.category || category,
        context: context || parsedAnalysis.summary || 'No custom context provided.',
        complexity: parsedAnalysis.complexity || 'medium',
        estimatedHours: parsedAnalysis.estimatedHours || 1,
        urgencyScore: parsedAnalysis.urgencyScore || 5,
        summary: parsedAnalysis.summary || 'Task prepared by DeadlineAI.',
        subtasks: (parsedAnalysis.subtasks || []).map((st: any, idx: number) => ({
          ...st,
          id: st.id || `st-${idx}-${Math.random()}`,
          completed: false
        })),
        schedule: parsedAnalysis.schedule || [],
        riskFactors: parsedAnalysis.riskFactors || [],
        aiRecommendation: parsedAnalysis.aiRecommendation || 'Tackle head-on.',
      });

      setIsAnalyzing(false);
      onClose();
    } catch (err: any) {
      console.warn("AI synthesis failed, proceeding with high-fidelity offline fallback:", err);
      try {
        // High-fidelity offline fallback data so the user is never blocked
        const fallbackComplexity = title.toLowerCase().includes('exam') || title.toLowerCase().includes('project') || title.toLowerCase().includes('interview') ? 'high' : 'medium';
        const fallbackHours = 2;
        const fallbackUrgency = 5;
        const fallbackSummary = context || `Task "${title}" prepared using offline fallback.`;
        const fallbackSubtasks = [
          { id: `st-off-1-${Math.random()}`, title: "Review requirements and plan steps", duration: "20m", durationMinutes: 20, priority: "must", tip: "Read all constraints first." },
          { id: `st-off-2-${Math.random()}`, title: "Implement core features", duration: "1h 30m", durationMinutes: 90, priority: "must", tip: "Focus on functionality." },
          { id: `st-off-3-${Math.random()}`, title: "Verify with final compile and test", duration: "20m", durationMinutes: 20, priority: "should", tip: "Ensure zero errors." }
        ];
        const fallbackSchedule = [
          {
            day: "Today",
            date: new Date().toISOString().split('T')[0],
            blocks: [
              { time: "Phase 1", task: "Planning and setup", duration: "20 mins" },
              { time: "Phase 2", task: "Core work", duration: "90 mins" },
              { time: "Phase 3", task: "Final checks", duration: "20 mins" }
            ]
          }
        ];

        await addTask({
          title,
          deadline,
          category,
          context: context || fallbackSummary,
          complexity: fallbackComplexity,
          estimatedHours: fallbackHours,
          urgencyScore: fallbackUrgency,
          summary: fallbackSummary,
          subtasks: fallbackSubtasks.map((st) => ({ ...st, completed: false })),
          schedule: fallbackSchedule,
          riskFactors: ["Time pressure", "Unexpected requirements"],
          aiRecommendation: "Pace yourself, work in solid blocks, and test regularly to ensure progress.",
        });

        setIsAnalyzing(false);
        onClose();
      } catch (fallbackErr: any) {
        console.error("Severe fallback error adding task:", fallbackErr);
        setFormError("Could not add task. Please check your network or try again.");
        setIsAnalyzing(false);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
      {/* Animated Card Container */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="liquid-glass border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative max-h-[92vh] flex flex-col"
      >
        {/* Skeleton Shimmer Loading State */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 liquid-glass bg-[#080b14]/90 z-50 flex flex-col items-center justify-center p-8 text-center"
            >
              {/* Spinning / pulsing loading gear */}
              <div className="relative mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                  className="w-16 h-16 rounded-full border-t-2 border-b-2 border-r-2 border-[#63B3ED]/20 border-l-2 border-l-[#9F7AEA]"
                />
                <Sparkles className="w-6 h-6 text-[#63B3ED] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>

              <h4 className="text-xl font-bold text-[#F7FAFC] mb-2">Analyzing Task Urgency</h4>
              
              {/* Sliding step list */}
              <div className="h-6 overflow-hidden max-w-xs w-full relative">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={analysisStep}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    className="text-xs font-mono text-[#A0AEC0] text-center font-medium truncate"
                  >
                    {analysisMessages[analysisStep]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Shimmer bar */}
              <div className="w-48 h-1.5 bg-[#131929] rounded-full mt-6 overflow-hidden border border-white/5 relative">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#63B3ED] to-transparent"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Plus className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-lg font-bold text-[#F7FAFC]">Add Task</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#A0AEC0] hover:text-[#F7FAFC] transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FC8181]/10 border border-[#FC8181]/20 flex items-center gap-2 text-xs font-semibold text-[#FC8181] animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Task Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider font-mono">Task Name</label>
            <input
              type="text"
              required
              maxLength={LIMITS.taskTitle}
              placeholder="e.g. Finish chemistry assignment, Prep quarterly taxes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text');
                const safe = sanitizeClipboardInput(pasted);
                setTitle(prev => (prev + safe).slice(0, LIMITS.taskTitle));
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#63B3ED]/40 focus:bg-white/[0.06] focus:outline-none text-sm text-[#F7FAFC] placeholder-[#4A5568] transition-all font-sans font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider font-mono">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#63B3ED]/40 focus:bg-white/[0.06] focus:outline-none text-sm text-[#F7FAFC] capitalize font-sans font-medium transition-all cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0E1320] text-[#F7FAFC]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Deadline */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider font-mono">Deadline Date / Time</label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#63B3ED]/40 focus:bg-white/[0.06] focus:outline-none text-sm text-[#F7FAFC] font-mono transition-all"
              />
            </div>
          </div>

          {/* Context / Speech Field */}
          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider font-mono">Context & Details (Optional)</label>
              <span className="text-[10px] text-[#4A5568] font-mono">Voice support enabled</span>
            </div>
            
            <div className="relative">
              <textarea
                rows={4}
                maxLength={LIMITS.taskContext}
                placeholder="List key elements, criteria, or click the mic to speak your mind..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text');
                  const safe = sanitizeClipboardInput(pasted);
                  setContext(prev => (prev + safe).slice(0, LIMITS.taskContext));
                }}
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-[#63B3ED]/40 focus:bg-white/[0.06] focus:outline-none text-sm text-[#F7FAFC] placeholder-[#4A5568] transition-all resize-none font-sans font-medium"
              />

              {/* Speech Recognition Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute bottom-3.5 right-3.5 p-2 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer ${
                  isListening
                    ? 'bg-[#FC8181] text-[#080B14] border-[#FC8181] shadow-[0_0_15px_rgba(252,129,129,0.5)]'
                    : 'bg-white/5 text-[#A0AEC0] border-white/5 hover:text-[#F7FAFC] hover:bg-white/10'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking details'}
              >
                {isListening ? (
                  <div className="relative">
                    <Mic className="w-4 h-4 animate-bounce" />
                    {/* Ring pulse waves */}
                    <span className="absolute -inset-1 rounded-xl bg-[#FC8181]/30 animate-ping -z-10" />
                  </div>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Live speech feedback transcript box */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-[#FC8181]/5 border border-[#FC8181]/15 text-xs font-mono text-[#FC8181] flex flex-col gap-1"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FC8181] animate-ping" />
                  <span className="font-bold">Listening & Transcribing:</span>
                </div>
                <p className="italic leading-relaxed">{transcript || 'Say something...'}</p>
              </motion.div>
            )}

            {speechError && (
              <p className="text-[10px] font-mono text-[#F6AD55] mt-1">
                {speechError}
              </p>
            )}
          </div>

          {/* Modal Footer actions */}
          <div className="pt-4 border-t border-white/5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:text-[#F7FAFC] text-[#A0AEC0] text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(37,99,235,0.25)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
