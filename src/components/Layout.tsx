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
  Keyboard,
  Settings
} from 'lucide-react';
import { useApp } from './AppContext';
import { AddTaskModal } from './AddTaskModal';
import { SettingsModal } from './SettingsModal';
import { LogoIcon, LogoFull } from './Logo';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout, isDemo } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    <div className="min-h-screen bg-transparent text-[#F7FAFC] flex relative w-full">
      
      {/* Sidebar - Desktop & Tablet */}
      <aside 
        className={`hidden md:flex flex-col transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex-shrink-0 relative z-30 justify-between ${
          isSidebarCollapsed ? 'w-20 p-4' : 'w-64 p-6'
        }`}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(60px) saturate(200%)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="flex flex-col gap-8">
          
          {/* Brand Logo with Glow */}
          <Link to="/dashboard" className="flex items-center justify-center gap-3 group">
            {isSidebarCollapsed ? (
              <LogoIcon size={32} />
            ) : (
              <LogoFull size={32} />
            )}
          </Link>

          {/* User Profile Info */}
          {profile && (
            <div className={`flex items-center justify-between rounded-2xl bg-white/[0.03] border border-white/5 transition-all duration-300 ${
              isSidebarCollapsed ? 'p-1.5 justify-center cursor-pointer hover:bg-white/[0.06] hover:border-[#63B3ED]/30' : 'p-3'
            }`}
              onClick={isSidebarCollapsed ? () => setIsSettingsOpen(true) : undefined}
              title={isSidebarCollapsed ? "Open Settings" : undefined}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative p-0.5 rounded-full bg-gradient-to-br from-[#63B3ED] to-[#9F7AEA] flex-shrink-0">
                  <img 
                    referrerPolicy="no-referrer"
                    src={profile.photoURL} 
                    alt={profile.name} 
                    className="w-10 h-10 rounded-full border border-black/50"
                  />
                </div>
                {!isSidebarCollapsed && (
                  <div className="overflow-hidden">
                    <p className="text-xs font-mono text-[#63B3ED] uppercase tracking-wider font-semibold">
                      {isDemo ? 'Guest' : 'Authenticated'}
                    </p>
                    <p className="text-sm font-bold text-[#F7FAFC] truncate max-w-[100px]" title={profile.name}>
                      {profile.name}
                    </p>
                  </div>
                )}
              </div>

              {!isSidebarCollapsed && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-[#63B3ED] transition-all cursor-pointer"
                  title="Open Settings"
                  id="settings-gear-sidebar"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
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
                    `relative flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                      isActive ? 'text-[#F7FAFC]' : 'text-[#A0AEC0] hover:text-[#F7FAFC] hover:bg-white/[0.04]'
                    }`
                  }
                >
                  {/* Sliding active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-0 bg-white/[0.08] border-l-2 border-[#63B3ED] rounded-xl z-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.15)] backdrop-blur-md"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <span className="relative z-10 flex items-center gap-3">
                    <item.icon className={`w-5 h-5 transition-colors flex-shrink-0 ${isActive ? 'text-[#63B3ED]' : 'text-[#A0AEC0] group-hover:text-[#63B3ED]'}`} />
                    {!isSidebarCollapsed && (
                      <span className="font-sans font-semibold tracking-wide whitespace-nowrap">{item.name}</span>
                    )}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Collapse Toggle, Shortcuts & Logout */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 text-[#A0AEC0] hover:text-[#F7FAFC] hover:bg-white/10 transition-all cursor-pointer self-center"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
          </button>

          <button
            onClick={() => setShowShortcutsHelp(true)}
            className={`flex items-center gap-3 rounded-xl text-xs font-semibold text-[#A0AEC0] hover:text-[#63B3ED] hover:bg-white/[0.02] transition-all cursor-pointer ${
              isSidebarCollapsed ? 'justify-center p-2' : 'px-4 py-2.5'
            }`}
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-sans">Shortcuts</span>}
          </button>

          <button
            onClick={logout}
            className={`flex items-center gap-3 rounded-xl text-sm font-bold text-[#FC8181] hover:text-[#FC8181] hover:bg-[#FC8181]/5 border border-transparent hover:border-[#FC8181]/15 transition-all duration-300 cursor-pointer ${
              isSidebarCollapsed ? 'justify-center p-2' : 'px-4 py-3'
            }`}
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-sans font-semibold">Sign Out</span>}
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
                  <LogoFull size={32} />
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
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#131929] border border-white/5">
                  <div className="flex items-center gap-3 overflow-hidden">
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
                      <p className="text-sm font-bold text-[#F7FAFC] truncate max-w-[130px]">
                        {profile.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-[#63B3ED] transition-all cursor-pointer"
                    title="Open Settings"
                    id="settings-gear-mobile"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
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
        <header 
          className="h-16 px-6 flex items-center justify-between sticky top-0 z-20"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div className="flex items-center gap-3">
            {/* Menu Hamburger on Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/5 text-[#A0AEC0] hover:text-[#F7FAFC] hover:bg-white/10 transition-all cursor-pointer"
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
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase bg-white/[0.04] text-[#63B3ED] border border-white/10 tracking-widest">
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

      {/* Settings Modal overlay */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} />
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
