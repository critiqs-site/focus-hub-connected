import { useState, useMemo } from "react";
import { format, subDays, subMonths, startOfMonth, eachDayOfInterval, eachMonthOfInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Target, Minus } from "lucide-react";
import type { Todo } from "@/types/todo";

interface AnalyticsViewProps {
  todos: Todo[];
}

type Period = "weekly" | "monthly" | "yearly";

const AnalyticsView = ({ todos }: AnalyticsViewProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("weekly");

  // Calculate daily completion percentage
  const calculateDailyPercentage = (date: Date, todos: Todo[]): number => {
    if (todos.length === 0) return 0;
    const dateStr = format(date, "yyyy-MM-dd");
    const completedCount = todos.filter(todo => todo.completions.includes(dateStr)).length;
    return Math.round((completedCount / todos.length) * 100);
  };

  // Get chart data based on selected period
  const chartData = useMemo(() => {
    const today = new Date();
    
    if (selectedPeriod === "weekly") {
      const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
      return days.map(day => ({
        label: format(day, "EEE"),
        fullDate: format(day, "MMM d"),
        percentage: calculateDailyPercentage(day, todos),
      }));
    } else if (selectedPeriod === "monthly") {
      const days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));
      return days.map(day => ({
        label: format(day, "d"),
        fullDate: format(day, "MMM d"),
        percentage: calculateDailyPercentage(day, todos),
      }));
    } else {
      // Yearly: 12 months, averaged
      const months = eachMonthOfInterval({
        start: subMonths(today, 11),
        end: today,
      });
      return months.map(month => {
        const daysInMonth = eachDayOfInterval({
          start: startOfMonth(month),
          end: month,
        });
        const monthlyPercentages = daysInMonth.map(day => calculateDailyPercentage(day, todos));
        const avgPercentage = monthlyPercentages.length > 0
          ? Math.round(monthlyPercentages.reduce((sum, p) => sum + p, 0) / monthlyPercentages.length)
          : 0;
        return {
          label: format(month, "MMM"),
          fullDate: format(month, "MMMM yyyy"),
          percentage: avgPercentage,
        };
      });
    }
  }, [selectedPeriod, todos]);

  // Calculate stats for current period
  const currentPeriodStats = useMemo(() => {
    const percentages = chartData.map(d => d.percentage);
    const average = percentages.length > 0
      ? Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length)
      : 0;
    return { average, percentages };
  }, [chartData]);

  // Calculate improvement (compare to previous period)
  const improvement = useMemo(() => {
    const today = new Date();
    let previousPeriodDays: Date[] = [];

    if (selectedPeriod === "weekly") {
      previousPeriodDays = Array.from({ length: 7 }, (_, i) => subDays(today, 13 - i));
    } else if (selectedPeriod === "monthly") {
      previousPeriodDays = Array.from({ length: 30 }, (_, i) => subDays(today, 59 - i));
    } else {
      const previousMonths = eachMonthOfInterval({
        start: subMonths(today, 23),
        end: subMonths(today, 12),
      });
      previousPeriodDays = previousMonths;
    }

    const previousPercentages = previousPeriodDays.map(day => {
      if (selectedPeriod === "yearly") {
        const daysInMonth = eachDayOfInterval({
          start: startOfMonth(day),
          end: day,
        });
        const monthlyPercentages = daysInMonth.map(d => calculateDailyPercentage(d, todos));
        return monthlyPercentages.length > 0
          ? Math.round(monthlyPercentages.reduce((sum, p) => sum + p, 0) / monthlyPercentages.length)
          : 0;
      }
      return calculateDailyPercentage(day, todos);
    });

    const previousAvg = previousPercentages.length > 0
      ? Math.round(previousPercentages.reduce((sum, p) => sum + p, 0) / previousPercentages.length)
      : 0;

    return currentPeriodStats.average - previousAvg;
  }, [selectedPeriod, todos, currentPeriodStats.average]);

  const hasData = chartData.some(d => d.percentage > 0);

  // Premium glass morphism style
  const glassStyle = {
    background: 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.08) 0%, hsla(0, 0%, 100%, 0.02) 100%)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid hsla(0, 0%, 100%, 0.12)',
    boxShadow: 'inset 0 1px 1px hsla(0, 0%, 100%, 0.1), 0 8px 32px hsla(0, 0%, 0%, 0.4)',
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    return (
      <div
        className="px-3 py-2 rounded-xl"
        style={glassStyle}
      >
        <p className="text-xs text-muted-foreground mb-1">{payload[0].payload.fullDate}</p>
        <p className="text-sm font-bold text-primary">{payload[0].value}%</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Period Selector */}
      <div className="p-4 rounded-2xl" style={glassStyle}>
        <div className="flex gap-2">
          {(["weekly", "monthly", "yearly"] as Period[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedPeriod === period
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-secondary/50 text-foreground hover:bg-secondary"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {todos.length === 0 ? (
        <div className="p-12 text-center rounded-2xl" style={glassStyle}>
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">No habits to track yet</p>
          <p className="text-sm text-muted-foreground">Add habits to see your progress analytics</p>
        </div>
      ) : !hasData ? (
        <div className="p-12 text-center rounded-2xl" style={glassStyle}>
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">No data available for this period</p>
          <p className="text-sm text-muted-foreground">Start completing habits to build your analytics</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Average Completion */}
            <div className="p-6 text-center rounded-2xl" style={glassStyle}>
              <div className="flex items-center justify-center mb-3">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-1">
                {currentPeriodStats.average}%
              </div>
              <div className="text-sm text-muted-foreground">Average Completion</div>
            </div>

            {/* Improvement */}
            <div className="p-6 text-center rounded-2xl" style={glassStyle}>
              <div className="flex items-center justify-center mb-3">
                {improvement > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : improvement < 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <Minus className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className={`text-4xl font-bold mb-1 ${
                improvement > 0 ? "text-green-500" : improvement < 0 ? "text-red-500" : "text-muted-foreground"
              }`}>
                {improvement > 0 ? "+" : ""}{improvement}%
              </div>
              <div className="text-sm text-muted-foreground">{improvement > 0 ? "Improvement" : improvement < 0 ? "Decline" : "No Change"}</div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="p-6 rounded-2xl" style={glassStyle}>
            <h3 className="text-lg font-semibold text-foreground mb-6">Completion Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsla(0, 0%, 100%, 0.05)" />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsla(0, 0%, 100%, 0.05)" }} />
                  <Bar
                    dataKey="percentage"
                    fill="url(#barGradient)"
                    radius={[8, 8, 0, 0]}
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsView;
