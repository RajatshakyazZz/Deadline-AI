import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertOctagon, Flame, ShieldAlert, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { Task } from '../types';
import { callGemini } from '../services/gemini';

// Simple Svg drawing checkbox for emergency checklist
const SvgCrisisCheckbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
        checked ? 'bg-[#FC8181] border-[#FC8181]' : 'border-[#FC8181]/40 bg-red-950/20 hover:border-[#FC8181]'
      }`}
    >
      <AnimatePresence>
        {checked && (
          <motion.svg
            className="w-4 h-4 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              exit={{ pathLength: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
};

interface CrisisModalProps {
  task: Task;
  onClose: () => void;
}

interface EmergencyPlan {
  verdict: string;
  urgency: string;
  message: string;
  checklist: Array<{ id: string; title: string; completed: boolean }>;
  whatToCut: string[];
  motivation: string;
  finalTip: string;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({ task, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<EmergencyPlan | null>(null);
  
  // Real-time ticking remaining seconds
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Load emergency plan from Gemini
  useEffect(() => {
    const fetchPlan = async () => {
      const prompt = `You are DeadlineAI. Synthesize a last-minute emergency crisis execution plan for this urgent task: "${task.title}".
Context details: "${task.context || 'No extra context'}"
T minus less than 3 hours remain!

Return ONLY valid JSON (no markdown backticks, no wrapping text):
{
  "verdict": "SURVIVABLE" | "IMPOSSIBLE_WITHOUT_CUTTING_SCOPE" | "CRITICAL_ACTION_REQUIRED",
  "urgency": "CRITICAL",
  "message": "urgent brief summary statement",
  "checklist": [{"id": "c1", "title": "immediate task action to resolve", "completed": false}],
  "whatToCut": ["unneeded item 1 to drop immediately", "unneeded item 2 to drop immediately"],
  "motivation": "intense, empowering motivational sentence",
  "finalTip": "one final piece of short tactical advice"
}`;

      try {
        const response = await callGemini(prompt, true);
        const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        setPlan(parsed);
      } catch (err) {
        console.error('Failed to parse Gemini crisis plan, using mock:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [task.title, task.context]);

  // Live ticking countdown logic in MM:SS
  useEffect(() => {
    const target = new Date(task.deadline).getTime();
    
    const updateCountdown = () => {
      const diffMs = target - Date.now();
      setSecondsRemaining(Math.max(0, Math.floor(diffMs / 1000)));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [task.deadline]);

  // Checklist items state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Format seconds to HH:MM:SS or MM:SS
  const formatTimeLeft = () => {
    if (secondsRemaining <= 0) return "00:00:00";
    const hrs = Math.floor(secondsRemaining / 3600);
    const mins = Math.floor((secondsRemaining % 3600) / 60);
    const secs = secondsRemaining % 60;

    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/60 backdrop-blur-lg overflow-y-auto">
      
      {/* Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#080B14] border-2 border-[#FC8181]/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(252,129,129,0.3)] max-w-2xl w-full flex flex-col relative max-h-[92vh]"
      >
        {/* Flashing dark-red background hazard overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-transparent to-transparent pointer-events-none" />

        {/* Header bar */}
        <div className="p-6 border-b border-[#FC8181]/15 flex items-center justify-between relative z-10 bg-red-950/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FC8181]/10 text-[#FC8181] animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold text-black bg-[#FC8181] uppercase tracking-wider">
                Crisis Console
              </span>
              <h3 className="text-lg font-bold text-[#FC8181] mt-1 font-sans">
                Emergency Action Triage
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#A0AEC0] hover:text-[#F7FAFC]"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Ticking Emergency Clock */}
        <div className="p-6 bg-red-950/20 border-b border-[#FC8181]/15 text-center relative z-10 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#FC8181]/70 uppercase">
            T-Minus Execution Countdown
          </span>
          <h2 className="text-4xl md:text-5xl font-mono font-extrabold text-[#FC8181] mt-1 filter drop-shadow-[0_0_10px_rgba(252,129,129,0.5)] tracking-wider">
            {formatTimeLeft()}
          </h2>
          <p className="text-xs text-[#A0AEC0] mt-2 max-w-sm">
            Focus purely on the core scope. Do not look away.
          </p>
        </div>

        {/* Scrollable Plan Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 relative z-10 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-10 h-10 rounded-full border-t-2 border-r-2 border-b-2 border-red-500/20 border-l-2 border-l-[#FC8181]"
              />
              <p className="text-xs font-mono text-[#FC8181] uppercase tracking-widest animate-pulse">
                Synthesizing Emergency Plan...
              </p>
            </div>
          ) : (
            plan && (
              <div className="space-y-6">
                
                {/* Triage Verdict */}
                <div className="p-4 rounded-xl bg-[#FC8181]/5 border border-[#FC8181]/15 flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-[#FC8181] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase text-[#FC8181] tracking-wider">
                      Triage Verdict: {plan.verdict}
                    </h4>
                    <p className="text-sm text-[#F7FAFC] mt-1 font-sans font-medium">
                      {plan.message}
                    </p>
                  </div>
                </div>

                {/* Step-by-Step Triage Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FC8181]/80">
                    Tactical Action Checklist
                  </h4>
                  <div className="space-y-2">
                    {plan.checklist.map((step) => {
                      const isChecked = !!checkedItems[step.id];
                      return (
                        <div
                          key={step.id}
                          className={`p-3.5 rounded-xl border flex items-center gap-4 transition-all ${
                            isChecked 
                              ? 'bg-[#FC8181]/5 border-[#FC8181]/30 opacity-60' 
                              : 'bg-[#131929] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <SvgCrisisCheckbox
                            checked={isChecked}
                            onChange={() => toggleItem(step.id)}
                          />
                          <span className={`text-sm font-semibold text-[#F7FAFC] ${
                            isChecked ? 'line-through text-[#4A5568]' : ''
                          }`}>
                            {step.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scope Cuts section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F6AD55]">
                    Scope Trim-List (Drop immediately)
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {plan.whatToCut.map((cutItem, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-lg bg-red-950/20 border border-red-900/20 text-xs font-semibold text-[#A0AEC0] flex items-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#F6AD55]" />
                        <span>{cutItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Motivation advice block */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/30 to-transparent border-l-2 border-[#FC8181] italic text-xs md:text-sm text-[#A0AEC0] leading-relaxed">
                  "{plan.motivation}"
                </div>

                {/* Final tip block */}
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FC8181] bg-[#FC8181]/10 px-3 py-2 rounded-xl">
                  <Flame className="w-4 h-4 text-[#FC8181]" />
                  <span>Final Tip: {plan.finalTip}</span>
                </div>

              </div>
            )
          )}
        </div>

        {/* Modal Footer actions */}
        <div className="p-6 border-t border-[#FC8181]/15 bg-red-950/5 flex justify-end gap-3 relative z-10">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-[#FC8181] hover:bg-[#eb7474] hover:shadow-[0_0_20px_rgba(252,129,129,0.4)] text-[#080B14] text-sm font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>I'm starting NOW</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
