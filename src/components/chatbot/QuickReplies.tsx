import React from 'react';
import { motion } from 'motion/react';
import { Task } from '../../types';
import { getMinutesUntil } from '../../utils/ariaPrompt';

interface QuickRepliesProps {
  onSelectChip: (chipText: string) => void;
  conversationHistory: { role: string; content: string }[];
  tasks: Task[];
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  onSelectChip,
  conversationHistory,
  tasks,
}) => {
  // Determine context to decide which chips to show
  const activeTasks = tasks.filter(t => !t.completed);
  const crisisTasks = activeTasks.filter(t => {
    const mins = getMinutesUntil(t.deadline);
    return mins > 0 && mins < 180;
  });

  const lastUserMessage = [...conversationHistory]
    .reverse()
    .find(m => m.role === 'user')?.content.toLowerCase() || '';

  const lastAssistantMessage = [...conversationHistory]
    .reverse()
    .find(m => m.role === 'assistant')?.content.toLowerCase() || '';

  // Calculate the correct chip set
  let chips: string[] = [];

  // Context: Crisis/Panic mode
  if (
    crisisTasks.length > 0 ||
    lastUserMessage.includes('stress') ||
    lastUserMessage.includes('panic') ||
    lastUserMessage.includes('crisis') ||
    lastAssistantMessage.includes('crisis')
  ) {
    if (crisisTasks.length > 0) {
      chips.push(`🆘 Help me with "${crisisTasks[0].title}"`);
    }
    chips.push('✂ What should I cut?');
    chips.push('💪 Motivate me');
    chips.push('⏱ Start Focus Mode');
  } 
  // Context: Task discussion or breakdown request
  else if (
    lastUserMessage.includes('task') ||
    lastUserMessage.includes('assignment') ||
    lastUserMessage.includes('project') ||
    lastAssistantMessage.includes('task')
  ) {
    chips.push('📋 Break this into subtasks');
    chips.push('⏰ How long will this take?');
    chips.push('📅 Add to my calendar');
    chips.push('📊 Show my progress');
  } 
  // Context: User just completed a task or asking about completion
  else if (
    lastUserMessage.includes('complete') ||
    lastUserMessage.includes('done') ||
    lastUserMessage.includes('finished') ||
    lastAssistantMessage.includes('great work') ||
    lastAssistantMessage.includes('completed')
  ) {
    chips.push('🎉 What should I do next?');
    chips.push('📊 Show my progress');
    chips.push('💡 Give me productivity tips');
  }

  // Fallback to default chips + any relevant dynamic ones
  const defaultChips = [
    '📋 Show my urgent tasks',
    '⚡ How do I add a task?',
    '🚨 What is Crisis Mode?',
    '⏱ Start Focus Mode',
    '💡 Give me productivity tips',
    '📅 How does calendar sync work?',
  ];

  // Combine unique chips, making sure we have at least 4-5 suggestions
  const combinedChips = Array.from(new Set([...chips, ...defaultChips])).slice(0, 6);

  return (
    <div id="quick-replies-container" className="w-full">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 px-4 no-scrollbar scroll-smooth">
        {combinedChips.map((chipText, idx) => (
          <motion.button
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 350, damping: 25 }}
            onClick={() => onSelectChip(chipText)}
            className="flex-shrink-0 bg-white/5 border border-white/10 hover:bg-white/12 hover:border-white/20 text-gray-400 hover:text-white rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-all active:scale-95 select-none"
          >
            {chipText}
          </motion.button>
        ))}
      </div>
      
      {/* Custom style to hide scrollbars while preserving horizontal scroll */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
