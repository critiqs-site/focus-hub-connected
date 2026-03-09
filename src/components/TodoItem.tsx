import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X, Pin } from "lucide-react";
import type { Todo } from "@/types/todo";
import { getIconComponent } from "@/lib/icons";
import { format, subDays, isSameDay } from "date-fns";

interface TodoItemProps {
  todo: Todo;
  onToggleDay: (id: string, dateStr: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  pinnedCount: number;
}

const TodoItem = ({ todo, onToggleDay, onEdit, onDelete, onTogglePin, pinnedCount }: TodoItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleSave = () => {
    if (editText.trim()) {
      onEdit(todo.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const IconComponent = getIconComponent(todo.icon || "Target");
  const completions = todo.completions || [];
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const isTodayCompleted = completions.includes(todayStr);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const isCompleted = completions.includes(dateStr);
    const isToday = isSameDay(date, today);
    const dayLabel = format(date, "d");
    return { date, dateStr, isCompleted, isToday, dayLabel };
  });

  const completedCount = days.filter(d => d.isCompleted).length;
  const percentage = Math.round((completedCount / 7) * 100);

  const handleQuickToggle = () => {
    onToggleDay(todo.id, todayStr);
  };

  return (
    <div
      className={`group glass-card p-4 lg:p-6 pt-6 lg:pt-8 transition-all duration-300 animate-scroll-fade-in relative overflow-hidden ${
        todo.pinned ? "ring-2 ring-primary/50" : ""
      }`}
      style={{ transition: 'border-color 0.3s, box-shadow 0.3s' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'hsla(24,95%,53%,0.2)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px -8px hsla(24,95%,53%,0.15), inset 0 1px 0 hsla(0,0%,100%,0.05), 0 4px 24px -4px hsla(0,0%,0%,0.4)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.08)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 1px 0 hsla(0,0%,100%,0.05), 0 4px 24px -4px hsla(0,0%,0%,0.4)';
      }}
    >
      {/* Pinned indicator */}
      {todo.pinned && (
        <div className="absolute top-3 right-3 z-10">
          <Pin className="h-4 w-4 text-primary fill-primary" />
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 lg:h-2" style={{ background: 'hsla(240, 6%, 14%, 0.5)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, hsl(24, 95%, 53%), hsla(24, 95%, 53%, 0.7))', boxShadow: '0 0 12px hsla(24, 95%, 53%, 0.4)' }}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Top row on mobile / Left side on desktop */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Clickable icon area to toggle today */}
          <button
            onClick={handleQuickToggle}
            className={`relative p-2.5 md:p-3 lg:p-4 rounded-xl shrink-0 transition-all duration-300 ${
              isTodayCompleted
                ? "bg-primary/20 orange-glow ring-2 ring-primary"
                : "bg-primary/10 hover:bg-primary/20"
            }`}
            title={isTodayCompleted ? "Mark as not done today" : "Mark as done today"}
          >
            {isTodayCompleted && (
              <Check className="absolute -top-1 -right-1 h-4 w-4 text-primary-foreground bg-primary rounded-full p-0.5" />
            )}
            <IconComponent className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-primary" />
          </button>

          <div className="min-w-0 flex-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl lg:text-3xl font-bold text-primary">{percentage}%</span>
                {!isEditing && (
                  <span className="text-sm lg:text-base font-medium text-foreground truncate">
                    {todo.text}
                  </span>
                )}
              </div>
              {!isEditing && todo.description && (
                <p className="hidden md:block text-xs text-muted-foreground mt-0.5 truncate max-w-[300px] lg:max-w-[400px]">
                  {todo.description}
                </p>
              )}
            </div>
            {isEditing && (
              <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="bg-secondary/50 border-primary/30 focus:border-primary h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                />
                <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/20">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Hover actions - desktop only */}
          {!isEditing && (
            <div
              className="hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0 glass-button"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(todo.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* 7 day circles */}
        <div className="flex items-center gap-1 md:gap-1.5 shrink-0 overflow-x-auto scrollbar-hide pb-1 md:pb-0">
          <div className="flex items-center gap-1 md:gap-1.5 flex-nowrap">
            {days.map((day) => {
              const isCompletedToday = day.isToday && day.isCompleted;
              const isCompletedPast = !day.isToday && day.isCompleted;

              return (
                <button
                  key={day.dateStr}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDay(todo.id, day.dateStr);
                  }}
                  className={`
                    relative min-w-[2rem] w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 flex-shrink-0
                    ${isCompletedToday
                      ? "bg-primary text-primary-foreground hover:scale-110"
                      : isCompletedPast
                        ? "bg-muted-foreground/40 text-background hover:scale-110"
                        : "border-2 border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:scale-110"
                    }
                    ${day.isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                  `}
                  title={format(day.date, "MMM d")}
                >
                  {day.isCompleted ? (
                    <Check className="h-4 w-4 animate-scale-in" />
                  ) : (
                    <span className="text-xs lg:text-sm font-medium">{day.dayLabel}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile-only action buttons */}
          {!isEditing && (
            <div
              className="flex md:hidden gap-1 ml-2 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0 glass-button"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(todo.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoItem;
