import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, X, Minimize2, Sparkles } from 'lucide-react';
import { useApp } from '../AppContext';
import { AriaFace, AriaExpression } from './AriaFace';
import { ChatMessage, Message } from './ChatMessage';
import { QuickReplies } from './QuickReplies';
import { buildAriaSystemPrompt, getMinutesUntil, isToday } from '../../utils/ariaPrompt';
import { createSecureRequest, validateRequest } from '../../utils/secureRequest';
import { RATE_LIMITS, isRapidFireGeminiCall } from '../../utils/rateLimiter';
import { sanitizeForPrompt } from '../../utils/promptSecurity';
import { truncateForGemini } from '../../utils/payloadLimits';
import { safeStorage } from '../../utils/storage';

// Interface for Gemini response format
interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

export const AriaChat: React.FC = () => {
  const { profile, tasks, habits, sessions, showToast, setIsAddTaskOpen } = useApp();
  
  // Chat window visibility states
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Conversation and status states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAriaTyping, setIsAriaTyping] = useState(false);
  const [isAriaSpeaking, setIsAriaSpeaking] = useState(false);
  const [ariaExpression, setAriaExpression] = useState<AriaExpression>('happy');
  
  // Hover and Idle tracking (replaced waving hand with premium beacon)
  const [isHovered, setIsHovered] = useState(false);
  const [isIdle60s, setIsIdle60s] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subtle notification beacon
  const [showBeacon, setShowBeacon] = useState(false);
  const beaconTimerRef = useRef<NodeJS.Timeout | null>(null);
  const beaconIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Beacon management: triggers after 30s of idle, lasts 3 pulses (6s), reappears every 2 mins
  const resetBeaconTimer = () => {
    setShowBeacon(false);
    if (beaconTimerRef.current) clearTimeout(beaconTimerRef.current);
    if (beaconIntervalRef.current) clearInterval(beaconIntervalRef.current);

    if (isOpen) return;

    const triggerBeacon = () => {
      setShowBeacon(true);
      beaconTimerRef.current = setTimeout(() => {
        setShowBeacon(false);
      }, 6000);
    };

    // First appearance after 30 seconds
    beaconTimerRef.current = setTimeout(() => {
      triggerBeacon();
      // Reappears every 2 minutes
      beaconIntervalRef.current = setInterval(() => {
        triggerBeacon();
      }, 120000);
    }, 30000);
  };

  // Monitor Idle State: 60s of inactivity triggers attention pulse rings
  const resetIdleTimer = () => {
    setIsIdle60s(false);
    resetBeaconTimer();
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
      if (beaconTimerRef.current) clearTimeout(beaconTimerRef.current);
      if (beaconIntervalRef.current) clearInterval(beaconIntervalRef.current);
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
    setIsAriaSpeaking(true);
    
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
        setIsAriaSpeaking(false);
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

    // Prevent rapid-fire or double-submissions
    if (isAriaTyping) return;
    if (isRapidFireGeminiCall(1500)) {
      console.warn('Rapid-fire message submission blocked');
      return;
    }

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
    if (
      lowerText.includes('add task') || 
      lowerText.includes('add a task') || 
      lowerText.includes('how to add') || 
      lowerText.includes('how do i add') || 
      lowerText.includes('how does adding a task') ||
      lowerText === '📋 add task now' || 
      lowerText === '➕ add task now'
    ) {
      setIsAddTaskOpen(true);
      setAriaExpression('excited');
      setTimeout(() => {
        typeOutAriaResponse("I have automatically opened the **Create AI-Prioritized Task** window for you! 📋 Fill in your task details, and I will instantly analyze its complexity, subtasks, and deadlines for you. 🚀");
      }, 500);
      return;
    }

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
      // 1. Rate Limiting Check
      const { allowed, retryAfter } = RATE_LIMITS.chatMessage();
      if (!allowed) {
        console.warn(`Rate limit triggered for AriaChat. Cooldown: ${retryAfter}s`);
        setTimeout(() => {
          typeOutAriaResponse(`I am receiving too many requests right now. Please take a deep breath and retry in ${retryAfter} seconds! 🤖⚡`);
        }, 800);
        return;
      }

      // 2. Prompt Injection / SSTI Filtering
      const sanitizedMessage = sanitizeForPrompt(messageText);

      // 3. LPDoS Truncation limit
      const finalMessage = truncateForGemini(sanitizedMessage, 500);

      // 4. Replay Attack Protection
      const secureReq = createSecureRequest({ messageText: finalMessage });
      if (!validateRequest(secureReq._meta)) {
        console.warn('Replay attack or invalid signature blocked in AriaChat');
        setTimeout(() => {
          typeOutAriaResponse(getAriaMockResponse(messageText, historyPayload));
        }, 800);
        return;
      }

      // Call Gemini API
      let apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        apiKey = safeStorage.getItem('deadlineai_user_gemini_key') || '';
      }

      if (!apiKey) {
        // High fidelity fallback response
        setTimeout(() => {
          const fallbackResponse = getAriaMockResponse(secureReq.payload.messageText, historyPayload);
          typeOutAriaResponse(fallbackResponse);
        }, 1000);
        return;
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const contents = [
        ...historyPayload.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        })),
        {
          role: 'user',
          parts: [{ text: secureReq.payload.messageText }]
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
      {/* 1. Floating Circle Button (Abstract Core Orb) */}
      <motion.button
        id="aria-floating-button"
        onClick={handleOpenChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed z-[9999] bottom-7 right-7 w-16 h-16 rounded-full flex items-center justify-center cursor-pointer select-none focus:outline-none bg-transparent"
        style={{
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
        }}
      >
        {/* Subtle platform/shadow below orb */}
        <div
          className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 rounded-full bg-blue-400/20 blur-[6px] orb-shadow-pulse pointer-events-none"
          style={{ height: '6px' }}
        />

        {/* Attention Pulse Ring when idle for 60s */}
        {!isOpen && isIdle60s && (
          <>
            <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" style={{ animationDuration: '2s' }} />
            <span className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </>
        )}

        {/* Subtle notification beacon TOP of orb */}
        {!isOpen && showBeacon && (
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#63B3ED] shadow-[0_0_8px_rgba(99,179,237,0.8)] pointer-events-none z-30"
            style={{ animation: 'beaconPulse 2s ease-in-out infinite' }}
          />
        )}

        {/* Premium Abstract AI core orb */}
        <AriaFace
          size={64}
          isOpen={isOpen}
          isHovered={isHovered}
          isThinking={isAriaTyping}
          isSpeaking={isAriaSpeaking}
          expression={ariaExpression}
        />

        {/* Notification Badge for Crisis Tasks */}
        {!isOpen && crisisCount > 0 && (
          <motion.div
            id="aria-notification-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className={`absolute -top-1.5 -right-1.5 bg-gradient-to-br from-[#FC8181] to-[#F56565] border-[1.5px] border-[#080B14]/80 shadow-[0_0_10px_rgba(252,129,129,0.5)] text-white font-mono font-bold text-[10px] h-5 flex items-center justify-center z-20 ${
              crisisCount >= 10 
                ? 'px-1.5 min-w-[20px] rounded-full' 
                : 'w-5 rounded-full'
            }`}
          >
            {crisisCount}
          </motion.div>
        )}

        {/* Floating Button Premium Tooltip on Hover */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-[76px] bottom-4 bg-[#060A16]/95 border border-[#63B3ED]/30 rounded-[10px] py-2 px-3.5 shadow-lg shadow-black/40 text-[#E2E8F0] font-sans text-[13px] whitespace-nowrap pointer-events-none flex items-center gap-2 z-50"
            >
              <span className="text-[#63B3ED] font-medium">✦ Ask Aria</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span className="text-gray-400 font-normal">AI Assistant</span>
            </motion.div>
          )}
        </AnimatePresence>
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
                {/* Mini Avatar inside Header (Small 28px version of new orb design) */}
                <div className="relative flex items-center justify-center">
                  <AriaFace 
                    size={28} 
                    isOpen={false} 
                    isThinking={isAriaTyping} 
                    isSpeaking={isAriaSpeaking} 
                    expression={ariaExpression}
                  />
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-[#080D1A] animate-pulse" />
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-wide">Aria</span>
                  <span className="text-[10px] text-[#4A5568] font-mono flex items-center">
                    AI · Gemini 2.0 Flash
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

            {/* VOICE LISTENING HUD OVERLAY */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 30, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="absolute bottom-[84px] left-3 right-3 p-4 bg-[#080D1A]/95 border border-[#63B3ED]/30 rounded-2xl backdrop-blur-3xl shadow-[0_8px_32px_rgba(99,179,237,0.15)] z-[100]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                      <span className="text-xs font-bold text-[#F7FAFC] uppercase tracking-wider font-mono">Aria is Listening...</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (recognitionRef.current) recognitionRef.current.stop();
                      }}
                      className="text-gray-400 hover:text-white text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all active:scale-95"
                    >
                      STOP
                    </button>
                  </div>
                  
                  {/* Holographic Glowing Soundwave Visualizer */}
                  <div className="flex items-center justify-center space-x-1.5 py-3 h-14 bg-black/20 rounded-xl border border-white/5 shadow-inner">
                    {[...Array(9)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-[#63B3ED] to-[#9F7AEA]"
                        style={{
                          boxShadow: '0 0 10px rgba(99, 179, 237, 0.4)'
                        }}
                        animate={{
                          height: [10, 42, 14, 30, 10][i % 5]
                        }}
                        transition={{
                          duration: 0.5 + (i * 0.08),
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>

                  <div className="mt-3 text-center">
                    <p className="text-[9px] text-[#A0AEC0] font-mono uppercase tracking-widest mb-1.5">Try speaking requests like:</p>
                    <div className="flex flex-col gap-1 text-[10px] text-gray-300">
                      <span className="bg-white/[0.02] py-1 px-2 rounded border border-white/5 truncate">"Add task: Design Figma wireframes"</span>
                      <span className="bg-white/[0.02] py-1 px-2 rounded border border-white/5 truncate">"Stressed and panicking about deadlines"</span>
                      <span className="bg-white/[0.02] py-1 px-2 rounded border border-white/5 truncate">"Recommend what urgent task I should work on"</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  animate={isListening ? { scale: [1, 1.15, 1], boxShadow: "0 0 12px rgba(239, 68, 68, 0.6)" } : { scale: 1 }}
                  transition={isListening ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" } : { duration: 0.2 }}
                  className={`p-2 rounded-xl cursor-pointer flex items-center justify-center transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' 
                      : 'bg-white/5 text-[#A0AEC0] hover:text-[#63B3ED] hover:bg-white/10 hover:shadow-[0_0_8px_rgba(99,179,237,0.3)]'
                  }`}
                  title={isListening ? 'Aria is listening... click to stop' : 'Speak to Aria'}
                >
                  <Mic size={16} className={isListening ? 'animate-pulse' : ''} />
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
