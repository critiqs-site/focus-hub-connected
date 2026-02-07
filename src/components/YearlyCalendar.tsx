import { useMemo } from "react";
import {
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
  isSameDay,
  isAfter,
} from "date-fns";
import type { MoodNote, MoodType } from "@/types/todo";

interface YearlyCalendarProps {
  notes: MoodNote[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  year?: number;
}

const moodColors: Record<MoodType, string> = {
  super_happy: "bg-emerald-400",
  happy: "bg-green-400",
  neutral: "bg-amber-400",
  sad: "bg-orange-500",
  depressed: "bg-red-500",
};

const YearlyCalendar = ({ notes, selectedDate, onSelectDate, year }: YearlyCalendarProps) => {
  const currentYear = year ?? new Date().getFullYear();
  const today = new Date();

  const notesByDate = useMemo(() => {
    const map: Record<string, MoodNote> = {};
    for (const n of notes) map[n.date] = n;
    return map;
  }, [notes]);

  const months = useMemo(
    () => eachMonthOfInterval({ start: startOfYear(new Date(currentYear, 0, 1)), end: endOfYear(new Date(currentYear, 0, 1)) }),
    [currentYear]
  );

  return (
    <div className="glass-card p-4 animate-fade-in space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground text-center">{currentYear} Mood Calendar</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {months.map((month) => {
          const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
          const firstDayOffset = getDay(days[0]); // 0=Sun
          return (
            <div key={month.toISOString()} className="space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium text-center">
                {format(month, "MMM")}
              </p>
              <div className="grid grid-cols-7 gap-[2px]">
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`pad-${i}`} className="w-3 h-3" />
                ))}
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const note = notesByDate[dateStr];
                  const isFuture = isAfter(day, today) && !isSameDay(day, today);
                  const isSelected = isSameDay(day, selectedDate);
                  const colorClass = note ? moodColors[note.mood as MoodType] : "bg-secondary/40";

                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isFuture && onSelectDate(day)}
                      disabled={isFuture}
                      title={`${format(day, "MMM d")}${note ? ` - ${note.mood}` : ""}`}
                      className={`w-3 h-3 rounded-[2px] transition-all ${colorClass} ${
                        isFuture ? "opacity-20 cursor-not-allowed" : "cursor-pointer hover:scale-150 hover:z-10"
                      } ${isSelected ? "ring-1 ring-primary ring-offset-1 ring-offset-background scale-150 z-10" : ""}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YearlyCalendar;
