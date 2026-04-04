import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { startOfMonth, endOfMonth, format, isSameDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns 0-indexed day positions that are "suggested" for this goal count */
export function getSuggestedDays(goalDays: number): number[] {
  if (goalDays >= 7) return [0, 1, 2, 3, 4, 5, 6];
  const indices: number[] = [];
  for (let i = 0; i < goalDays; i++) {
    indices.push(Math.round(i * 7 / goalDays));
  }
  return indices;
}

/**
 * Returns the fixed 7-day block for a given date within its month.
 * Blocks: 1-7, 8-14, 15-21, 22-end of month.
 */
export function getFixedWeekDays(date: Date): Date[] {
  const dayOfMonth = date.getDate();
  const weekIndex = Math.floor((dayOfMonth - 1) / 7);
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDay = weekIndex * 7 + 1;

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monthStart);
    d.setDate(startDay + i);
    if (d > monthEnd) break;
    days.push(d);
  }
  return days;
}

/**
 * Returns the previous fixed week block relative to the current one.
 */
export function getPreviousFixedWeekDays(date: Date): Date[] {
  const dayOfMonth = date.getDate();
  const weekIndex = Math.floor((dayOfMonth - 1) / 7);

  if (weekIndex > 0) {
    const prev = new Date(date);
    prev.setDate((weekIndex - 1) * 7 + 1);
    return getFixedWeekDays(prev);
  } else {
    const prevMonthEnd = new Date(startOfMonth(date));
    prevMonthEnd.setDate(0);
    const prevWeekIndex = Math.floor((prevMonthEnd.getDate() - 1) / 7);
    const d = new Date(prevMonthEnd);
    d.setDate(prevWeekIndex * 7 + 1);
    return getFixedWeekDays(d);
  }
}
