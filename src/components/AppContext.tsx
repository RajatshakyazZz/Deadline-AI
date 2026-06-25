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
import { auth, db, signInWithGoogle, signOutUser, OperationType, handleFirestoreError, getGoogleRedirectToken } from '../firebase';
import { Task, Habit, FocusSession, UserProfile, Subtask, ScheduleBlock, ComplexityType, CategoryType } from '../types';
import { useToast } from './Toast';
import { createCalendarEvent } from '../services/googleCalendar';

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
  toggleHabit: (habitId: string, customDateStr?: string) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  addFocusSession: (minutes: number, tasksWorkedOn: string[]) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  googleAccessToken: string | null;
  connectGoogleCalendar: () => Promise<string | null>;
  syncTaskToGoogleCalendar: (taskId: string) => Promise<void>;
  importGoogleCalendarEvent: (event: any) => Promise<void>;
  isAddTaskOpen: boolean;
  setIsAddTaskOpen: (open: boolean) => void;
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

const getRelativeDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const MOCK_HABITS: Habit[] = [
  { 
    id: 'h1', 
    name: '4L Water Daily', 
    icon: '💧', 
    streak: 5, 
    lastCompleted: getRelativeDateStr(0), 
    completedDates: [getRelativeDateStr(0), getRelativeDateStr(1), getRelativeDateStr(2), getRelativeDateStr(3), getRelativeDateStr(4)],
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'h2', 
    name: '5 Hrs Study Daily', 
    icon: '📚', 
    streak: 3, 
    lastCompleted: getRelativeDateStr(0), 
    completedDates: [getRelativeDateStr(0), getRelativeDateStr(1), getRelativeDateStr(2)],
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'h3', 
    name: '1 Hr Workout Daily', 
    icon: '💪', 
    streak: 1, 
    lastCompleted: getRelativeDateStr(0), 
    completedDates: [getRelativeDateStr(0)],
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'h4', 
    name: 'Take Bath Daily', 
    icon: '🚿', 
    streak: 5, 
    lastCompleted: getRelativeDateStr(0), 
    completedDates: [getRelativeDateStr(0), getRelativeDateStr(1), getRelativeDateStr(2), getRelativeDateStr(3), getRelativeDateStr(4)],
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'h5', 
    name: 'Wake up at 6am', 
    icon: '⏰', 
    streak: 1, 
    lastCompleted: getRelativeDateStr(0), 
    completedDates: [getRelativeDateStr(0)],
    createdAt: new Date().toISOString() 
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
  
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    return localStorage.getItem('deadlineai_is_guest') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Authentication observer
  useEffect(() => {
    let unsubscribeTasks: (() => void) | null = null;
    let unsubscribeHabits: (() => void) | null = null;
    let unsubscribeSessions: (() => void) | null = null;

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

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous collection listeners to prevent memory leaks/multiple callbacks
      if (unsubscribeTasks) { unsubscribeTasks(); unsubscribeTasks = null; }
      if (unsubscribeHabits) { unsubscribeHabits(); unsubscribeHabits = null; }
      if (unsubscribeSessions) { unsubscribeSessions(); unsubscribeSessions = null; }

      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.setItem('deadlineai_has_authenticated', 'true');
        
        // Retrieve redirect access token for Google Workspace/Calendar if present
        getGoogleRedirectToken().then((token) => {
          if (token) {
            setGoogleAccessToken(token);
          }
        });
        
        // 1. Instantly load cached offline data from localStorage for near-zero loading times!
        const cachedProfile = localStorage.getItem(`deadlineai_profile_${firebaseUser.uid}`);
        const cachedTasks = localStorage.getItem(`deadlineai_tasks_${firebaseUser.uid}`);
        const cachedHabits = localStorage.getItem(`deadlineai_habits_${firebaseUser.uid}`);
        const cachedSessions = localStorage.getItem(`deadlineai_sessions_${firebaseUser.uid}`);

        const fallbackProfile: UserProfile = {
          name: firebaseUser.displayName || 'Developer',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          createdAt: new Date().toISOString(),
          totalFocusMinutes: 0,
          longestStreak: 0,
        };

        if (cachedProfile) {
          try { setProfile(JSON.parse(cachedProfile)); } catch (e) {}
        } else {
          // Instantly set optimistic profile to make first-time logins/signups snappy and seamless!
          setProfile(fallbackProfile);
        }
        if (cachedTasks) {
          try { setTasks(JSON.parse(cachedTasks)); } catch (e) {}
        }
        if (cachedHabits) {
          try { setHabits(JSON.parse(cachedHabits)); } catch (e) {}
        }
        if (cachedSessions) {
          try { setSessions(JSON.parse(cachedSessions)); } catch (e) {}
        }

        // Set loading false IMMEDIATELY to avoid locking the user behind an intro screen
        setLoading(false);

        // 2. Load and provision user profile from Firestore asynchronously
        const profileRef = doc(db, 'users', firebaseUser.uid);
        getDoc(profileRef).then((profileSnap) => {
          let initialProfile: UserProfile | null = null;
          if (!profileSnap.exists()) {
            initialProfile = {
              name: firebaseUser.displayName || 'Developer',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
              createdAt: new Date().toISOString(),
              totalFocusMinutes: 0,
              longestStreak: 0,
            };
            setDoc(profileRef, initialProfile).catch((error) => {
              console.warn("Failed to set new profile in Firestore (offline?):", error);
            });
          } else {
            initialProfile = profileSnap.data() as UserProfile;
          }
          if (initialProfile) {
            setProfile(initialProfile);
            localStorage.setItem(`deadlineai_profile_${firebaseUser.uid}`, JSON.stringify(initialProfile));
          }
        }).catch((error) => {
          console.warn("Failed to get profile from Firestore, using cache or fallback:", error);
          if (!cachedProfile) {
            const fallbackProfile: UserProfile = {
              name: firebaseUser.displayName || 'Developer',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
              createdAt: new Date().toISOString(),
              totalFocusMinutes: 0,
              longestStreak: 0,
            };
            setProfile(fallbackProfile);
          }
        });

        // 3. Setup real-time listeners for data collections (will update UI asynchronously as they arrive)
        const tasksPath = `users/${firebaseUser.uid}/tasks`;
        const tasksQuery = query(collection(db, 'users', firebaseUser.uid, 'tasks'), orderBy('createdAt', 'desc'));
        unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
          const loadedTasks: Task[] = [];
          snapshot.forEach((docSnap) => {
            loadedTasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
          });
          setTasks(loadedTasks);
          localStorage.setItem(`deadlineai_tasks_${firebaseUser.uid}`, JSON.stringify(loadedTasks));
        }, (error) => {
          console.warn(`Firestore tasks subscription error (${tasksPath}), loading cached:`, error);
          const cached = localStorage.getItem(`deadlineai_tasks_${firebaseUser.uid}`);
          if (cached) {
            try { setTasks(JSON.parse(cached)); } catch (e) {}
          }
        });

        const habitsPath = `users/${firebaseUser.uid}/habits`;
        const habitsQuery = query(collection(db, 'users', firebaseUser.uid, 'habits'), orderBy('createdAt', 'desc'));
        unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
          const loadedHabits: Habit[] = [];
          snapshot.forEach((docSnap) => {
            loadedHabits.push({ id: docSnap.id, ...docSnap.data() } as Habit);
          });
          setHabits(loadedHabits);
          localStorage.setItem(`deadlineai_habits_${firebaseUser.uid}`, JSON.stringify(loadedHabits));
        }, (error) => {
          console.warn(`Firestore habits subscription error (${habitsPath}), loading cached:`, error);
          const cached = localStorage.getItem(`deadlineai_habits_${firebaseUser.uid}`);
          if (cached) {
            try { setHabits(JSON.parse(cached)); } catch (e) {}
          }
        });

        const sessionsPath = `users/${firebaseUser.uid}/sessions`;
        const sessionsQuery = query(collection(db, 'users', firebaseUser.uid, 'sessions'), orderBy('createdAt', 'desc'));
        unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
          const loadedSessions: FocusSession[] = [];
          snapshot.forEach((docSnap) => {
            loadedSessions.push({ id: docSnap.id, ...docSnap.data() } as FocusSession);
          });
          setSessions(loadedSessions);
          localStorage.setItem(`deadlineai_sessions_${firebaseUser.uid}`, JSON.stringify(loadedSessions));
        }, (error) => {
          console.warn(`Firestore sessions subscription error (${sessionsPath}), loading cached:`, error);
          const cached = localStorage.getItem(`deadlineai_sessions_${firebaseUser.uid}`);
          if (cached) {
            try { setSessions(JSON.parse(cached)); } catch (e) {}
          }
        });

      } else {
        setUser(null);
        setProfile(null);
        setTasks([]);
        setHabits([]);
        setSessions([]);
        localStorage.removeItem('deadlineai_has_authenticated');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeHabits) unsubscribeHabits();
      if (unsubscribeSessions) unsubscribeSessions();
    };
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
      const res = await signInWithGoogle();
      if (res && res.token) {
        setGoogleAccessToken(res.token);
      }
      localStorage.setItem('deadlineai_has_authenticated', 'true');
      showToast('Successfully logged in with Google!', 'success');
    } catch (err) {
      console.error('Login failed:', err);
      showToast('Sign in failed. Loading Guest Demo Mode.', 'info');
      loginAsGuest();
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = () => {
    setLoading(true);
    setIsDemo(true);
    localStorage.setItem('deadlineai_is_guest', 'true');
  };

  const logout = async () => {
    try {
      setGoogleAccessToken(null);
      localStorage.removeItem('deadlineai_has_authenticated');
      localStorage.removeItem('deadlineai_is_guest');
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

  // Google Calendar methods
  const connectGoogleCalendar = async (): Promise<string | null> => {
    try {
      const res = await signInWithGoogle();
      if (res && res.token) {
        setGoogleAccessToken(res.token);
        showToast('Google Calendar connected!', 'success');
        return res.token;
      }
      return null;
    } catch (err) {
      console.error('Failed to connect Google Calendar:', err);
      showToast('Failed to connect Google Calendar.', 'error');
      return null;
    }
  };

  const syncTaskToGoogleCalendar = async (taskId: string) => {
    let token = googleAccessToken;
    if (!token) {
      token = await connectGoogleCalendar();
    }
    if (!token) {
      showToast('Google Calendar authentication required.', 'error');
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      showToast('Syncing task with Google Calendar...', 'info');
      const eventId = await createCalendarEvent(token, task);
      await updateTask(taskId, { googleEventId: eventId });
      showToast('Task synchronized with Google Calendar!', 'success');
    } catch (error) {
      console.error('Failed to sync to Google Calendar:', error);
      showToast('Sync failed. Please ensure permission is granted.', 'error');
    }
  };

  const importGoogleCalendarEvent = async (event: any) => {
    const deadline = event.end?.dateTime || event.end?.date || new Date().toISOString();
    
    const taskData = {
      title: event.summary || 'Google Calendar Event',
      deadline: new Date(deadline).toISOString(),
      category: 'personal' as CategoryType,
      context: event.description || `Imported from Google Calendar.\nLink: ${event.htmlLink || ''}`,
      complexity: 'medium' as ComplexityType,
      estimatedHours: 1.0,
      urgencyScore: 5,
      summary: event.description ? (event.description.length > 80 ? event.description.substring(0, 80) + '...' : event.description) : 'Imported from Google Calendar',
      subtasks: [],
      schedule: [],
      riskFactors: [],
      aiRecommendation: 'Schedule focused time block prior to deadline.',
      googleEventId: event.id
    };

    const newId = await addTask(taskData);
    if (newId) {
      showToast('Event successfully imported as task!', 'success');
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
        showToast('Task synchronized to Cloud Firestore!', 'success');

        // Auto-sync to Google Calendar if enabled
        if (profile?.googleCalendarSyncEnabled && googleAccessToken) {
          try {
            const eventId = await createCalendarEvent(googleAccessToken, newTask);
            await updateDoc(docRef, { googleEventId: eventId, updatedAt: new Date().toISOString() });
          } catch (gcalError) {
            console.error('Failed to auto-sync task to Google Calendar:', gcalError);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
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
      completedDates: [],
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

  const toggleHabit = async (habitId: string, customDateStr?: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const targetDateStr = customDateStr || todayStr;

    // Ensure completedDates exists
    const completedDates = habit.completedDates ? [...habit.completedDates] : (habit.lastCompleted ? [habit.lastCompleted] : []);
    const isCompletedOnDate = completedDates.includes(targetDateStr);

    let newCompletedDates = [...completedDates];
    let newLastCompleted = habit.lastCompleted;

    if (isCompletedOnDate) {
      newCompletedDates = newCompletedDates.filter((d) => d !== targetDateStr);
      if (newLastCompleted === targetDateStr) {
        const remainingDates = newCompletedDates.filter((d) => d !== targetDateStr);
        if (remainingDates.length > 0) {
          newLastCompleted = remainingDates.sort().reverse()[0];
        } else {
          newLastCompleted = '';
        }
      }
      showToast('Habit un-checked for this date.', 'info');
    } else {
      if (!newCompletedDates.includes(targetDateStr)) {
        newCompletedDates.push(targetDateStr);
      }
      newCompletedDates.sort();
      newLastCompleted = newCompletedDates[newCompletedDates.length - 1];
      showToast(`Habit completed! Streak refreshed.`, 'success');
    }

    // Dynamic streak calculation based on backward continuous completion from today or the latest completed date
    let newStreak = 0;
    if (newCompletedDates.length > 0) {
      const sortedUniqueDates = Array.from(new Set(newCompletedDates)).sort();
      
      // Let's check yesterday and today.
      const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const hasToday = sortedUniqueDates.includes(todayStr);
      const hasYesterday = sortedUniqueDates.includes(yesterdayStr);

      if (hasToday || hasYesterday) {
        let currentDay = hasToday ? new Date(todayStr) : new Date(yesterdayStr);
        while (true) {
          const currentDayStr = currentDay.toISOString().split('T')[0];
          if (sortedUniqueDates.includes(currentDayStr)) {
            newStreak++;
            currentDay.setDate(currentDay.getDate() - 1);
          } else {
            break;
          }
        }
      } else {
        // If they did not do it today or yesterday, find the streak starting from the latest completed day backwards
        const latestCompleted = sortedUniqueDates[sortedUniqueDates.length - 1];
        let currentDay = new Date(latestCompleted);
        while (true) {
          const currentDayStr = currentDay.toISOString().split('T')[0];
          if (sortedUniqueDates.includes(currentDayStr)) {
            newStreak++;
            currentDay.setDate(currentDay.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    if (isDemo) {
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, streak: newStreak, lastCompleted: newLastCompleted, completedDates: newCompletedDates } : h))
      );
      if (newStreak > (profile?.longestStreak || 0)) {
        setProfile((prev) => prev ? { ...prev, longestStreak: newStreak } : null);
      }
    } else if (user) {
      const habitPath = `users/${user.uid}/habits/${habitId}`;
      const docRef = doc(db, 'users', user.uid, 'habits', habitId);
      try {
        await updateDoc(docRef, { 
          streak: newStreak, 
          lastCompleted: newLastCompleted,
          completedDates: newCompletedDates
        });
        
        // Also update local habits state
        setHabits((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, streak: newStreak, lastCompleted: newLastCompleted, completedDates: newCompletedDates } : h))
        );
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

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    if (isDemo) {
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h))
      );
      showToast('Habit updated.', 'success');
    } else if (user) {
      const habitPath = `users/${user.uid}/habits/${habitId}`;
      const docRef = doc(db, 'users', user.uid, 'habits', habitId);
      try {
        await updateDoc(docRef, updates);
        setHabits((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h))
        );
        showToast('Habit updated.', 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, habitPath);
      }
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

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (isDemo) {
      setProfile((prev) => {
        if (!prev) return null;
        const newProfile = { ...prev, ...updates };
        localStorage.setItem('deadlineai_demo_profile', JSON.stringify(newProfile));
        return newProfile;
      });
      showToast('Profile updated!', 'success');
    } else if (user) {
      const docPath = `users/${user.uid}`;
      const docRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(docRef, updates);
        setProfile((prev) => prev ? { ...prev, ...updates } : null);
        showToast('Profile updated!', 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      }
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
        updateHabit,
        deleteHabit,
        addFocusSession,
        updateProfile,
        googleAccessToken,
        connectGoogleCalendar,
        syncTaskToGoogleCalendar,
        importGoogleCalendarEvent,
        isAddTaskOpen,
        setIsAddTaskOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
