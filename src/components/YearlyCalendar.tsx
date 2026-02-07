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
  super_happy: "bg-emerald-400 text-emerald-950",
  happy: "bg-green-400 text-green-950",
  neutral: "bg-amber-400 text-amber-950",
  sad: "bg-orange-500 text-white",
  depressed: "bg-red-500 text-white",
};

const dayHeaders = ["S", "M", "T", "W", "T", "F", "S"];

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
    <div className="glass-card p-4 animate-fade-in space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground text-center">{currentYear} Mood Calendar</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month) => {
          const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
          const firstDayOffset = getDay(days[0]);
          return (
            <div key={month.toISOString()} className="border border-border/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground text-center">
                {format(month, "MMMM")}
              </p>
              <div className="grid grid-cols-7 gap-1">
                {dayHeaders.map((d, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground font-medium text-center">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const note = notesByDate[dateStr];
                  const isFuture = isAfter(day, today) && !isSameDay(day, today);
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, today);
                  const colorClass = note
                    ? moodColors[note.mood as MoodType]
                    : "bg-secondary/40 text-muted-foreground";

                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isFuture && onSelectDate(day)}
                      disabled={isFuture}
                      title={`${format(day, "MMM d")}${note ? ` - ${note.mood}` : ""}`}
                      className={`aspect-square rounded-md text-[11px] font-medium flex items-center justify-center transition-all
                        ${colorClass}
                        ${isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-110 hover:z-10"}
                        ${isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background scale-110 z-10" : ""}
                        ${isToday && !note ? "border border-primary/60" : ""}
                      `}
                    >
                      {format(day, "d")}
                    </button>
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
