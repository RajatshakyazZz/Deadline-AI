import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Timer, Flame, CheckCircle2 } from 'lucide-react';
import { useApp } from './AppContext';
import { ParticleBackground } from './ParticleBackground';

export const LandingPage: React.FC = () => {
  const { login, loginAsGuest } = useApp();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Sparkles,
      title: "AI Prioritizer",
      description: "Triage your tasks instantly using Gemini 2.0. Generate smart schedules, custom risk-factor audits, and action subtasks automatically.",
      tag: "Gemini 2.0 Flash",
      color: "from-[#63B3ED] to-[#9F7AEA]"
    },
    {
      icon: Timer,
      title: "Ticking Pomodoro",
      description: "A minimal distraction-free focus workspace with fluid countdown indicators, calming ambient options, and instant feedback loops.",
      tag: "Aesthetic Rhythm",
      color: "from-[#FC8181] to-[#F6AD55]"
    },
    {
      icon: Flame,
      title: "Streak & Crisis Mode",
      description: "When tasks are under 3 hours, real-time alerts light up in red. Hit Crisis Help for custom-synthesized emergency workflows.",
      tag: "Fail-Safe Defense",
      color: "from-[#F6AD55] to-[#68D391]"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="relative min-h-screen bg-[#080B14] flex flex-col items-center justify-center overflow-hidden px-4 py-12 select-none">
      {/* Background canvas */}
      <ParticleBackground />

      <div className="relative z-10 max-w-4xl w-full flex flex-col items-center text-center">
        
        {/* Animated Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="mb-4 flex items-center gap-2"
        >
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA] shadow-[0_0_40px_rgba(159,122,234,0.35)]">
            <Sparkles className="w-8 h-8 text-[#080B14]" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, type: 'spring' }}
          className="text-5xl md:text-7xl font-sans font-bold tracking-tight text-[#F7FAFC]"
        >
          Deadline
          <span className="bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] bg-clip-text text-transparent filter drop-shadow-[0_0_15px_rgba(99,179,237,0.3)]">
            AI
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-[#A0AEC0] text-lg md:text-xl font-medium mt-4 font-sans tracking-wide max-w-md"
        >
          Stop missing deadlines. Start beating them.
        </motion.p>

        {/* Feature Cycling Carousel */}
        <div className="w-full max-w-lg mt-12 h-64 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="p-6 rounded-2xl bg-[#131929] border border-white/5 flex flex-col items-center shadow-xl relative overflow-hidden"
            >
              {/* Corner accent glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${features[activeFeature].color} opacity-10 blur-xl`}></div>
              
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest text-[#63B3ED] bg-[#63B3ED]/10 border border-[#63B3ED]/20">
                  {features[activeFeature].tag}
                </span>
              </div>

              {React.createElement(features[activeFeature].icon, {
                className: "w-8 h-8 text-[#9F7AEA] mb-3"
              })}

              <h3 className="text-xl font-bold text-[#F7FAFC] font-sans">
                {features[activeFeature].title}
              </h3>
              
              <p className="text-sm text-[#A0AEC0] mt-2 leading-relaxed max-w-md">
                {features[activeFeature].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {features.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveFeature(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  activeFeature === i ? 'bg-[#63B3ED] w-6' : 'bg-[#4A5568]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Auth Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, type: 'spring' }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          {/* Big google login */}
          <button
            onClick={login}
            className="group w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] hover:from-[#5aa2d6] hover:to-[#906cd9] text-[#080B14] font-bold flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98] shadow-[0_4px_25px_rgba(159,122,234,0.3)] hover:shadow-[0_4px_35px_rgba(159,122,234,0.5)] cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-6.887 4.113-4.907 0-8.905-4.013-8.905-8.9s3.998-8.9 8.905-8.9c2.313 0 4.39.84 6.015 2.451l3.111-3.11C18.215 1.012 15.345 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c6.887 0 12.24-5.48 12.24-12.24 0-.825-.098-1.613-.262-2.385H12.24z"/>
            </svg>
            <span className="font-sans font-bold text-base">Sign in with Google</span>
          </button>

          {/* Quick Guest login */}
          <button
            onClick={loginAsGuest}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#131929] hover:bg-[#1A2235] text-[#A0AEC0] hover:text-[#F7FAFC] font-bold border border-white/5 hover:border-white/10 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="font-sans font-bold text-base">Quick Guest Demo</span>
          </button>
        </motion.div>

        {/* Footer info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-xs text-[#4A5568] mt-16 font-mono tracking-widest uppercase"
        >
          Vibe2Ship x Google for Developers Hackathon Entry
        </motion.p>
      </div>
    </div>
  );
};
