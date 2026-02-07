export interface Todo {
  id: string;
  text: string;
  dividerId: string;
  icon: string;
  createdAt: string;
  completions: string[];
}

export interface Divider {
  id: string;
  name: string;
  icon: string;
}

export type MoodType =
  | "super_happy"
  | "happy"
  | "neutral"
  | "sad"
  | "depressed";

export interface MoodNote {
  id: string;
  date: string;
  mood: MoodType;
  note: string;
  createdAt: string;
}
