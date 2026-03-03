import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, addMonths, subMonths } from "date-fns";
import type { Todo, Divider } from "@/types/todo";
import { getIconComponent } from "@/lib/icons";

interface AnalyticsViewProps {
  todos: Todo[];
  dividers: Divider[];
}

const AnalyticsView = ({ todos, dividers }: AnalyticsViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(todos[0] || null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const today = new Date();
  const daysUpToToday = daysInMonth.filter(day =>
    isBefore(day, today) || isToday(day)
  );

  const getCompletionsForMonth = (todo: Todo) => {
    return todo.completions.filter(dateStr => {
      const date = new Date(dateStr);
      return isSameMonth(date, currentMonth);
    });
  };

  const calculateStats = (todo: Todo) => {
    const completions = getCompletionsForMonth(todo);
    const completedDays = completions.length;
    const totalDays = daysInMonth.length;
    const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    let currentStreak = 0;
    const sortedCompletions = [...todo.completions].sort().reverse();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(new Date(today.getTime() - 86400000), 'yyyy-MM-dd');

    if (sortedCompletions.includes(todayStr) || sortedCompletions.includes(yesterdayStr)) {
      for (let i = 0; i < sortedCompletions.length; i++) {
        const expectedDate = format(new Date(today.getTime() - (i * 86400000)), 'yyyy-MM-dd');
        if (sortedCompletions.includes(expectedDate)) {
          currentStreak++;
        } else if (i === 0 && sortedCompletions.includes(yesterdayStr)) {
          continue;
        } else {
          break;
        }
      }
    }

    let longestStreak = 0;
    let tempStreak = 0;
    const allCompletions = [...todo.completions].sort();

    for (let i = 0; i < allCompletions.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(allCompletions[i - 1]);
        const currDate = new Date(allCompletions[i]);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / 86400000);

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { completedDays, totalDays, percentage, currentStreak, longestStreak };
  };

  const selectedStats = selectedTodo ? calculateStats(selectedTodo) : null;
  const selectedCompletions = selectedTodo ? getCompletionsForMonth(selectedTodo) : [];

  const IconComponent = selectedTodo ? getIconComponent(selectedTodo.icon) : Target;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Habit selector */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Select Habit</h3>
        <div className="flex flex-wrap gap-2">
          {todos.map((todo) => {
            const Icon = getIconComponent(todo.icon);
            const isSelected = selectedTodo?.id === todo.id;
            return (
              <button
                key={todo.id}
                onClick={() => setSelectedTodo(todo)}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-secondary/50 text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{todo.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedTodo && selectedStats && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">{selectedStats.percentage}%</div>
              <div className="text-xs text-muted-foreground">Completion Rate</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">{selectedStats.currentStreak}</div>
              <div className="text-xs text-muted-foreground">Current Streak</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">{selectedStats.longestStreak}</div>
              <div className="text-xs text-muted-foreground">Longest Streak</div>
            </div>
          </div>

          {/* Calendar */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-semibold text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="h-8 w-8"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={i} className="text-center text-xs text-muted-foreground font-medium py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {daysInMonth.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isCompleted = selectedCompletions.includes(dateStr);
                const isTodayDate = isToday(day);
                const isFuture = !isBefore(day, today) && !isTodayDate;

                return (
                  <div
                    key={dateStr}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                      ${isFuture ? "opacity-30 text-muted-foreground" : ""}
                      ${isCompleted ? "bg-primary text-primary-foreground" : "bg-secondary/30 text-foreground"}
                      ${isTodayDate ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedStats.completedDays} of {selectedStats.totalDays} days completed
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span className="text-muted-foreground">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {todos.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No habits to analyze yet</p>
          <p className="text-sm text-muted-foreground mt-2">Add some habits to see your progress!</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
