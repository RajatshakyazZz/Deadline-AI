import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, X, Minimize2, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext';
import { AriaFace, AriaExpression } from './AriaFace';
import { ChatMessage, Message } from './ChatMessage';
import { QuickReplies } from './QuickReplies';
import { buildAriaSystemPrompt, getMinutesUntil, isToday } from '../../utils/ariaPrompt';

// Interface for Gemini response format
interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

// Coded Cybernetic/Robotic Waving Hand Component
interface RoboticHandProps {
  isWaving: boolean;
}

const RoboticHand: React.FC<RoboticHandProps> = ({ isWaving }) => {
  return (
    <motion.div
      id="aria-wave-hand-robotic"
      className="absolute -top-7 -right-2 w-10 h-10 select-none pointer-events-none drop-shadow-[0_2px_8px_rgba(99,179,237,0.5)] flex items-center justify-center z-10"
      style={{ transformOrigin: 'bottom center' }}
      animate={isWaving ? { 
        rotate: [-18, 18, -18, 18, -18, 18, -18, 0],
        x: [0, -1.5, 1.5, -1.5, 1.5, -1.5, 1.5, 0],
        y: [0, -1, 0, -1, 0, -1, 0, 0]
      } : { rotate: 0, x: 0, y: 0 }}
      transition={{ 
        duration: 1.8, 
        ease: "easeInOut" 
      }}
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#cbd5e0" />
            <stop offset="100%" stopColor="#4A5568" />
          </linearGradient>
          <linearGradient id="dark-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="100%" stopColor="#1A202C" />
          </linearGradient>
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#63B3ED" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Wrist Connector */}
        <path d="M10 20H14V23H10V20Z" fill="#718096" />
        <rect x="9" y="17" width="6" height="3" rx="1.5" fill="url(#dark-metal)" stroke="#cbd5e0" strokeWidth="0.75" />
        {/* Wrist neon status bar */}
        <line x1="10.5" y1="18.5" x2="13.5" y2="18.5" stroke="#63B3ED" strokeWidth="1" strokeLinecap="round" />

        {/* Outer Palm Plate */}
        <path d="M8 11.5C8 9.5 9 9 10 9H14C15 9 16 9.5 16 11.5V17H8V11.5Z" fill="url(#metal-grad)" stroke="#2D3748" strokeWidth="0.75" />
        
        {/* Inner Palm Cybernetic Chamber */}
        <path d="M9.5 12C9.5 11 10 10.5 11 10.5H13C14 10.5 14.5 11 14.5 12V15.5H9.5V12Z" fill="#1A202C" stroke="#4A5568" strokeWidth="0.5" />
        
        {/* Core Reactor Indicator */}
        <circle cx="12" cy="13" r="2" fill="url(#core-glow)" />
        <circle cx="12" cy="13" r="0.8" fill="#EBF8FF" />

        {/* Cybernetic wiring track */}
        <path d="M12 14.5V16" stroke="#63B3ED" strokeWidth="0.5" strokeLinecap="round" />

        {/* Articulated Thumb */}
        <path d="M8 13.5L5.5 12L4.5 12.5L7 14.5L8 14.2" fill="url(#dark-metal)" stroke="#2D3748" strokeWidth="0.5" />
        <circle cx="4.5" cy="12.5" r="0.8" fill="#9F7AEA" />

        {/* Articulated Index Finger */}
        <path d="M9.5 9V5.5" stroke="#718096" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M9.5 5.5V3.5" stroke="#cbd5e0" strokeWidth="1" strokeLinecap="round" />
        <circle cx="9.5" cy="5.5" r="0.7" fill="#9F7AEA" />

        {/* Articulated Middle Finger */}
        <path d="M11.1 9V4.5" stroke="#718096" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M11.1 4.5V2.3" stroke="#cbd5e0" strokeWidth="1" strokeLinecap="round" />
        <circle cx="11.1" cy="4.5" r="0.7" fill="#9F7AEA" />

        {/* Articulated Ring Finger */}
        <path d="M12.8 9V5" stroke="#718096" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M12.8 5V2.8" stroke="#cbd5e0" strokeWidth="1" strokeLinecap="round" />
        <circle cx="12.8" cy="5" r="0.7" fill="#9F7AEA" />

        {/* Articulated Pinky Finger */}
        <path d="M14.5 9V6" stroke="#718096" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M14.5 6V4.2" stroke="#cbd5e0" strokeWidth="1" strokeLinecap="round" />
        <circle cx="14.5" cy="6" r="0.7" fill="#9F7AEA" />
      </svg>
    </motion.div>
  );
};

