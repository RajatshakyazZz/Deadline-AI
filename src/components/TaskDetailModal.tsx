import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckSquare, 
  Calendar, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ExternalLink,
  Flame,
  Info
} from 'lucide-react';
import { useApp } from './AppContext';
import { Task, Subtask } from '../types';

// Svg animated Drawing Checkbox
const SvgCheckbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors relative flex-shrink-0 cursor-pointer ${
        checked ? 'bg-[#68D391] border-[#68D391]' : 'border-[#4A5568] hover:border-[#63B3ED]'
      }`}
    >
      <AnimatePresence>
        {checked && (
          <motion.svg
            className="w-3.5 h-3.5 text-[#080B14]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              exit={{ pathLength: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
};

// Typewriter Simulation Component
const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let idx = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(idx));
      idx++;
      if (idx >= text.length) {
        clearInterval(interval);
      }
    }, 15); // Adjust typing speed

    return () => clearInterval(interval);
  }, [text]);

  return <p className="text-sm text-[#F7FAFC] leading-relaxed italic font-medium">{displayedText}</p>;
};

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose }) => {
  const { toggleSubtask, updateTask } = useApp();
  const [activeTab, setActiveTab] = useState<'subtasks' | 'schedule' | 'risks' | 'advice'>('subtasks');

  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Custom Google Calendar simulation url generator
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`DeadlineAI: ${task.title}`);
    const details = encodeURIComponent(`Task Category: ${task.category}\nAI Summary: ${task.summary}\nAI recommendation: ${task.aiRecommendation}`);
    
    // Default start/end time based on deadline
    const deadlineDate = new Date(task.deadline);
    const startDate = new Date(deadlineDate.getTime() - 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = deadlineDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080B14]/85 backdrop-blur-md p-4 overflow-y-auto">
      {/* Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0E1320] border border-white/5 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col relative max-h-[90vh]"
      >
        {/* Glow corner element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#63B3ED]/5 to-[#9F7AEA]/5 blur-2xl rounded-full" />

        {/* Modal Header */}
        <div className="p-6 border-b border-white/5 flex items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase bg-[#63B3ED]/10 border border-[#63B3ED]/20 text-[#63B3ED]">
                {task.category}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                task.complexity === 'critical' ? 'bg-[#FC8181]/15 text-[#FC8181]' : 'bg-[#63B3ED]/15 text-[#63B3ED]'
              }`}>
                {task.complexity} Complexity
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#F7FAFC] leading-snug tracking-tight">
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-[#A0AEC0] hover:text-[#F7FAFC] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliding Tabs Switcher */}
        <div className="border-b border-white/5 px-6 flex gap-1 bg-[#131929]/40 relative overflow-x-auto w-full">
          {([
            { id: 'subtasks', label: 'Subtasks', icon: CheckSquare },
            { id: 'schedule', label: 'AI Schedule', icon: Calendar },
            { id: 'risks', label: 'Risks', icon: AlertTriangle },
            { id: 'advice', label: 'AI Advice', icon: Sparkles }
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive ? 'text-[#63B3ED]' : 'text-[#A0AEC0] hover:text-[#F7FAFC]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="details-active-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#63B3ED]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 relative z-10">
          <AnimatePresence mode="wait">
            
            {/* SUBTASKS TAB */}
            {activeTab === 'subtasks' && (
              <motion.div
                key="subtasks-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* SVG Progress Ring column */}
                <div className="flex flex-col items-center justify-center text-center p-4 bg-[#131929] border border-white/5 rounded-2xl md:col-span-1">
                  <span className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-4 font-mono">Completion</span>
                  <div className="relative w-28 h-28 flex items-center justify-center mb-2">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" className="stroke-white/5" strokeWidth="6" fill="none" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="stroke-[#68D391]"
                        strokeWidth="6"
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 - (251.2 * subtaskPercent) / 100 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                    <span className="absolute text-xl font-extrabold text-[#F7FAFC] font-sans">
                      {subtaskPercent}%
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-[#A0AEC0] uppercase tracking-wider font-semibold">
                    {completedSubtasks} of {totalSubtasks} Cleared
                  </p>
                </div>

                {/* Subtask list */}
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider font-mono mb-2">Action Items</h4>
                  {totalSubtasks === 0 ? (
                    <div className="p-6 text-center text-xs text-[#A0AEC0] border border-dashed border-white/5 rounded-xl">
                      No subtasks generated for this item.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {task.subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          className="group flex items-start gap-3 p-3 rounded-xl bg-[#131929]/50 border border-white/5 hover:border-white/10 transition-colors relative"
                        >
                          <div className="mt-0.5">
                            <SvgCheckbox
                              checked={sub.completed}
                              onChange={() => toggleSubtask(task.id, sub.id)}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold text-[#F7FAFC] ${
                              sub.completed ? 'line-through text-[#4A5568]' : ''
                            }`}>
                              {sub.title}
                            </p>
                            
                            {/* Tips shown on hover or micro labels */}
                            {sub.tip && (
                              <p className="text-[11px] text-[#A0AEC0] mt-0.5 font-medium group-hover:text-[#63B3ED] transition-colors leading-relaxed">
                                Tip: {sub.tip}
                              </p>
                            )}
                          </div>

                          {/* Priority badge */}
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              sub.priority === 'must' ? 'bg-[#FC8181]/15 text-[#FC8181]' :
                              sub.priority === 'should' ? 'bg-[#F6AD55]/15 text-[#F6AD55]' : 'bg-[#63B3ED]/15 text-[#63B3ED]'
                            }`}>
                              {sub.priority}
                            </span>
                            {sub.duration && (
                              <span className="text-[10px] text-[#4A5568] font-mono font-bold mt-1">
                                {sub.duration}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* AI SCHEDULE TAB */}
            {activeTab === 'schedule' && (
              <motion.div
                key="schedule-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider font-mono">Recommended Execution Timeline</h4>
                    <p className="text-xs text-[#A0AEC0] mt-0.5">Custom blocks calculated based on your deadline.</p>
                  </div>
                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#63B3ED]/10 border border-[#63B3ED]/20 hover:bg-[#63B3ED]/20 text-[#63B3ED] text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Add to Google Calendar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {task.schedule.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#A0AEC0] bg-[#131929] border border-white/5 rounded-2xl">
                    No custom schedule computed for this task.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 border-l-2 border-white/5 mt-4">
                    {/* Animated vertical timeline line overlay using Framer Motion */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="absolute left-[-2px] top-0 w-0.5 bg-gradient-to-b from-[#63B3ED] to-[#9F7AEA]"
                    />

                    {task.schedule[0].blocks.map((block, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.15 }}
                        className="relative"
                      >
                        {/* Timeline bubble bullet */}
                        <div className="absolute left-[-32px] top-1 w-4.5 h-4.5 rounded-full bg-[#0E1320] border-2 border-[#63B3ED] flex items-center justify-center z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#9F7AEA]" />
                        </div>

                        <div className="p-4 rounded-xl bg-[#131929]/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-mono font-bold text-[#63B3ED] bg-[#63B3ED]/10 px-2 py-0.5 rounded-md mr-3">
                              {block.time}
                            </span>
                            <span className="text-sm font-bold text-[#F7FAFC] font-sans">{block.task}</span>
                          </div>
                          <span className="text-xs text-[#A0AEC0] font-mono font-bold bg-white/5 px-2.5 py-1 rounded-lg">
                            {block.duration}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* RISKS TAB */}
            {activeTab === 'risks' && (
              <motion.div
                key="risks-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="flex flex-col mb-4">
                  <h4 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider font-mono">Procrastination Risks & Bottlenecks</h4>
                  <p className="text-xs text-[#A0AEC0] mt-0.5">Gemini's diagnostic analysis of potential points of failure.</p>
                </div>

                {task.riskFactors.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#A0AEC0] border border-dashed border-white/5 rounded-xl">
                    No risk audits logged.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {task.riskFactors.map((risk, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 rounded-xl bg-[#FC8181]/5 border border-[#FC8181]/15 flex items-start gap-3 shadow-sm"
                      >
                        <AlertTriangle className="w-5 h-5 text-[#FC8181] flex-shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <h5 className="text-xs font-bold text-[#FC8181] uppercase tracking-wider font-mono">Potential Pitfall #{idx + 1}</h5>
                          <p className="text-xs text-[#A0AEC0] mt-1 leading-relaxed font-sans font-medium">{risk}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* AI ADVICE TAB */}
            {activeTab === 'advice' && (
              <motion.div
                key="advice-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#9F7AEA]/10 via-[#131929] to-transparent border border-[#9F7AEA]/20 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-16 h-16 text-[#9F7AEA]" />
                  </div>

                  <div className="flex items-center gap-2.5 mb-4">
                    <Sparkles className="w-5 h-5 text-[#9F7AEA] animate-pulse" />
                    <h4 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider font-mono">DeadlineAI Personal Counselor</h4>
                  </div>

                  {/* Typewriter text advice */}
                  <div className="min-h-16">
                    <TypewriterText text={task.aiRecommendation || 'Load recommendation...'} />
                  </div>
                </div>

                {/* Additional task details contextual checklist */}
                <div className="p-4 bg-[#131929] rounded-xl border border-white/5 flex gap-3 items-center">
                  <Info className="w-5 h-5 text-[#63B3ED] flex-shrink-0" />
                  <p className="text-xs text-[#A0AEC0] font-medium leading-relaxed">
                    This task has an urgency score of <strong className="text-[#63B3ED] font-mono font-bold">{task.urgencyScore}/10</strong>. 
                    Based on our diagnostics, pacing yourself with Focus blocks (Shortcut: F) is highly recommended.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Modal Footer actions */}
        <div className="p-6 border-t border-white/5 bg-[#131929]/30 flex justify-end gap-3 relative z-10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-[#A0AEC0] hover:text-[#F7FAFC] transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </div>
  );
};
