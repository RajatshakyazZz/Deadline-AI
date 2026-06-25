import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, ArrowLeft } from 'lucide-react';

import { ToastProvider } from './components/Toast';
import { AppProvider, useApp } from './components/AppContext';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { LogoIcon, LogoAnimated } from './components/Logo';
import { AriaChat } from './components/chatbot/AriaChat';

// Pages import
import { Dashboard } from './pages/Dashboard';
import { MyTasks } from './pages/MyTasks';
import { FocusMode } from './pages/FocusMode';
import { AIBriefing } from './pages/AIBriefing';
import { Habits } from './pages/Habits';

// Loading Intro Screen Component
const AppLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#080B14] flex flex-col items-center justify-center z-50 select-none">
      <div className="relative mb-6">
        <LogoAnimated size={64} layout="icon-only" />
        {/* Pulsing glow while app loads */}
        <div className="absolute inset-0 bg-[#9F7AEA]/10 filter blur-xl rounded-full animate-pulse -z-10" />
      </div>

      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold tracking-tight text-[#F7FAFC] font-sans"
      >
        Deadline<span className="bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] bg-clip-text text-transparent">AI</span>
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs font-mono tracking-widest text-[#4A5568] uppercase mt-2 font-bold"
      >
        Initializing Tactical Core...
      </motion.p>
    </div>
  );
};

// Custom animated 404 Page
const PageNotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080B14] text-[#F7FAFC] flex flex-col items-center justify-center p-6 text-center select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="max-w-md w-full space-y-6 flex flex-col items-center"
      >
        <motion.div 
          className="relative p-6 rounded-full bg-red-950/20 text-[#FC8181] mb-2 cursor-pointer"
          style={{ rotate: -15 }}
          whileHover={{ rotate: 0, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <LogoIcon size={48} />
          <span className="absolute inset-0 rounded-full bg-[#FC8181]/5 animate-ping -z-10" />
        </motion.div>

        <h2 className="text-4xl font-extrabold font-mono text-[#FC8181]">404</h2>
        <h3 className="text-xl font-bold">Timeline Breach Detected</h3>
        <p className="text-sm text-[#A0AEC0] leading-relaxed max-w-xs">
          The coordinate grid path you are searching for does not exist in the DeadlineAI workspace core.
        </p>

        <Link 
          to="/dashboard"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] text-[#080B14] font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-[0_4px_25px_rgba(159,122,234,0.3)] transition-all active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Exit Coordinate Grid</span>
        </Link>
      </motion.div>
    </div>
  );
};

// Main Routing and Auth Filter Controller
const MainAppRoutes: React.FC = () => {
  const { user, loading } = useApp();

  if (loading) {
    return <AppLoader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated Home / Landing Page */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
        />

        {/* Authenticated Dashboard Sub-routes */}
        <Route 
          path="/dashboard" 
          element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/tasks" 
          element={user ? <Layout><MyTasks /></Layout> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/focus" 
          element={user ? <Layout><FocusMode /></Layout> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/briefing" 
          element={user ? <Layout><AIBriefing /></Layout> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/habits" 
          element={user ? <Layout><Habits /></Layout> : <Navigate to="/" replace />} 
        />

        {/* Fallback 404 Route */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      {user && <AriaChat />}
    </BrowserRouter>
  );
};

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  // High-fidelity intro loader timeout on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 1500); // 1.5 seconds splash intro
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastProvider>
      <AppProvider>
        <AnimatePresence mode="wait">
          {showIntro ? (
            <AppLoader key="intro-splash" />
          ) : (
            <motion.div
              key="main-app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="min-h-screen bg-[#050810] relative"
            >
              {/* Living Gradient Mesh Background */}
              <div className="bg-mesh-container">
                <div className="bg-orb bg-orb-blue" />
                <div className="bg-orb bg-orb-purple" />
                <div className="bg-orb bg-orb-teal" />
              </div>

              {/* Physical Noise Texture Overlay */}
              <div className="noise-overlay" />

              <div className="relative z-10">
                <MainAppRoutes />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AppProvider>
    </ToastProvider>
  );
}
