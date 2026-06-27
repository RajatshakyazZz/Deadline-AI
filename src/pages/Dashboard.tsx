import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Timer, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Folder,
  Bell,
  BellOff
} from 'lucide-react';
import { useApp } from '../components/AppContext';
import { useToast } from '../components/Toast';
import { Task, Habit } from '../types';
import { CrisisModal } from '../components/CrisisModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { requestNotificationPermission, getSafeNotificationPermission } from '../services/messaging';

// Animated CountUp Helper Component
const CountUpValue: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ end, duration = 1000, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let rAFId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        rAFId = window.requestAnimationFrame(step);
      }
    };
    rAFId = window.requestAnimationFrame(step);

    return () => {
      if (rAFId) {
        window.cancelAnimationFrame(rAFId);
      }
    };
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

const getCustomOnboardingTasks = (goal: string) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().substring(0, 16);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().substring(0, 16);

  if (goal === 'Pass an exam') {
    return [
      {
        title: 'Compile Exam Core Syllabus Summary',
        deadline: tomorrowStr,
        category: 'assignment' as const,
        context: 'Consolidate core curriculum chapters, compile definition flashcards, and schedule structured study hours.',
        complexity: 'high' as const,
        estimatedHours: 4.5,
        urgencyScore: 8,
        summary: 'Reviewing key exam objectives and creating a study matrix.',
        subtasks: [
          { id: 'ob-e1', title: 'Compile key textbook chapter summary points', completed: false, priority: 'must' as const, tip: 'Keep formulas separate.' },
          { id: 'ob-e2', title: 'Complete 10 syllabus review practice problems', completed: false, priority: 'must' as const },
          { id: 'ob-e3', title: 'Synthesize study block schedules', completed: false, priority: 'should' as const }
        ],
        schedule: [],
        riskFactors: ['Short review period', 'Complex algebraic formulas'],
        aiRecommendation: 'Execute a dedicated 45-minute focus session today to clear flashcards early.',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        title: 'Conduct Timed Past Paper Dry-Run',
        deadline: nextWeekStr,
        category: 'assignment' as const,
        context: 'Simulate a live examination environment to check speed and performance metrics under time limits.',
        complexity: 'medium' as const,
        estimatedHours: 2.0,
        urgencyScore: 6,
        summary: 'Practice examination under actual grading guidelines.',
        subtasks: [
          { id: 'ob-e4', title: 'Download and print past papers with mark scheme', completed: false, priority: 'must' as const },
          { id: 'ob-e5', title: 'Perform 90-minute strict time exam simulation', completed: false, priority: 'must' as const }
        ],
        schedule: [],
        riskFactors: ['Procrastination during review'],
        aiRecommendation: 'Grade yourself honestly using the standard marking rubric.',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  } else if (goal === 'Build a project') {
    return [
      {
        title: 'Launch Core MVP Production Prototype',
        deadline: tomorrowStr,
        category: 'project' as const,
        context: 'Draft structural code layers, configure system routing components, and execute live deployment scripts.',
        complexity: 'high' as const,
        estimatedHours: 5.5,
        urgencyScore: 9,
        summary: 'Deploying initial MVP code to verification environments.',
        subtasks: [
          { id: 'ob-b1', title: 'Define main database schema layers', completed: false, priority: 'must' as const },
          { id: 'ob-b2', title: 'Verify credentials and config environment files', completed: false, priority: 'must' as const },
          { id: 'ob-b3', title: 'Run local validation and lint test passes', completed: false, priority: 'should' as const }
        ],
        schedule: [],
        riskFactors: ['Vague scope requirements', 'Dependency compilation conflicts'],
        aiRecommendation: 'Limit custom functions to basic features on day 1 to bypass speed bottlenecks.',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        title: 'Conduct UI/UX Polish Audit Session',
        deadline: nextWeekStr,
        category: 'project' as const,
        context: 'Verify spacing, audit text contrast ratios, adjust responsive grids, and embed micro-interactions.',
        complexity: 'medium' as const,
        estimatedHours: 1.5,
        urgencyScore: 5,
        summary: 'Refining client-side layers to meet Apple quality standards.',
        subtasks: [
          { id: 'ob-b4', title: 'Test layouts on both desktop and mobile views', completed: false, priority: 'must' as const },
          { id: 'ob-b5', title: 'Add hover spring physics transitions to buttons', completed: false, priority: 'should' as const }
        ],
        schedule: [],
        riskFactors: ['Inconsistent spacing scales'],
        aiRecommendation: 'Prefer standard system font stacks (Inter, SF Pro) for maximum interface clarity.',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  } else if (goal === 'Prepare for interview') {
    return [
      {
        title: 'Solve Top Technical Algorithmic Puzzles',
        deadline: tomorrowStr,
        category: 'interview' as const,
        context: 'Revise foundational computer science algorithms and practice optimized solutions.',
        complexity: 'high' as const,
        estimatedHours: 3.0,
        urgencyScore: 7,
        summary: 'Mastering array, hash map, and sliding window templates.',
        subtasks: [
          { id: 'ob-i1', title: 'Master sliding window and string parsing templates', completed: false, priority: 'must' as const },
          { id: 'ob-i2', title: 'Verify time/space complexity scales', completed: false, priority: 'should' as const }
        ],
        schedule: [],
        riskFactors: ['Unoptimized cubic time bottlenecks'],
        aiRecommendation: 'Explain your reasoning steps out loud to practice real-time interviews.',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        title: 'Optimize Interactive Whiteboard Resume Dry-Run',
        deadline: nextWeekStr,
        category: 'interview' as const,
        context: 'Simulate discussing deep system architectures, past project achievements, and behavioral situations.',
        complexity: 'medium' as const,
        estimatedHours: 1.5,
        urgencyScore: 5,
        summary: 'Communicating professional expertise cleanly.',
        subtasks: [
          { id: 'ob-i3', title: 'Prepare 3 STAR-method accomplishment highlights', completed: false, priority: 'must' as const },
          { id: 'ob-i4', title: 'Record a mock behavioral video walkthrough', completed: false, priority: 'should' as const }
        ],
        schedule: [],
        riskFactors: ['Vague verbal summaries'],
        aiRecommendation: 'Connect architectural decisions directly to quantifiable user improvements.',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  } else if (goal === 'Improve productivity') {
    return [
      {
        title: 'Establish 3-Tier Focus Time-Blocks',
        deadline: tomorrowStr,
        category: 'other' as const,
        context: 'Structure deep focus intervals and block multi-tasking distractions.',
        complexity: 'medium' as const,
        estimatedHours: 1.0,
        urgencyScore: 6,
        summary: 'Optimizing calendar blocks for maximum deep execution.',
        subtasks: [
          { id: 'ob-p1', title: 'Reserve 90 minutes of distraction-free morning block', completed: false, priority: 'must' as const },
          { id: 'ob-p2', title: 'Set automatic focus mode settings on devices', completed: false, priority: 'should' as const }
        ],
        schedule: [],
        riskFactors: ['Intrusive notification popups'],
        aiRecommendation: 'Log focus hours daily to analyze consistency metrics.',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        title: 'Workspace Notification Audit',
        deadline: nextWeekStr,
        category: 'personal' as const,
        context: 'Silence unnecessary alerts, configure system focus filters, and clean desktop clutter.',
        complexity: 'low' as const,
        estimatedHours: 0.5,
        urgencyScore: 4,
        summary: 'Eliminating environmental distractions.',
        subtasks: [
          { id: 'ob-p3', title: 'Tidy up physical workstation files and folders', completed: false, priority: 'must' as const },
          { id: 'ob-p4', title: 'Mute non-essential social notifications during work', completed: false, priority: 'must' as const }
        ],
        schedule: [],
        riskFactors: ['Digital clutter distraction'],
        aiRecommendation: 'Keep the phone out of sight during core study or development blocks.',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  } else {
    // Stay consistent
    return [
      {
        title: 'Configure Consistency Streak Routine',
        deadline: tomorrowStr,
        category: 'other' as const,
        context: 'Integrate active habits into physical environment anchors.',
        complexity: 'medium' as const,
        estimatedHours: 1.0,
        urgencyScore: 5,
        summary: 'Structuring trigger mechanisms for atomic habits.',
        subtasks: [
          { id: 'ob-s1', title: 'Anchor habit to morning coffee check-in trigger', completed: false, priority: 'must' as const },
          { id: 'ob-s2', title: 'Define custom reward points for consistency milestones', completed: false, priority: 'should' as const }
        ],
        schedule: [],
        riskFactors: ['Ambitious starting scope'],
        aiRecommendation: 'Start with 5-minute atomic habits first to lock in streaks.',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        title: 'Complete First Daily Consistency Streak',
        deadline: nextWeekStr,
        category: 'personal' as const,
        context: 'Log and complete initial micro-actions to verify haptic updates and streak score metrics.',
        complexity: 'low' as const,
        estimatedHours: 0.5,
        urgencyScore: 3,
        summary: 'Locking in day 1 streak milestones.',
        subtasks: [
          { id: 'ob-s3', title: 'Complete water intake and log on dashboard', completed: false, priority: 'must' as const },
          { id: 'ob-s4', title: 'Track current completion rating metric', completed: false, priority: 'must' as const }
        ],
        schedule: [],
        riskFactors: ['Forgetting daily completion'],
        aiRecommendation: 'Log completions immediately on your phone to build muscle memory.',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
};

export const Dashboard: React.FC = () => {
  const { profile, tasks, habits, sessions, updateProfile, addTask, user, testPushNotification } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [greeting, setGreeting] = useState('');
  const [selectedCrisisTask, setSelectedCrisisTask] = useState<Task | null>(null);
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);

  // Notifications State & Handlers
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'sending' | 'success' | 'failed'>('idle');

  useEffect(() => {
    setPermission(getSafeNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission(user?.uid || 'guest');
    setPermission(getSafeNotificationPermission());
  };

  const handleQuickTest = async () => {
    setDispatchStatus('sending');
    try {
      const res = await testPushNotification('Daily Routine Check', 'Your daily schedule is ready. Tap to focus!', 'habit_reminder');
      if (res) {
        setDispatchStatus('success');
        setTimeout(() => setDispatchStatus('idle'), 3000);
      } else {
        setDispatchStatus('failed');
      }
    } catch (e) {
      console.error(e);
      setDispatchStatus('failed');
    }
  };

  // Set greeting according to system time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Compute stats
  const activeTasks = tasks.filter(t => !t.completed);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = tasks.filter(t => t.completed && t.completedAt && t.completedAt.split('T')[0] === todayStr).length;
  
  const totalTasksToday = tasks.filter(t => {
    const isTodayTask = t.deadline.split('T')[0] === todayStr;
    const isCompToday = t.completed && t.completedAt && t.completedAt.split('T')[0] === todayStr;
    return isTodayTask || isCompToday;
  }).length;

  const todayCompletedCount = tasks.filter(t => t.completed && t.completedAt && t.completedAt.split('T')[0] === todayStr).length;
  const todayProgressPercent = totalTasksToday > 0 ? Math.round((todayCompletedCount / totalTasksToday) * 100) : 0;

  const totalFocusHours = Number(((profile?.totalFocusMinutes || 0) / 60).toFixed(1));
  const dayStreak = profile?.longestStreak || 0;

  // Crisis tasks: active, and deadline is less than 3 hours away
  const crisisTasks = activeTasks.filter(t => {
    const deadlineTime = new Date(t.deadline).getTime();
    const nowTime = Date.now();
    const diffHours = (deadlineTime - nowTime) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours < 3;
  });

  // Overdue high-priority/critical tasks
  const overdueHighPriorityTasks = activeTasks.filter(t => {
    const isOverdue = new Date(t.deadline).getTime() < Date.now();
    const isHighPriority = t.complexity === 'high' || t.complexity === 'critical';
    return isOverdue && isHighPriority;
  });

  const isAutoCrisisModeActivated = !!profile?.crisisModeAutoEnabled && overdueHighPriorityTasks.length > 3;

  // Recent tasks (last 3 added/updated)
  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  // Calculate last 7 days list for the mini-calendar
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const dayNum = d.getDate();
    
    // Check if any habit was completed on this day
    const completedOnDay = habits.some(h => h.lastCompleted === dateStr);

    return {
      dateStr,
      dayName,
      dayNum,
      active: dateStr === todayStr,
      completed: completedOnDay
    };
  });

  if (profile && !profile.onboardingGoal) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 150 }}
          className="liquid-glass max-w-2xl w-full p-8 md:p-12 text-center flex flex-col items-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA]" />
          
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#63B3ED]/10 to-[#9F7AEA]/10 border border-[#63B3ED]/20 text-[#63B3ED] mb-6 animate-pulse">
            <Sparkles className="w-8 h-8 text-[#9F7AEA]" />
          </div>

          <h2 className="text-3xl md:text-4xl font-sans font-extrabold tracking-tight text-white mb-2">
            What are you trying to achieve?
          </h2>
          <p className="text-sm font-medium text-[#A0AEC0] max-w-md mb-8 leading-relaxed">
            Welcome, <strong className="text-white font-semibold">{profile.name}</strong>. We'll automatically synthesize dynamic deadlines, tailor study planners, and configure your focus channels.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {[
              {
                id: 'Pass an exam',
                title: '🎓 Pass an Exam',
                description: 'Academic tests, syllabus reviews, and timed paper practice.',
                color: 'hover:border-[#63B3ED]/30 hover:bg-[#63B3ED]/5'
              },
              {
                id: 'Build a project',
                title: '🚀 Build a Project',
                description: 'Codebase construction, shipping MVPs, and performance audits.',
                color: 'hover:border-[#9F7AEA]/30 hover:bg-[#9F7AEA]/5'
              },
              {
                id: 'Prepare for interview',
                title: '💼 Prepare for Interview',
                description: 'Coding algorithms, resume polishing, and mock dry-runs.',
                color: 'hover:border-[#68D391]/30 hover:bg-[#68D391]/5'
              },
              {
                id: 'Improve productivity',
                title: '📈 Improve Productivity',
                description: 'Manage time-blocking, establish routines, and beat timelines.',
                color: 'hover:border-[#F6AD55]/30 hover:bg-[#F6AD55]/5'
              },
              {
                id: 'Stay consistent',
                title: '🔥 Stay Consistent',
                description: 'Establish powerful atomic habits, maintain streaks, and log.',
                color: 'hover:border-pink-500/30 hover:bg-pink-500/5 md:col-span-2'
              }
            ].map((option) => (
              <motion.button
                key={option.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  try {
                    // Update profile onboardingGoal, starting levels/XP
                    await updateProfile({
                      onboardingGoal: option.id,
                      level: 1,
                      xp: 50
                    });

                    // Synthesize tasks based on selected goal
                    const tasksToCreate = getCustomOnboardingTasks(option.id);
                    for (const t of tasksToCreate) {
                      await addTask(t);
                    }

                    // Celebratory confetti explosion
                    confetti({
                      particleCount: 180,
                      spread: 100,
                      origin: { y: 0.6 }
                    });

                    showToast(`✨ Plan synthesized! +50 XP Starting Bonus awarded.`, 'success');
                  } catch (err) {
                    console.error('Onboarding failed:', err);
                    showToast('Oops, had an issue compiling onboarding config.', 'error');
                  }
                }}
                className={`p-5 rounded-2xl border border-white/5 bg-white/[0.02] text-left transition-all duration-300 flex flex-col gap-1 cursor-pointer ${option.color}`}
              >
                <h4 className="text-base font-bold text-white tracking-tight">{option.title}</h4>
                <p className="text-xs text-gray-400 leading-normal font-sans font-medium">{option.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Suggest Pomodoro Focus Block if there is free time (no focus session today)
  const todaySessionMinutes = sessions
    .filter(s => s.date === todayStr)
    .reduce((acc, s) => acc + s.focusMinutes, 0);
  const showEmptyTimeSuggestion = todaySessionMinutes === 0 && tasks.filter(t => !t.completed).length > 0;

  return (
    <div className="space-y-8 select-none">
      
      {/* Animated Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col gap-1"
      >
        <h2 className="text-3xl md:text-4xl font-sans font-bold tracking-tight text-[#F7FAFC]">
          {greeting}, <span className="text-[#63B3ED] font-extrabold">{profile?.name || 'Developer'}</span>
        </h2>

        {/* Real-time gamified level progression progress bar */}
        <div className="flex flex-wrap items-center gap-3 mt-1.5 select-none">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] text-white">
            Level {profile?.level || 1}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 rounded-full bg-white/5 border border-white/10 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${profile?.xp || 0}%` }}
                className="h-full bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA]"
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-gray-500">
              {profile?.xp || 0}/100 XP
            </span>
          </div>
          {profile?.onboardingGoal && (
            <span className="text-[10px] font-sans font-bold text-gray-400 border border-white/10 px-2 py-0.5 rounded-lg bg-white/[0.02]">
              🎯 {profile.onboardingGoal}
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-[#A0AEC0] font-sans mt-3">
          {profile?.onboardingGoal === 'Pass an exam' ? "Ready to master your core exam subjects and beat the ticking clock today?" :
           profile?.onboardingGoal === 'Build a project' ? "Let's build outstanding code layers and ship pristine prototypes today." :
           profile?.onboardingGoal === 'Prepare for interview' ? "Ready to solve high-impact interview puzzles and show your expertise today?" :
           profile?.onboardingGoal === 'Improve productivity' ? "Ready to allocate tactical deep focus blocks and beat timelines today?" :
           profile?.onboardingGoal === 'Stay consistent' ? "Let's refresh habit chains and lock in consecutive milestone streaks today!" :
           "Welcome back to the command center. Let's crush these timelines today."}
        </p>
      </motion.div>

      {/* Empty Time Slot Detected Suggestion Card */}
      {showEmptyTimeSuggestion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl border border-[#9F7AEA]/30 bg-[#9F7AEA]/5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md backdrop-blur-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#9F7AEA]/10 text-[#9F7AEA]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">💡 Empty Time Slot Detected</h4>
              <p className="text-xs text-gray-400 mt-0.5 leading-normal font-sans font-medium">
                No focus activity has been logged today. Would you like to launch a 25-minute Pomodoro Focus session now?
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/focus')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA] text-[#080B14] font-extrabold text-xs uppercase tracking-wider hover:scale-[1.03] active:scale-[0.98] shadow-md cursor-pointer flex-shrink-0"
          >
            Launch Focus Block
          </button>
        </motion.div>
      )}

      {/* Auto-Triggered Emergency Crisis Banner */}
      {isAutoCrisisModeActivated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-2xl border border-[#FC8181]/40 bg-[#FC8181]/10 text-[#FC8181] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-[#FC8181]/10 animate-pulse"
          style={{ animationDuration: '8s' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-[#FC8181]/20 border border-[#FC8181]/30 flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
              <AlertTriangle className="w-6 h-6 text-[#FC8181]" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sans tracking-tight">🚨 CRITICAL AUTOMATIC SYSTEM CRISIS ACTIVATED</h3>
              <p className="text-xs font-sans text-red-300 mt-0.5 leading-normal max-w-xl">
                There are <strong className="text-white font-mono">{overdueHighPriorityTasks.length} high-priority or critical tasks</strong> currently overdue on your dashboard. Overdue limits have exceeded safety thresholds. Immediate tactical execution is recommended!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              navigate('/tasks?filter=crisis');
            }}
            className="px-4 py-2 rounded-xl bg-[#FC8181] text-[#080B14] font-extrabold text-xs uppercase tracking-wider hover:bg-white hover:text-red-500 transition-all cursor-pointer shadow-md"
          >
            Tactical Workspace
          </button>
        </motion.div>
      )}

      {/* Grid: Stat Cards & Progress Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metric stats list */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          
          {/* Active Tasks card (Blue) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="liquid-glass p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A0AEC0] uppercase font-mono tracking-wider">Active Tasks</span>
              <div className="p-2 rounded-xl bg-[#63B3ED]/10 text-[#63B3ED]">
                <Folder className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-3xl font-extrabold text-[#F7FAFC] font-sans">
                <CountUpValue end={activeTasks.length} />
              </h4>
              <p className="text-xs text-[#A0AEC0] mt-1 font-medium">Ticking and waiting</p>
            </div>
          </motion.div>

          {/* Completed Today card (Green) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="liquid-glass p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A0AEC0] uppercase font-mono tracking-wider">Completed Today</span>
              <div className="p-2 rounded-xl bg-[#68D391]/10 text-[#68D391]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-3xl font-extrabold text-[#F7FAFC] font-sans">
                <CountUpValue end={completedToday} />
              </h4>
              <p className="text-xs text-[#A0AEC0] mt-1 font-medium">Beaten to the clock</p>
            </div>
          </motion.div>

          {/* Day Streak card (Orange Flame) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="liquid-glass p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A0AEC0] uppercase font-mono tracking-wider">Day Streak</span>
              <div className="p-2 rounded-xl bg-[#F6AD55]/10 text-[#F6AD55] animate-pulse">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-3xl font-extrabold text-[#F7FAFC] font-sans flex items-center gap-1">
                <CountUpValue end={dayStreak} /> <span className="text-lg">🔥</span>
              </h4>
              <p className="text-xs text-[#A0AEC0] mt-1 font-medium">Consecutive execution</p>
            </div>
          </motion.div>

          {/* Focus Hours card (Purple) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="liquid-glass p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A0AEC0] uppercase font-mono tracking-wider">Focus Hours</span>
              <div className="p-2 rounded-xl bg-[#9F7AEA]/10 text-[#9F7AEA]">
                <Timer className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-3xl font-extrabold text-[#F7FAFC] font-sans">
                <CountUpValue end={totalFocusHours} suffix="h" />
              </h4>
              <p className="text-xs text-[#A0AEC0] mt-1 font-medium">Deep work metrics</p>
            </div>
          </motion.div>
        </div>

        {/* Circular SVG Completion Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="liquid-glass p-6 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden"
          >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#63B3ED] to-[#9F7AEA]" />
          <span className="text-xs font-bold text-[#A0AEC0] uppercase font-mono tracking-wider mb-3">Today's Target Rate</span>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Outer grey circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-white/5"
                strokeWidth="7"
                fill="none"
              />
              {/* Colored active stroke */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-[url(#gradient)]"
                strokeWidth="7"
                strokeDasharray="263.8"
                initial={{ strokeDashoffset: 263.8 }}
                animate={{ strokeDashoffset: 263.8 - (263.8 * todayProgressPercent) / 100 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="none"
              />
              {/* Gradients defs */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#63B3ED" />
                  <stop offset="100%" stopColor="#9F7AEA" />
                </linearGradient>
              </defs>
            </svg>
            {/* Inner text percent */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-[#F7FAFC] font-sans">
                {todayProgressPercent}%
              </span>
              <span className="text-[10px] text-[#A0AEC0] uppercase font-mono tracking-wider">Beaten</span>
            </div>
          </div>

          <p className="text-xs text-[#A0AEC0] mt-4 max-w-[180px] leading-relaxed">
            {todayCompletedCount} of {totalTasksToday} schedule tasks cleared today
          </p>
        </motion.div>
      </div>

      {/* Main dashboard columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3 Content: Crisis Zone & Recent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dedicated Crisis Zone Section */}
          <motion.section
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-6 shadow-xl relative overflow-hidden ${
              crisisTasks.length > 0 
                ? 'liquid-glass liquid-glass-crisis crisis-pulse' 
                : 'liquid-glass'
            }`}
          >
            {crisisTasks.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-[#FC8181] animate-pulse" />
                  <h3 className="text-lg font-bold text-[#FC8181] tracking-tight font-sans">🚨 Crisis Zone: Due within 3 Hours</h3>
                </div>

                <div className="space-y-3">
                  {crisisTasks.map((task) => {
                    const deadlineTime = new Date(task.deadline).getTime();
                    const remainingMinutes = Math.max(0, Math.floor((deadlineTime - Date.now()) / (1000 * 60)));
                    const mm = String(remainingMinutes % 60).padStart(2, '0');
                    const hh = String(Math.floor(remainingMinutes / 60)).padStart(2, '0');

                    return (
                      <div 
                        key={task.id}
                        className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-[#FC8181] bg-[#FC8181]/10 border border-[#FC8181]/20 mr-2 uppercase tracking-wider">
                            CRISIS
                          </span>
                          <span className="text-sm font-bold text-[#F7FAFC] font-sans truncate">{task.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 justify-between md:justify-end">
                          <div className="text-right flex items-center gap-1.5 text-[#FC8181] font-mono font-bold text-xs bg-[#FC8181]/10 px-2 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                            <span>{hh}:{mm} Left</span>
                          </div>
                          <button
                            onClick={() => setSelectedCrisisTask(task)}
                            className="apple-glass-btn apple-glass-red text-xs font-extrabold uppercase tracking-wide !px-3.5 !py-1.5 shadow-lg"
                          >
                            Crisis Help
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-[#68D391]/10 text-[#68D391] mt-0.5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#68D391] tracking-tight font-sans">🚨 Crisis Zone: Safe & Stable</h3>
                    <p className="text-sm text-[#A0AEC0] mt-1 font-sans font-medium">
                      All timelines are stable. No active tasks are due in the next 3 hours.
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-mono font-bold text-[#68D391] bg-[#68D391]/10 border border-[#68D391]/20 uppercase tracking-widest">
                    All Systems Nominal
                  </span>
                </div>
              </div>
            )}
          </motion.section>

          {/* Recent Tasks List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between select-none">
              <h3 className="text-lg font-bold text-[#F7FAFC] tracking-tight">Recent Tasks</h3>
              <Link to="/tasks" className="text-xs font-bold text-[#63B3ED] hover:text-[#9F7AEA] flex items-center gap-1 transition-colors">
                <span>View All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentTasks.length === 0 ? (
              <div className="liquid-glass p-8 text-center text-sm text-[#A0AEC0]">
                No active tasks logged yet. Hit the FAB + to launch your first task!
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task, idx) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4 transition-all duration-300 cursor-pointer hover:bg-white/[0.06] hover:border-white/15"
                    onClick={() => setSelectedDetailTask(task)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Check checkbox draw animation */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/tasks');
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                          task.completed 
                            ? 'bg-[#68D391] border-[#68D391] text-[#080B14]' 
                            : 'border-[#4A5568] hover:border-[#63B3ED]'
                        }`}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-[#080B14]" />}
                      </button>

                      <div className="truncate">
                        <h4 className={`text-sm font-bold text-[#F7FAFC] ${task.completed ? 'line-through text-[#4A5568]' : ''}`}>
                          {task.title}
                        </h4>
                        <p className="text-xs text-[#A0AEC0] font-medium mt-0.5 truncate max-w-sm md:max-w-md">
                          {task.context}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-[#A0AEC0]">
                        {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        task.complexity === 'critical' ? 'bg-[#FC8181]/15 text-[#FC8181]' :
                        task.complexity === 'high' ? 'bg-[#F6AD55]/15 text-[#F6AD55]' :
                        task.complexity === 'medium' ? 'bg-[#63B3ED]/15 text-[#63B3ED]' : 'bg-[#68D391]/15 text-[#68D391]'
                      }`}>
                        {task.complexity}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right 1/3 Column: AI Briefing Preview & 7-Day Habit Tracker */}
        <div className="space-y-6">
          
          {/* AI Briefing Gradient Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onClick={() => navigate('/briefing')}
            className="liquid-glass liquid-glass-ai p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest text-[#9F7AEA] bg-[#9F7AEA]/10 border border-[#9F7AEA]/20">
                Briefing Pending
              </span>
              <Sparkles className="w-5 h-5 text-[#9F7AEA]" />
            </div>

            <h4 className="text-base font-bold text-[#F7FAFC] leading-snug group-hover:text-[#63B3ED] transition-colors">
              Synthesize Your Tactical Daily Roadmap
            </h4>
            <p className="text-xs text-[#A0AEC0] mt-1.5 leading-relaxed font-sans font-medium">
              Let Gemini 3.5 scan all pending items and draft your custom morning checklist.
            </p>

            <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#63B3ED]">
              <span>Review AI Briefing</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* 7-Day Habit Streak Mini-Calendar */}
          <section className="liquid-glass p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider font-sans">Streak Mini-Calendar</h3>
              <span className="text-[10px] font-mono text-[#F6AD55] font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Weekly Track
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {last7Days.map((day) => (
                <div 
                  key={day.dateStr}
                  className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                    day.active 
                      ? 'bg-gradient-to-br from-[#63B3ED]/15 to-[#9F7AEA]/15 border-[#63B3ED] text-[#F7FAFC]' 
                      : day.completed 
                        ? 'bg-white/[0.06] border-[#F6AD55]/40 text-[#F6AD55]'
                        : 'bg-white/[0.02] border-transparent text-[#A0AEC0]'
                  }`}
                  title={`${day.dateStr} - Habits completed: ${day.completed ? 'Yes' : 'No'}`}
                >
                  <span className="text-[10px] font-mono font-bold opacity-60 uppercase">{day.dayName}</span>
                  <span className="text-sm font-bold mt-1 font-mono">{day.dayNum}</span>
                  
                  {/* Status dot/icon */}
                  <div className="mt-1.5">
                    {day.completed ? (
                      <Flame className="w-3.5 h-3.5 text-[#F6AD55] animate-pulse" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              id="open-habits-console-btn"
              onClick={() => navigate('/habits')}
              className="w-full mt-3 py-2.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-300 bg-gradient-to-r from-[#63B3ED] via-[#8B5CF6] to-[#EC4899] text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:shadow-[0_0_22px_rgba(139,92,246,0.65)] hover:scale-[1.01] active:scale-[0.98] border border-white/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 animate-pulse text-white" />
              <span>Open Habits Console</span>
            </button>
          </section>

          {/* Dashboard Notifications Card */}
          <section className="liquid-glass p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider font-sans">Push Gateway</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping animate-duration-1000" />
                <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest">FCM SOCKET</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                permission === 'granted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {permission === 'granted' ? <Bell className="w-5 h-5 animate-bounce animate-duration-[3s]" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#F7FAFC] truncate">
                  {permission === 'granted' ? 'Notifications Fully Armed' : 'Reminders Deauthorized'}
                </div>
                <div className="text-[10px] text-gray-500 truncate mt-0.5">
                  {permission === 'granted' ? 'Listening on live telemetry stream' : 'Grant authorization for push reminders'}
                </div>
              </div>
            </div>

            {permission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="w-full py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all bg-indigo-500 text-white hover:bg-indigo-600 shadow-md cursor-pointer text-center"
              >
                Enable Reminders
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/notifications')}
                  className="py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all border border-white/10 hover:border-white/20 text-[#A0AEC0] cursor-pointer text-center"
                >
                  Configure Hub
                </button>
                <button
                  onClick={handleQuickTest}
                  disabled={dispatchStatus === 'sending'}
                  className={`py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center ${
                    dispatchStatus === 'sending' 
                      ? 'bg-amber-500 text-white animate-pulse' 
                      : dispatchStatus === 'success' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}
                >
                  {dispatchStatus === 'sending' ? 'Sending...' : dispatchStatus === 'success' ? 'Dispatched!' : 'Quick Dispatch'}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Task detail overlay modal */}
      <AnimatePresence>
        {selectedDetailTask && (
          <TaskDetailModal task={selectedDetailTask} onClose={() => setSelectedDetailTask(null)} />
        )}
      </AnimatePresence>

      {/* Crisis help overlay modal */}
      <AnimatePresence>
        {selectedCrisisTask && (
          <CrisisModal task={selectedCrisisTask} onClose={() => setSelectedCrisisTask(null)} />
        )}
      </AnimatePresence>

    </div>
  );
};
