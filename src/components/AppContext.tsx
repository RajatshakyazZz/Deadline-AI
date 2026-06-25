import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onSnapshot, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  getDoc 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, signInWithGoogle, signOutUser, OperationType, handleFirestoreError } from '../firebase';
import { Task, Habit, FocusSession, UserProfile, Subtask, ScheduleBlock, ComplexityType, CategoryType } from '../types';
import { useToast } from './Toast';

interface AppContextType {
  user: any | null;
  profile: UserProfile | null;
  tasks: Task[];
  habits: Habit[];
  sessions: FocusSession[];
  isDemo: boolean;
  loading: boolean;
  login: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completed'>) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  addHabit: (name: string, icon: string) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  addFocusSession: (minutes: number, tasksWorkedOn: string[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// High-quality mock tasks, habits, and sessions for Demo / Guest mode
const MOCK_TASKS: Task[] = [
  {
    id: 'demo-task-1',
    title: 'Deploy Production Core Server',
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    category: 'project',
    context: 'Configure container routing, environment variables, and verify ssl certificate compliance before final release.',
    complexity: 'critical',
    estimatedHours: 3.5,
    urgencyScore: 10,
    summary: 'Critical server deployment with imminent deadline. Requires configuration audits, log testing, and production ingress validation.',
    subtasks: [
      { id: 's1', title: 'Review Nginx routing & SSL headers', completed: true, priority: 'must', tip: 'Double check strict-transport-security.' },
      { id: 's2', title: 'Configure ENV production variables', completed: false, priority: 'must', tip: 'Ensure secret keys are completely hidden.' },
      { id: 's3', title: 'Perform load and cold-start speed tests', completed: false, priority: 'should', tip: 'Target < 200ms latency.' },
    ],
    schedule: [
      {
        day: 'Today',
        date: new Date().toISOString().split('T')[0],
        blocks: [
          { time: '13:00 - 13:45', task: 'SSL configuration audits', duration: '45 min' },
          { time: '14:00 - 15:30', task: 'Server environment bindings & deployment tests', duration: '90 min' },
        ]
      }
    ],
    riskFactors: [
      'Unresolved TLS handshakes due to DNS propagation delay',
      'Database connection pooling failures under heavy peak stress'
    ],
    aiRecommendation: 'Execute Nginx routing setup first. Disable unused secondary assets to accelerate deployment speed.',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-2',
    title: 'Weekly Sync with Product Team',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    category: 'meeting',
    context: 'Discuss design guidelines, visual polish elements, and align on marketing timeline adjustments.',
    complexity: 'low',
    estimatedHours: 1.0,
    urgencyScore: 4,
    summary: 'Aligning design criteria across the development stack.',
    subtasks: [
      { id: 's4', title: 'Prepare design assets and sliders', completed: false, priority: 'must', tip: 'Showcase final dark system layout.' },
      { id: 's5', title: 'Draft visual animation timelines', completed: false, priority: 'should', tip: 'Emphasize spring curves.' }
    ],
    schedule: [],
    riskFactors: ['Potential alignment conflicts regarding design transitions'],
    aiRecommendation: 'Lead with visual prototypes. Let interactive transitions explain themselves.',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-3',
    title: 'Design Logo Glow Animations',
    deadline: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Completed 4 hrs ago
    category: 'project',
    context: 'Polish logo gradients and border glows to achieve premium visual identity.',
    complexity: 'medium',
    estimatedHours: 1.5,
    urgencyScore: 6,
    summary: 'Aesthetic polish using custom Framer Motion spring mechanics.',
    subtasks: [
      { id: 's6', title: 'Create gradient glows with CSS filters', completed: true, priority: 'must' },
    ],
    schedule: [],
    riskFactors: [],
    aiRecommendation: 'Leverage hardware-accelerated transforms for rendering stability.',
    completed: true,
    completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  }
];

const MOCK_HABITS: Habit[] = [
  { id: 'h1', name: 'Plan Tasks with DeadlineAI', icon: 'Sparkles', streak: 12, lastCompleted: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() },
  { id: 'h2', name: 'Pomodoro Focus block', icon: 'Timer', streak: 4, lastCompleted: '', createdAt: new Date().toISOString() },
  { id: 'h3', name: 'Review Deadlines daily', icon: 'Flame', streak: 9, lastCompleted: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    return localStorage.getItem('deadlineai_is_guest') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Authentication observer
  useEffect(() => {
    if (isDemo) {
      // Demo authentication mock
      const mockUser = {
        uid: 'demo_guest_uid',
        displayName: 'Creative Guest Developer',
        email: 'guest@deadlineai.dev',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      };
      setUser(mockUser);
      setProfile({
        name: mockUser.displayName,
        email: mockUser.email,
        photoURL: mockUser.photoURL,
        createdAt: new Date().toISOString(),
        totalFocusMinutes: 125,
        longestStreak: 12,
      });

      // Load mock items from localStorage if available, else load default mocks
      const localTasks = localStorage.getItem('deadlineai_demo_tasks');
      const localHabits = localStorage.getItem('deadlineai_demo_habits');
      const localSessions = localStorage.getItem('deadlineai_demo_sessions');

      if (localTasks) setTasks(JSON.parse(localTasks));
      else setTasks(MOCK_TASKS);

      if (localHabits) setHabits(JSON.parse(localHabits));
      else setHabits(MOCK_HABITS);

      if (localSessions) setSessions(JSON.parse(localSessions));
      else setSessions([]);

      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Listen to User Profile doc
        const profileRef = doc(db, 'users', firebaseUser.uid);
        let profileSnap;
        try {
          profileSnap = await getDoc(profileRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          return;
        }

        let initialProfile: UserProfile;
        if (!profileSnap.exists()) {
          initialProfile = {
            name: firebaseUser.displayName || 'Developer',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            createdAt: new Date().toISOString(),
            totalFocusMinutes: 0,
            longestStreak: 0,
          };
          try {
            await setDoc(profileRef, initialProfile);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
            return;
          }
        } else {
          initialProfile = profileSnap.data() as UserProfile;
        }
        setProfile(initialProfile);

        // Realtime sync collections
        const tasksPath = `users/${firebaseUser.uid}/tasks`;
        const tasksQuery = query(collection(db, 'users', firebaseUser.uid, 'tasks'), orderBy('createdAt', 'desc'));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
          const loadedTasks: Task[] = [];
          snapshot.forEach((docSnap) => {
            loadedTasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
          });
          setTasks(loadedTasks);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, tasksPath);
        });

        const habitsPath = `users/${firebaseUser.uid}/habits`;
        const habitsQuery = query(collection(db, 'users', firebaseUser.uid, 'habits'), orderBy('createdAt', 'desc'));
        const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
          const loadedHabits: Habit[] = [];
          snapshot.forEach((docSnap) => {
            loadedHabits.push({ id: docSnap.id, ...docSnap.data() } as Habit);
          });
          setHabits(loadedHabits);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, habitsPath);
        });

