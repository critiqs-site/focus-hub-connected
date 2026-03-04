import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, Flame, Target, ChevronDown, BarChart3 } from "lucide-react";
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
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null); // null = Overall
  const [showAll, setShowAll] = useState(false);

  const selectedTodo = selectedTodoId ? todos.find(t => t.id === selectedTodoId) || null : null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const today = new Date();

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
      if (i === 0) { tempStreak = 1; } else {
        const prevDate = new Date(allCompletions[i - 1]);
        const currDate = new Date(allCompletions[i]);
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / 86400000);
        tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { completedDays, totalDays, percentage, currentStreak, longestStreak };
  };

  // Overall stats: aggregate across all todos
  const calculateOverallStats = () => {
    if (todos.length === 0) return { completedDays: 0, totalDays: 0, percentage: 0, currentStreak: 0, longestStreak: 0 };
    const totalPossible = daysInMonth.length * todos.length;
    let totalCompleted = 0;
    todos.forEach(todo => {
      totalCompleted += getCompletionsForMonth(todo).length;
    });
    const percentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    // Average current streak
    const avgCurrentStreak = todos.length > 0
      ? Math.round(todos.reduce((sum, t) => sum + calculateStats(t).currentStreak, 0) / todos.length)
      : 0;
    const avgLongestStreak = todos.length > 0
      ? Math.round(todos.reduce((sum, t) => sum + calculateStats(t).longestStreak, 0) / todos.length)
      : 0;

    return { completedDays: totalCompleted, totalDays: totalPossible, percentage, currentStreak: avgCurrentStreak, longestStreak: avgLongestStreak };
  };

  const isOverall = selectedTodoId === null;
  const stats = isOverall ? calculateOverallStats() : (selectedTodo ? calculateStats(selectedTodo) : null);

  // For calendar: overall shows aggregated heat, individual shows single
  const getCalendarCompletions = () => {
    if (isOverall) {
      // Aggregate: a day is "completed" if majority of todos are done
      const dayCounts: Record<string, number> = {};
      todos.forEach(todo => {
        todo.completions.forEach(dateStr => {
          dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
        });
      });
      return Object.keys(dayCounts).filter(dateStr => {
        const date = new Date(dateStr);
        return isSameMonth(date, currentMonth) && dayCounts[dateStr] >= Math.ceil(todos.length / 2);
      });
    }
    return selectedTodo ? getCompletionsForMonth(selectedTodo) : [];
  };

  const calendarCompletions = getCalendarCompletions();

  // Show More logic
  const INITIAL_SHOW = 3;
  const visibleTodos = showAll ? todos : todos.slice(0, INITIAL_SHOW);
  const hasMore = todos.length > INITIAL_SHOW;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Habit selector */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Select Habit</h3>
        <div className="flex flex-wrap gap-2">
          {/* Overall button */}
          <button
            onClick={() => setSelectedTodoId(null)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${
              isOverall
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-secondary/50 text-foreground hover:bg-secondary"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">Overall</span>
          </button>

          {visibleTodos.map((todo) => {
            const Icon = getIconComponent(todo.icon);
            const isSelected = selectedTodoId === todo.id;
            return (
              <button
                key={todo.id}
                onClick={() => setSelectedTodoId(todo.id)}
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

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 rounded-xl flex items-center gap-1 bg-secondary/30 text-muted-foreground hover:bg-secondary/50 transition-all"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
              <span className="text-sm font-medium">{showAll ? "Show Less" : `+${todos.length - INITIAL_SHOW} More`}</span>
            </button>
          )}
        </div>
      </div>

      {stats && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">{stats.percentage}%</div>
              <div className="text-xs text-muted-foreground">Completion Rate</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.currentStreak}</div>
              <div className="text-xs text-muted-foreground">{isOverall ? "Avg Streak" : "Current Streak"}</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">{stats.longestStreak}</div>
              <div className="text-xs text-muted-foreground">{isOverall ? "Avg Best" : "Longest Streak"}</div>
            </div>
          </div>

          {/* Calendar */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-8 w-8">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-semibold text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-8 w-8">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div key={i} className="text-center text-xs text-muted-foreground font-medium py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {daysInMonth.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isCompleted = calendarCompletions.includes(dateStr);
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
                  {stats.completedDays} of {stats.totalDays} {isOverall ? "total completions" : "days completed"}
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
