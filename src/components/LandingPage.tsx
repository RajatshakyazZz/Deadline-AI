import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Sparkles, AlertTriangle, Calendar, Flame } from 'lucide-react';
import { useApp } from './AppContext';
import { LogoAnimated } from './Logo';

export const LandingPage: React.FC = () => {
  const { login, loginAsGuest } = useApp();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 select-none overflow-hidden bg-transparent">
      
      {/* Decorative floating glass cards in background (blurred, showing mock preview) */}
      <div className="absolute top-1/4 -left-12 w-64 h-40 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md opacity-20 rotate-12 pointer-events-none hidden lg:block shadow-[0_20px_50px_rgba(0,0,0,0.3)]" />
      <div className="absolute bottom-1/4 -right-16 w-72 h-44 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md opacity-25 -rotate-6 pointer-events-none hidden lg:block shadow-[0_20px_50px_rgba(0,0,0,0.3)]" />

      {/* Large Centered Main Liquid Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="liquid-glass max-w-2xl w-full p-8 md:p-12 text-center flex flex-col items-center relative z-10"
      >
        {/* Animated logo */}
        <LogoAnimated size={80} layout="icon-only" className="mb-6" />

        {/* DeadlineAI Large Bold Title */}
        <h1 className="text-4xl md:text-5xl font-sans font-extrabold tracking-tight text-white mb-4 select-none" style={{ letterSpacing: '-0.03em' }}>
          Deadline
          <span className="bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA] bg-clip-text text-transparent font-extrabold ml-px">
            AI
          </span>
        </h1>

        {/* Tagline: display text */}
        <p className="text-[#A0AEC0] text-base md:text-lg font-medium tracking-wide max-w-md mb-8">
          Stop missing deadlines. Start beating them.
        </p>

        {/* Staggered Feature Chips (Glass Pills) */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { label: "🤖 AI Task Breakdown", delay: 0.2 },
            { label: "🚨 Crisis Mode", delay: 0.3 },
            { label: "📅 Smart Scheduling", delay: 0.4 }
          ].map((chip, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: chip.delay, type: 'spring', stiffness: 200 }}
              className="px-4 py-2 rounded-full text-xs font-semibold text-white/90 border border-white/10 backdrop-blur-md bg-white/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center gap-1.5"
              whileHover={{ 
                scale: 1.05, 
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.2)' 
              }}
            >
              {chip.label}
            </motion.div>
          ))}
        </div>

        {/* Google Authentication in Apple Style (White) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button
            onClick={login}
            className="group w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#0F1423] font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)] cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="font-sans font-extrabold text-sm tracking-wide">Continue with Google</span>
          </button>

          {/* Quick Guest Demo Button */}
          <button
            onClick={loginAsGuest}
            className="group w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-bold bg-gradient-to-r from-violet-600/30 via-fuchsia-600/20 to-indigo-600/30 border border-violet-500/40 hover:border-violet-400 hover:from-violet-600/40 hover:to-indigo-600/40 shadow-[0_4px_24px_rgba(124,58,237,0.2)] hover:shadow-[0_8px_32px_rgba(124,58,237,0.45)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-violet-300 group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-sans font-bold text-sm tracking-wide">Quick Guest Demo</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
