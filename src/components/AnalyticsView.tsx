import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, startOfDay, isSameDay, isSameMonth } from "date-fns";
import { Flame, Target, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import type { Todo } from "@/types/todo";

interface AnalyticsViewProps {
  todos: Todo[];
}

const AnalyticsView = ({ todos }: AnalyticsViewProps) => {
  const [viewMonth, setViewMonth] = useState(new Date());
  const today = startOfDay(new Date());

  const calculateDailyPercentage = (date: Date): number => {
    if (todos.length === 0) return 0;
    const dateStr = format(date, "yyyy-MM-dd");
    const completedCount = todos.filter(todo => todo.completions.includes(dateStr)).length;
    return Math.round((completedCount / todos.length) * 100);
  };

  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDow = monthStart.getDay();
    return { days, startDow, monthStart, monthEnd };
  }, [viewMonth]);

  const stats = useMemo(() => {
    const monthDays = calendarData.days.filter(d => !isAfter(d, today));
    const completedDays = monthDays.filter(d => calculateDailyPercentage(d) > 0).length;
    const totalCompletions = monthDays.reduce((sum, d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      return sum + todos.filter(t => t.completions.includes(dateStr)).length;
    }, 0);
    const totalPossible = monthDays.length * todos.length;
    const completionRate = totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0;

    let streak = 0;
    let checkDate = today;
    for (let i = 0; i < 365; i++) {
      if (calculateDailyPercentage(checkDate) > 0) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else break;
    }

    const todayStr = format(today, "yyyy-MM-dd");
    const todayDone = todos.filter(t => t.completions.includes(todayStr)).length;

    return { completedDays, completionRate, streak, todayDone, totalTodos: todos.length };
  }, [calendarData, todos, today]);

  // Bar chart data
  const barChartData = useMemo(() => {
    const monthDays = calendarData.days.filter(d => !isAfter(d, today));
    return monthDays.map(d => ({
      day: format(d, "d"),
      pct: calculateDailyPercentage(d),
      isToday: isSameDay(d, today),
    }));
  }, [calendarData, todos, today]);

  const glassStyle = {
    background: 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.08) 0%, hsla(0, 0%, 100%, 0.02) 100%)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid hsla(0, 0%, 100%, 0.12)',
    boxShadow: 'inset 0 1px 1px hsla(0, 0%, 100%, 0.1), 0 8px 32px hsla(0, 0%, 0%, 0.4)',
  };

  const getHeatColor = (pct: number): string => {
    if (pct === 0) return 'hsla(0, 0%, 100%, 0.04)';
    if (pct <= 25) return 'hsl(var(--primary) / 0.15)';
    if (pct <= 50) return 'hsl(var(--primary) / 0.3)';
    if (pct <= 75) return 'hsl(var(--primary) / 0.5)';
    return 'hsl(var(--primary) / 0.75)';
  };

  if (todos.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl animate-fade-in" style={glassStyle}>
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">No habits to track yet</p>
        <p className="text-sm text-muted-foreground">Add habits to see your progress analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl text-center" style={glassStyle}>
          <Flame className="h-5 w-5 mx-auto mb-2" style={{ color: '#FFD700' }} />
          <div className="text-3xl font-bold" style={{ color: '#FFD700' }}>{stats.streak}</div>
          <div className="text-xs text-muted-foreground">Day Streak</div>
        </div>
        <div className="p-4 rounded-2xl text-center" style={glassStyle}>
          <Target className="h-5 w-5 text-primary mx-auto mb-2" />
          <div className="text-3xl font-bold text-primary">{stats.completionRate}%</div>
          <div className="text-xs text-muted-foreground">Completion Rate</div>
        </div>
        <div className="p-4 rounded-2xl text-center" style={glassStyle}>
          <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-2" />
          <div className="text-3xl font-bold text-foreground">{stats.todayDone}/{stats.totalTodos}</div>
          <div className="text-xs text-muted-foreground">Today</div>
        </div>
        <div className="p-4 rounded-2xl text-center" style={glassStyle}>
          <div className="text-2xl mb-2">📅</div>
          <div className="text-3xl font-bold text-foreground">{stats.completedDays}</div>
          <div className="text-xs text-muted-foreground">Active Days</div>
        </div>
      </div>

      {/* Calendar heatmap */}
      <div className="p-6 rounded-2xl" style={glassStyle}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-lg font-semibold text-foreground">{format(viewMonth, "MMMM yyyy")}</h3>
          <button onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            disabled={isSameMonth(viewMonth, today)}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: calendarData.startDow }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {calendarData.days.map(day => {
            const isFuture = isAfter(day, today);
            const pct = isFuture ? 0 : calculateDailyPercentage(day);
            const isToday_ = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                  isToday_ ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                } ${isFuture ? 'opacity-30' : ''}`}
                style={{ background: getHeatColor(pct) }}
                title={`${format(day, "MMM d")}: ${pct}%`}
              >
                <span className={`text-xs font-medium ${pct > 50 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {format(day, "d")}
                </span>
                {pct > 0 && !isFuture && (
                  <span className="text-[8px] text-foreground/70">{pct}%</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {[0, 25, 50, 75, 100].map(v => (
            <div key={v} className="w-4 h-4 rounded" style={{ background: getHeatColor(v) }} />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      {barChartData.length > 0 && (
        <div className="p-6 rounded-2xl" style={glassStyle}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Completion</h3>
          <div className="flex items-end gap-[2px] h-32">
            {barChartData.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 min-h-[2px] ${bar.isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-background' : ''}`}
                  style={{
                    height: `${Math.max(bar.pct, 2)}%`,
                    background: bar.pct > 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.1)',
                    opacity: bar.pct > 0 ? 0.5 + (bar.pct / 200) : 0.2,
                  }}
                  title={`Day ${bar.day}: ${bar.pct}%`}
                />
                {(parseInt(bar.day) === 1 || parseInt(bar.day) % 5 === 0 || bar.isToday) && (
                  <span className={`text-[8px] mt-1 ${bar.isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{bar.day}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;