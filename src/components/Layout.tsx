import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  CheckSquare, 
  Timer, 
  Sparkles, 
  Flame, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  Plus, 
  Keyboard 
} from 'lucide-react';
import { useApp } from './AppContext';
import { AddTaskModal } from './AddTaskModal';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout, isDemo } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Active navigation mapping
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'My Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Focus Mode', path: '/focus', icon: Timer },
    { name: 'AI Briefing', path: '/briefing', icon: Sparkles },
    { name: 'Habits', path: '/habits', icon: Flame },
  ];

  // Map path to friendly breadcrumb name
  const getBreadcrumb = () => {
    const item = menuItems.find(m => m.path === location.pathname);
    return item ? item.name : 'DeadlineAI';
  };

  // Keyboard Shortcuts implementation (N = new task modal, F = focus mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is writing in any input field
      const activeEl = document.activeElement;
      if (
        activeEl && 
        (activeEl.tagName === 'INPUT' || 
         activeEl.tagName === 'TEXTAREA' || 
         activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsAddTaskOpen(true);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        navigate('/focus');
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F7FAFC] flex relative">
      
      {/* Sidebar - Desktop & Tablet */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0E1320] border-r border-white/5 p-6 flex-shrink-0 relative z-30 justify-between">
        <div className="flex flex-col gap-8">
          
          {/* Brand Logo with Glow */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA] shadow-[0_0_20px_rgba(159,122,234,0.25)] group-hover:shadow-[0_0_30px_rgba(159,122,234,0.4)] transition-all duration-300">
              <Sparkles className="w-5 h-5 text-[#080B14]" />
            </div>
            <span className="text-xl font-bold font-sans tracking-tight text-[#F7FAFC]">
              Deadline<span className="bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] bg-clip-text text-transparent">AI</span>
            </span>
          </Link>

          {/* User Profile Info */}
          {profile && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#131929] border border-white/5">
              <img 
                referrerPolicy="no-referrer"
                src={profile.photoURL} 
                alt={profile.name} 
                className="w-10 h-10 rounded-full border border-[#63B3ED]/20 flex-shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-mono text-[#63B3ED] uppercase tracking-wider font-semibold">
                  {isDemo ? 'Guest User' : 'Authenticated'}
                </p>
                <p className="text-sm font-bold text-[#F7FAFC] truncate max-w-[130px]" title={profile.name}>
                  {profile.name}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-2 relative">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                      isActive ? 'text-[#F7FAFC]' : 'text-[#A0AEC0] hover:text-[#F7FAFC] hover:bg-white/[0.02]'
                    }`
                  }
                >
                  {/* Sliding active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-0 bg-gradient-to-r from-[#63B3ED]/10 to-[#9F7AEA]/10 border-l-2 border-[#63B3ED] rounded-xl z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <span className="relative z-10 flex items-center gap-3">
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#63B3ED]' : 'text-[#A0AEC0] group-hover:text-[#63B3ED]'}`} />
                    <span className="font-sans font-semibold tracking-wide">{item.name}</span>
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Shortcuts & Logout */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setShowShortcutsHelp(true)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A0AEC0] hover:text-[#63B3ED] hover:bg-white/[0.02] transition-all cursor-pointer"
          >
            <Keyboard className="w-4 h-4" />
            <span className="font-sans">Keyboard Shortcuts</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#FC8181] hover:text-[#FC8181] hover:bg-[#FC8181]/5 border border-transparent hover:border-[#FC8181]/15 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-sans font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation Backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-[#0E1320] border-r border-white/5 p-6 z-50 flex flex-col justify-between md:hidden"
          >
            <div className="flex flex-col gap-8">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between">
                <Link to="/dashboard" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA]">
                    <Sparkles className="w-5 h-5 text-[#080B14]" />
                  </div>
                  <span className="text-lg font-bold font-sans">Deadline<span className="text-[#63B3ED]">AI</span></span>
                </Link>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile inside drawer */}
              {profile && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#131929] border border-white/5">
                  <img 
                    referrerPolicy="no-referrer"
                    src={profile.photoURL} 
                    alt={profile.name} 
                    className="w-10 h-10 rounded-full border border-[#63B3ED]/20"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-mono text-[#63B3ED] uppercase tracking-wider font-semibold">
                      {isDemo ? 'Guest User' : 'Authenticated'}
                    </p>
                    <p className="text-sm font-bold text-[#F7FAFC] truncate">
                      {profile.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Menu inside drawer */}
              <nav className="flex flex-col gap-2">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive ? 'bg-[#63B3ED]/10 border-l-2 border-[#63B3ED] text-[#F7FAFC]' : 'text-[#A0AEC0] hover:bg-white/[0.02]'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-[#63B3ED]' : 'text-[#A0AEC0]'}`} />
                      <span className="font-sans font-semibold tracking-wide">{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  setShowShortcutsHelp(true);
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A0AEC0]"
              >
                <Keyboard className="w-4 h-4" />
                <span>Keyboard Shortcuts</span>
              </button>

              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#FC8181] hover:bg-[#FC8181]/5 border border-transparent hover:border-[#FC8181]/15 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-sans">Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Breadcrumb Header */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-[#080B14]/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Menu Hamburger on Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#131929] border border-white/5 text-[#A0AEC0] hover:text-[#F7FAFC] transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb links */}
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold tracking-wide select-none">
              <span className="text-[#A0AEC0]">DeadlineAI</span>
              <ChevronRight className="w-4 h-4 text-[#4A5568]" />
              <span className="text-[#63B3ED]">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stats banner or just clean space */}
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase bg-[#131929] text-[#63B3ED] border border-white/5 tracking-wider">
              HACKATHON BUILD v1.0
            </span>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full pb-24 relative">
          {children}
        </main>
      </div>

      {/* Floating Action Button (FAB) for Quick Add Task */}
      <motion.button
        onClick={() => setIsAddTaskOpen(true)}
        whileHover={{ scale: 1.08, boxShadow: '0 0 20px rgba(99,179,237,0.4)' }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 p-4 rounded-full bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA] text-[#080B14] shadow-2xl flex items-center justify-center cursor-pointer"
        title="Add New Task (Shortcut: N)"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </motion.button>

      {/* Add Task Modal overlay */}
      <AnimatePresence>
        {isAddTaskOpen && (
          <AddTaskModal onClose={() => setIsAddTaskOpen(false)} />
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help Overlay */}
      <AnimatePresence>
        {showShortcutsHelp && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#131929] border border-white/5 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowShortcutsHelp(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-[#A0AEC0] hover:text-[#F7FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-[#63B3ED]">
                <Keyboard className="w-5 h-5" /> Keyboard Shortcuts
              </h3>

              <div className="space-y-3 font-sans">
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-sm font-semibold text-[#A0AEC0]">New Task Modal</span>
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-[#0E1320] border border-white/10 rounded-lg text-[#F6AD55]">N</kbd>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-sm font-semibold text-[#A0AEC0]">Switch to Focus Mode</span>
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-[#0E1320] border border-white/10 rounded-lg text-[#F6AD55]">F</kbd>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm font-semibold text-[#A0AEC0]">Show this help</span>
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-[#0E1320] border border-white/10 rounded-lg text-[#F6AD55]">?</kbd>
                </div>
              </div>

              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="w-full mt-6 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-sm font-bold transition-all text-[#F7FAFC]"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
