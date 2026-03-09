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
  time: string; // HH:mm start time
  timeEnd: string; // HH:mm end time (optional, can be empty)
  date: string; // yyyy-MM-dd
  completed: boolean;
  createdAt: string;
}