        const sessionsPath = `users/${firebaseUser.uid}/sessions`;
        const sessionsQuery = query(collection(db, 'users', firebaseUser.uid, 'sessions'), orderBy('createdAt', 'desc'));
        const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
          const loadedSessions: FocusSession[] = [];
          snapshot.forEach((docSnap) => {
            loadedSessions.push({ id: docSnap.id, ...docSnap.data() } as FocusSession);
          });
          setSessions(loadedSessions);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, sessionsPath);
        });

        setLoading(false);

        return () => {
          unsubscribeTasks();
          unsubscribeHabits();
          unsubscribeSessions();
        };
      } else {
        setUser(null);
        setProfile(null);
        setTasks([]);
        setHabits([]);
        setSessions([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isDemo]);

  // Synchronize Demo state to localStorage
  useEffect(() => {
    if (isDemo && !loading) {
      localStorage.setItem('deadlineai_demo_tasks', JSON.stringify(tasks));
      localStorage.setItem('deadlineai_demo_habits', JSON.stringify(habits));
      localStorage.setItem('deadlineai_demo_sessions', JSON.stringify(sessions));
      if (profile) {
        localStorage.setItem('deadlineai_demo_profile', JSON.stringify(profile));
      }
    }
  }, [tasks, habits, sessions, profile, isDemo, loading]);

  // Login methods
  const login = async () => {
    try {
      setLoading(true);
      setIsDemo(false);
      localStorage.setItem('deadlineai_is_guest', 'false');
      await signInWithGoogle();
      showToast('Successfully logged in with Google!', 'success');
    } catch (err) {
      setLoading(false);
      showToast('Sign in failed. Loading Guest Demo Mode.', 'info');
      loginAsGuest();
    }
  };

  const loginAsGuest = () => {
    setLoading(true);
    setIsDemo(true);
    localStorage.setItem('deadlineai_is_guest', 'true');
  };

  const logout = async () => {
    try {
      if (isDemo) {
        setIsDemo(false);
        localStorage.setItem('deadlineai_is_guest', 'false');
        setUser(null);
        setProfile(null);
        showToast('Successfully exited Guest Mode.', 'success');
      } else {
        await signOutUser();
        showToast('Successfully signed out.', 'success');
      }
    } catch (err) {
      showToast('Sign out failed.', 'error');
    }
  };

  // Firestore & local operations
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completed'>): Promise<string> => {
    const newId = Math.random().toString(36).substring(2, 9);
    const nowStr = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: newId,
      completed: false,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    if (isDemo) {
      setTasks((prev) => [newTask, ...prev]);
      showToast('Task added in Guest Mode!', 'success');
      return newId;
    } else if (user) {
      const docPath = `users/${user.uid}/tasks/${newId}`;
      const docRef = doc(db, 'users', user.uid, 'tasks', newId);
      try {
        await setDoc(docRef, newTask);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
      showToast('Task synchronized to Cloud Firestore!', 'success');
      return newId;
    }
    return '';
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const nowStr = new Date().toISOString();
    
    if (isDemo) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: nowStr } : t))
      );
      showToast('Task updated!', 'success');
    } else if (user) {
      const docPath = `users/${user.uid}/tasks/${taskId}`;
      const docRef = doc(db, 'users', user.uid, 'tasks', taskId);
      try {
        await updateDoc(docRef, { ...updates, updatedAt: nowStr });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    if (isDemo) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('Task removed.', 'success');
    } else if (user) {
      const docPath = `users/${user.uid}/tasks/${taskId}`;
      const docRef = doc(db, 'users', user.uid, 'tasks', taskId);
      try {
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
      showToast('Task removed from Cloud.', 'success');
    }
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    // Calculate overall completion percent and maybe sound check?
    await updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const completeTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const completed = !task.completed;
    await updateTask(taskId, {
      completed,
      completedAt: completed ? new Date().toISOString() : null,
    });

    if (completed) {
      showToast('Task completed! Excellent work.', 'success');
    }
  };

  const addHabit = async (name: string, icon: string) => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newHabit: Habit = {
      id: newId,
      name,
      icon,
      streak: 0,
      lastCompleted: '',
      createdAt: new Date().toISOString(),
    };

    if (isDemo) {
      setHabits((prev) => [newHabit, ...prev]);
      showToast('Habit added in Guest Mode!', 'success');
    } else if (user) {
      const docPath = `users/${user.uid}/habits/${newId}`;
      const docRef = doc(db, 'users', user.uid, 'habits', newId);
      try {
        await setDoc(docRef, newHabit);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
      showToast('Habit synchronized to Firestore!', 'success');
    }
  };

  const toggleHabit = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const isCompletedToday = habit.lastCompleted === todayStr;

    let newStreak = habit.streak;
    let newLastCompleted = '';

    if (isCompletedToday) {
      // Toggle off
      newStreak = Math.max(0, habit.streak - 1);
      newLastCompleted = '';
      showToast('Habit un-checked.', 'info');
    } else {
      // Toggle on
      const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (habit.lastCompleted === yesterdayStr || habit.lastCompleted === '') {
        newStreak = habit.streak + 1;
      } else {
        // Streak reset if missed a day
        newStreak = 1;
      }
      newLastCompleted = todayStr;
      showToast('Habit done today! 🔥 Streak increased.', 'success');
    }

    if (isDemo) {
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, streak: newStreak, lastCompleted: newLastCompleted } : h))
      );
      if (newStreak > (profile?.longestStreak || 0)) {
        setProfile((prev) => prev ? { ...prev, longestStreak: newStreak } : null);
      }
    } else if (user) {
      const habitPath = `users/${user.uid}/habits/${habitId}`;
      const docRef = doc(db, 'users', user.uid, 'habits', habitId);
      try {
        await updateDoc(docRef, { streak: newStreak, lastCompleted: newLastCompleted });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, habitPath);
      }
      
      if (newStreak > (profile?.longestStreak || 0)) {
        const profilePath = `users/${user.uid}`;
        const profileRef = doc(db, 'users', user.uid);
        try {
          await updateDoc(profileRef, { longestStreak: newStreak });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, profilePath);
        }
        setProfile((prev) => prev ? { ...prev, longestStreak: newStreak } : null);
      }
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (isDemo) {
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      showToast('Habit removed.', 'success');
    } else if (user) {
      const docPath = `users/${user.uid}/habits/${habitId}`;
      const docRef = doc(db, 'users', user.uid, 'habits', habitId);
      try {
        await deleteDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
      showToast('Habit removed.', 'success');
    }
  };

  const addFocusSession = async (minutes: number, tasksWorkedOn: string[]) => {
    const newId = Math.random().toString(36).substring(2, 9);
    const todayStr = new Date().toISOString().split('T')[0];
    const newSession: FocusSession = {
      id: newId,
      date: todayStr,
      focusMinutes: minutes,
      tasksWorkedOn,
      createdAt: new Date().toISOString(),
    };

    if (isDemo) {
      setSessions((prev) => [newSession, ...prev]);
      setProfile((prev) =>
        prev ? { ...prev, totalFocusMinutes: prev.totalFocusMinutes + minutes } : null
      );
      showToast(`Logged ${minutes}m focus block! 🔥`, 'success');
    } else if (user) {
      const sessionPath = `users/${user.uid}/sessions/${newId}`;
      const docRef = doc(db, 'users', user.uid, 'sessions', newId);
      try {
        await setDoc(docRef, newSession);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, sessionPath);
      }

      const profilePath = `users/${user.uid}`;
      const profileRef = doc(db, 'users', user.uid);
      const currentMinutes = profile?.totalFocusMinutes || 0;
      try {
        await updateDoc(profileRef, { totalFocusMinutes: currentMinutes + minutes });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, profilePath);
      }
      
      setProfile((prev) =>
        prev ? { ...prev, totalFocusMinutes: prev.totalFocusMinutes + minutes } : null
      );
      showToast(`Logged ${minutes}m focus block! 🔥`, 'success');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        tasks,
        habits,
        sessions,
        isDemo,
        loading,
        login,
        loginAsGuest,
        logout,
        addTask,
        updateTask,
        deleteTask,
        toggleSubtask,
        completeTask,
        addHabit,
        toggleHabit,
        deleteHabit,
        addFocusSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
