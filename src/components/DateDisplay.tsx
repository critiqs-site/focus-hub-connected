import { format, isSameDay } from "date-fns";
import { getFixedWeekDays } from "@/lib/utils";

const DateDisplay = () => {
  const today = new Date();
  const days = getFixedWeekDays(today);

  return (
    <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center justify-center gap-2 md:gap-4">
        {days.map((date, index) => {
          const isToday = isSameDay(date, today);
          return (
            <div
              key={date.toISOString()}
              className={`flex flex-col items-center justify-center min-w-[50px] md:min-w-[60px] py-3 px-2 rounded-xl transition-all duration-300 ${
                isToday
                  ? "bg-primary text-primary-foreground orange-glow scale-110"
                  : "glass-card"
              }`}
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <span className={`text-xl md:text-2xl font-bold ${isToday ? "" : "text-foreground"}`}>
                {format(date, "d")}
              </span>
              <span className={`text-xs uppercase tracking-wide ${isToday ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {format(date, "EEE")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DateDisplay;