export const AriaChat: React.FC = () => {
  const { profile, tasks, habits, sessions, showToast } = useApp();
  
  // Chat window visibility states
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Conversation and status states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAriaTyping, setIsAriaTyping] = useState(false);
  const [ariaExpression, setAriaExpression] = useState<AriaExpression>('happy');
  
  // Waving and Idle tracking
  const [isWaving, setIsWaving] = useState(false);
  const [isIdle60s, setIsIdle60s] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Scroll anchor
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Calculate crisis tasks count for the Notification Badge
  const activeTasks = tasks.filter(t => !t.completed);
  const crisisTasks = activeTasks.filter(t => {
    const mins = getMinutesUntil(t.deadline);
    return mins > 0 && mins < 180;
  });
  const crisisCount = crisisTasks.length;

  // 2. Triggers waving animation on page load after 2s, then every 30s
  useEffect(() => {
    const waveAndReset = () => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 2000); // 2s wave
    };

    // Initial 2s delay
    const initialWaveTimer = setTimeout(waveAndReset, 2000);

    // 30s interval
    const intervalWaveTimer = setInterval(waveAndReset, 30000);

    return () => {
      clearTimeout(initialWaveTimer);
      clearInterval(intervalWaveTimer);
    };
  }, []);

  // 3. Monitor Idle State: 60s of inactivity triggers attention pulse rings
  const resetIdleTimer = () => {
    setIsIdle60s(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      if (!isOpen) {
        setIsIdle60s(true);
      }
    }, 60000); // 60 seconds
  };

  useEffect(() => {
    // Listen to mouse/keyboard interactions to reset idle state
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen]);

  // 4. Initialize Greeting when Chat is opened for the first time
  const hasTriggeredGreeting = useRef(false);
  const triggerGreeting = () => {
    if (hasTriggeredGreeting.current) return;
    hasTriggeredGreeting.current = true;
    
    setIsAriaTyping(true);
    setAriaExpression('excited');

    const firstName = profile?.name ? profile.name.split(' ')[0] : 'Developer';
    const totalCount = activeTasks.length;
    const topTask = activeTasks.sort((a, b) => b.urgencyScore - a.urgencyScore)[0]?.title || 'your priorities';
    const completedCount = tasks.filter(t => t.completed && isToday(t.completedAt)).length;
    const streakDays = profile?.longestStreak || habits.reduce((max, h) => Math.max(max, h.streak), 0) || 0;

    let greetingText = '';
    const hour = new Date().getHours();

    if (crisisCount > 0) {
      greetingText = `Hey ${firstName}! 🚨 I see you have ${crisisCount} task(s) in crisis mode! Let me help you tackle them right now.`;
      setAriaExpression('concerned');
    } else if (hour < 12) {
      greetingText = `Good morning, ${firstName}! ☀️ Ready to crush your ${totalCount} tasks today? Your top priority is: ${topTask}.`;
    } else if (hour < 17) {
      greetingText = `Hey ${firstName}! 👋 You've completed ${completedCount} tasks today — great work! You have ${totalCount} more to go. What do you need help with?`;
    } else {
      greetingText = `Evening, ${firstName}! 🌙 You've been productive today. Your ${streakDays} day streak is going strong! Anything I can help you wrap up?`;
    }

    if (tasks.length === 0) {
      greetingText = `Hey ${firstName}! 👋 Welcome to DeadlineAI! I'm Aria, your AI productivity companion. Want me to show you how to add your first task?`;
    }

    // Typewriter effect simulation for the greeting
    setTimeout(() => {
      typeOutAriaResponse(greetingText);
    }, 600);
  };

  const handleOpenChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    resetIdleTimer();
    
    if (!isOpen) {
      setTimeout(triggerGreeting, 300);
    }
  };

  // 5. Scroll messages into view
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAriaTyping]);

  // 6. Speech-to-Text Voice Recording handler
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      showToast({ type: 'error', message: 'Speech recognition is not supported in this browser.' });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition', err);
      }
    }
  };

  // 7. Typewriter text display simulation
  const typeOutAriaResponse = (fullText: string) => {
    setIsAriaTyping(false);
    
    const messageId = `msg-aria-${Date.now()}`;
    const newMsg: Message = {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);

    let charIdx = 0;
    const interval = setInterval(() => {
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, content: fullText.slice(0, charIdx + 1) } : m
        )
      );
      charIdx++;

      if (charIdx >= fullText.length) {
        clearInterval(interval);
        // Set face expression back to normal or happy
        if (crisisCount > 0) {
          setAriaExpression('concerned');
        } else {
          setAriaExpression('happy');
        }
      }
    }, 15); // Quick typewriter speed
  };

  // 8. Send Message handler
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputValue;
    if (!messageText.trim()) return;

    if (!textToSend) {
      setInputValue('');
    }

    resetIdleTimer();

    // 1. Add User message instantly
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAriaTyping(true);
    setAriaExpression('thinking');

    // Compile dynamic system prompt
    const systemPrompt = buildAriaSystemPrompt(profile, tasks, habits, sessions);

    // Keep history max 10 pairs (20 total messages)
    const historyPayload = messages.slice(-20).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Trigger Easter eggs if matches
    const lowerText = messageText.toLowerCase().trim();
    if (lowerText === 'roast me') {
      setTimeout(() => {
        typeOutAriaResponse(getAriaMockResponse('roast me', historyPayload));
      }, 800);
      return;
    }
    if (lowerText === 'motivate me') {
      setAriaExpression('excited');
      setTimeout(() => {
        typeOutAriaResponse(getAriaMockResponse('motivate me', historyPayload));
      }, 800);
      return;
    }
    if (lowerText.includes('stressed') || lowerText.includes('panic') || lowerText.includes('anxious')) {
      setAriaExpression('concerned');
      setTimeout(() => {
        typeOutAriaResponse(getAriaMockResponse('stressed', historyPayload));
      }, 800);
      return;
    }
    if (lowerText.includes('bye') || lowerText.includes('good night') || lowerText.includes('goodnight')) {
      setTimeout(() => {
        typeOutAriaResponse(getAriaMockResponse('bye', historyPayload));
      }, 800);
      return;
    }

    try {
      // Call Gemini API
      let apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        apiKey = localStorage.getItem('deadlineai_user_gemini_key') || '';
      }

      if (!apiKey) {
        // High fidelity fallback response
        setTimeout(() => {
          const fallbackResponse = getAriaMockResponse(messageText, historyPayload);
          typeOutAriaResponse(fallbackResponse);
        }, 1000);
        return;
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      const contents = [
        ...historyPayload.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        })),
        {
          role: 'user',
          parts: [{ text: messageText }]
        }
      ];

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
            topP: 0.9
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Aria.';
      
      setAriaExpression('excited');
      typeOutAriaResponse(text);
    } catch (err) {
      console.warn('Failed to contact Gemini API, using client fallback:', err);
      setTimeout(() => {
        const fallbackResponse = getAriaMockResponse(messageText, historyPayload);
        typeOutAriaResponse(fallbackResponse);
      }, 1000);
    }
  };

  // 9. Aria Offline Mock Response Generator
  const getAriaMockResponse = (prompt: string, history: { role: string; content: string }[]): string => {
    const text = prompt.toLowerCase();
    const firstName = profile?.name ? profile.name.split(' ')[0] : 'Developer';

    if (text === 'roast me') {
      const activeCount = activeTasks.length;
      return `Oh, you want a roast, ${firstName}? Let's look at the telemetry... 👀 You have ${activeCount} active tasks left, 0 completed today, and instead of clicking on any of them, you are sitting here asking a floating purple-gradient AI bubble to make fun of you! How about we start with that urgent task before the countdown reaches zero? Go, go! 😂💥`;
    }

    if (text === 'motivate me') {
      const activeCount = activeTasks.length;
      return `Listen to me, ${firstName}! 🚨 Procrastination is just the arrogant assumption that you will have the same amount of time and energy tomorrow as you do right now. Spoiler alert: You won't! You have ${activeCount} task(s) waiting for your genius. You have beat deadlines before, and you can secure this one too! Turn on Focus Mode, set that Pomodoro timer, and let's lock in! I believe in you! 🔥🚀`;
    }

    if (text === 'stressed' || text.includes('stressed') || text.includes('stress')) {
      return `Hey ${firstName}. Take a slow, deep breath in... 1... 2... 3... 4... Hold it... Now breathe out... 🌬️\n\nDeadlines can feel like a mountain, but we don't climb mountains in one jump. Let's pick just ONE tiny, silly-simple step. What if we work on it for only 5 minutes? No pressure, just 5 minutes of setup. Once you start, the momentum will carry you. Let's do this together.`;
    }

    if (text === 'bye' || text.includes('good night') || text.includes('goodnight')) {
      const completedCount = tasks.filter(t => t.completed && isToday(t.completedAt)).length;
      return `Goodnight, ${firstName}! 🌙 You crushed ${completedCount} task(s) today. Get some quality sleep, let your brain recharge, and we will defeat tomorrow's deadlines together! Sweet dreams! 🌟💤`;
    }

    // Dynamic responses for standard queries
    if (text.includes('urgent') || text.includes('what should i') || text.includes('work on') || text.includes('recommend')) {
      if (crisisTasks.length > 0) {
        return `We have an emergency, ${firstName}! 🚨 Your task **"${crisisTasks[0].title}"** is in **Crisis Mode** with less than 3 hours left! I recommend opening it immediately and using our crisis survival checklist to cut the noise and secure the core release!`;
      }
      if (activeTasks.length > 0) {
        const top = activeTasks.sort((a, b) => b.urgencyScore - a.urgencyScore)[0];
        return `I've analyzed your agenda, ${firstName}. Your absolute top priority is **"${top.title}"** (Urgency: ${top.urgencyScore}/10). It is due on ${new Date(top.deadline).toLocaleDateString()}. Let's kick off a 25-minute Pomodoro session in **Focus Mode** right now!`;
      }
      return `Excellent news, ${firstName}! You have zero active tasks right now! Time to relax, read a book, or add a new goal! 🏖️`;
    }

    if (text.includes('add') && text.includes('task')) {
      return `To add a task, simply click the floating **"+"** button at the top corner of your Tasks or Dashboard page! 📋 You can type the details, use voice input (🎤), and Gemini will automatically analyze the complexity, break it into subtasks, and schedule it for you!`;
    }

    if (text.includes('focus') || text.includes('pomodoro') || text.includes('timer')) {
      return `Our **Focus Mode** is a custom Pomodoro workspace! ⏱️ Just head over to the Focus tab, select which task you want to tackle, and start the 25-minute countdown. It features elegant sound controls, animated particle waves, and motivational alerts!`;
    }

    if (text.includes('crisis')) {
      return `**Crisis Mode** is a high-stakes emergency workspace! 🚨 It triggers automatically when an active task is due in under 3 hours. It drops all unneeded side visual clutter, locks you into a highly focused layout, and gives you an explicit survival checklist to rescue your grades/milestones!`;
    }

    if (text.includes('calendar') || text.includes('sync')) {
      return `We support full **Google Calendar Synchronization**! 📅 Open any task, click the "View Plan" button, head over to the "Schedule" tab, and click "Sync to Google Calendar". We will automatically reserve the exact time blocks on your actual schedule!`;
    }

    return `Hey ${firstName}! That is a great question. As your AI companion, I highly recommend using our **AI Briefing** tab for a custom daily tactical roadmap, or jumping into **Focus Mode** to start checking off those subtasks. Let me know what specific task you want to conquer next! 🚀`;
  };

  return (
    <div id="aria-chatbot-root">
      {/* 1. Floating Circle Button */}
      <motion.button
        id="aria-floating-button"
        onClick={handleOpenChat}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed z-[9999] bottom-7 right-7 md:bottom-7 md:right-7 w-16 h-16 rounded-full flex items-center justify-center cursor-pointer select-none border border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400"
        style={{
          background: isOpen 
            ? 'linear-gradient(135deg, #FC8181, #E53E3E)' // Red-ish close state
            : 'linear-gradient(135deg, #63B3ED, #9F7AEA)', // Blue-purple idle state
          boxShadow: isOpen
            ? '0 8px 32px rgba(229, 62, 62, 0.4), 0 0 0 1px rgba(255,255,255,0.2) inset'
            : '0 8px 32px rgba(99, 179, 237, 0.4), 0 0 0 1px rgba(255,255,255,0.2) inset, 0 1px 0 rgba(255,255,255,0.3) inset',
        }}
      >
        {/* Coded Robotic Waving Hand above button */}
        {!isOpen && (
          <AnimatePresence>
            <RoboticHand isWaving={isWaving} />
          </AnimatePresence>
        )}

        {/* Attention Pulse Ring when idle for 60s */}
        {!isOpen && isIdle60s && (
          <>
            <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" style={{ animationDuration: '2s' }} />
            <span className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </>
        )}

        {/* Floating Button Tooltip on Hover */}
        <div className="absolute right-0 bottom-20 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
          <div className="bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg whitespace-nowrap">
            Chat with Aria 💬
          </div>
        </div>

        {/* Inner Content: Aria Face (or Spinning 'X' Close Icon) */}
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 180, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <X size={26} className="text-white stroke-[2.5]" />
            </motion.div>
          ) : (
            <motion.div
              key="face"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <AriaFace size={44} expression={ariaExpression} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Badge for Crisis Tasks */}
        {!isOpen && crisisCount > 0 && (
          <motion.div
            id="aria-notification-badge"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="absolute -top-1 -left-1.5 bg-red-500 border border-white/20 text-white font-bold text-[10px] h-6 px-2 rounded-full flex items-center justify-center shadow-md animate-pulse"
          >
            🚨 {crisisCount}
          </motion.div>
        )}
      </motion.button>

      {/* 2. Floating Chat Window */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            id="aria-chat-window"
            initial={{ opacity: 0, scale: 0.3, y: 100, x: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: 100, x: 50 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed z-[9998] bottom-[104px] right-7 w-[380px] h-[540px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-140px)] rounded-3xl bg-[#080D1A]/95 border border-white/10 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden md:w-[380px] md:h-[540px]
            max-md:fixed max-md:inset-0 max-md:max-w-none max-md:max-h-none max-md:rounded-none max-md:z-[10000]"
          >
            {/* Mobile Swipe handle bar */}
            <div className="hidden max-md:flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-white/20 rounded-full" onClick={() => setIsOpen(false)} />
            </div>

            {/* HEADER */}
            <div
              id="aria-chat-header"
              className="relative p-4 flex items-center justify-between border-b border-white/8 bg-white/5 backdrop-blur-md"
            >
              <div className="flex items-center space-x-3 select-none">
                {/* Mini Avatar inside Header */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center p-0.5 border border-white/10 shadow">
                    <AriaFace size={32} expression={ariaExpression} />
                  </div>
                  {/* Online dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border border-[#080D1A] animate-pulse" />
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-wide">Aria</span>
                  <span className="text-[10px] text-gray-400 flex items-center">
                    <Sparkles size={10} className="text-yellow-400 mr-1 animate-pulse" />
                    DeadlineAI Companion
                  </span>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
                  title="Minimize"
                >
                  <Minimize2 size={15} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* MESSAGES AREA (Scrollable) */}
            <div
              id="aria-chat-messages"
              className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#060A14]/30"
            >
              {messages.length === 0 && isAriaTyping && (
                <div className="flex justify-center items-center h-full text-gray-500 text-xs font-mono">
                  Loading Aria's tactical briefing...
                </div>
              )}

              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {isAriaTyping && <ChatMessage isTyping={true} />}

              {/* Anchor for scroll to bottom */}
              <div ref={messageEndRef} />
            </div>

            {/* QUICK REPLY SUGGESTIONS (Chips) */}
            <div className="py-2 border-t border-white/5 bg-slate-950/20">
              <QuickReplies
                onSelectChip={(text) => handleSendMessage(text)}
                conversationHistory={messages}
                tasks={tasks}
              />
            </div>

            {/* INPUT FOOTER ROW */}
            <div
              id="aria-chat-input-row"
              className="p-4 border-t border-white/8 bg-white/4 flex items-center space-x-2 pb-5 max-md:pb-7"
            >
              <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-2xl px-3.5 py-1 focus-within:border-purple-400/50 transition-colors shadow-inner">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Ask Aria anything..."
                  className="w-full bg-transparent text-sm py-2 text-white outline-none placeholder-gray-500"
                />

                {/* Voice speech to text button */}
                <motion.button
                  onClick={toggleVoiceInput}
                  animate={isListening ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ repeat: isListening ? Infinity : 0, duration: 1 }}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    isListening ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' : 'text-gray-400 hover:text-white'
                  }`}
                  title={isListening ? 'Listening...' : 'Voice input'}
                >
                  <Mic size={16} />
                </motion.button>
              </div>

              {/* Send message button */}
              <motion.button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() && !isAriaTyping}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer shadow-lg ${
                  inputValue.trim()
                    ? 'bg-gradient-to-br from-blue-400 to-purple-500 text-white hover:brightness-110 active:brightness-90'
                    : 'bg-white/5 text-gray-500 border border-white/10 opacity-40 cursor-not-allowed'
                }`}
              >
                <Send size={16} className="ml-0.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Minimized Pill Tab (if user minimized the open window) */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            id="aria-chat-minimized-pill"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            onClick={() => setIsMinimized(false)}
            className="fixed z-[9997] bottom-28 right-7 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-600 text-white font-semibold text-xs px-4 py-2.5 rounded-full backdrop-blur-md border border-white/20 shadow-lg cursor-pointer select-none flex items-center space-x-2 animate-bounce"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Aria is waiting... 💬</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
