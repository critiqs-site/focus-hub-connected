export interface Todo {
  id: string;
  text: string;
  description?: string | null;
  dividerId: string;
  icon: string;
  createdAt: string;
  completions: string[];
  pinned?: boolean;
  order: number;
  goalDaysPerWeek: number;
  targetAmount?: number | null;
  targetUnit?: string | null;
  color?: string | null;
}

export interface Divider {
  id: string;
  name: string;
  icon: string;
}

export interface ScheduledEvent {
  id: string;
  title: string;
  description: string;
  time: string;
  timeEnd: string;
  date: string;
  completed: boolean;
  createdAt: string;
}

export interface DailyReminder {
  id: string;
  text: string;
  createdAt: string;
}
