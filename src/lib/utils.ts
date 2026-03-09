import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { startOfMonth, endOfMonth, format, isSameDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const startDay = weekIndex * 7 + 1; // 1, 8, 15, 22

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
    // Previous block in same month
    const prev = new Date(date);
    prev.setDate((weekIndex - 1) * 7 + 1);
    return getFixedWeekDays(prev);
  } else {
    // Last block of previous month
    const prevMonthEnd = new Date(startOfMonth(date));
    prevMonthEnd.setDate(0); // last day of prev month
    const prevWeekIndex = Math.floor((prevMonthEnd.getDate() - 1) / 7);
    const d = new Date(prevMonthEnd);
    d.setDate(prevWeekIndex * 7 + 1);
    return getFixedWeekDays(d);
  }
}
