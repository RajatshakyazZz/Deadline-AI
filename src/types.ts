export type ComplexityType = 'low' | 'medium' | 'high' | 'critical';
export type CategoryType = 'assignment' | 'meeting' | 'project' | 'personal' | 'payment' | 'interview' | 'other';
export type SubtaskPriority = 'must' | 'should' | 'nice';

export interface UserProfile {
  name: string;
  email: string;
  photoURL: string;
  createdAt: string;
  totalFocusMinutes: number;
  longestStreak: number;
  googleCalendarSyncEnabled?: boolean;
  crisisModeAutoEnabled?: boolean;
  onboardingGoal?: string;
  xp?: number;
  level?: number;
}

export interface Subtask {
  id: string;
  title: string;
  duration?: string;
  durationMinutes?: number;
  priority: SubtaskPriority;
  tip?: string;
  completed: boolean;
}

export interface TimeBlock {
  time: string;
  task: string;
  duration: string;
}

export interface ScheduleBlock {
  day: string;
  date: string; // YYYY-MM-DD
  blocks: TimeBlock[];
}

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO or datetime-local format
  category: CategoryType;
  context: string;
  complexity: ComplexityType;
  estimatedHours: number;
  urgencyScore: number; // 1-10
  summary: string;
  subtasks: Subtask[];
  schedule: ScheduleBlock[];
  riskFactors: string[];
  aiRecommendation: string;
  completed: boolean;
  completedAt?: string | null;
  googleEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  lastCompleted: string; // YYYY-MM-DD
  createdAt: string;
  completedDates?: string[];
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  tasksWorkedOn: string[]; // task IDs
  createdAt: string;
}

export interface DailyLog {
  tasksCompleted: number;
  focusMinutes: number;
  habitsCompleted: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
