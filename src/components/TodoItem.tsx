import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X } from "lucide-react";
import type { Todo } from "@/types/todo";
import { getIconComponent } from "@/lib/icons";
import { format, subDays, isSameDay } from "date-fns";

interface TodoItemProps {
  todo: Todo;
  onToggleDay: (id: string, dateStr: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

const TodoItem = ({ todo, onToggleDay, onEdit, onDelete }: TodoItemProps) => {
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
      className="group glass-card p-3 lg:p-4 transition-all duration-300 animate-scroll-fade-in relative overflow-hidden flex flex-col"
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
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'hsla(240, 6%, 14%, 0.5)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, hsl(24, 95%, 53%), hsla(24, 95%, 53%, 0.7))', boxShadow: '0 0 12px hsla(24, 95%, 53%, 0.4)' }}
        />
      </div>

      {/* Top: Icon + percentage + actions */}
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={handleQuickToggle}
          className={`relative p-2 rounded-lg shrink-0 transition-all duration-300 ${
            isTodayCompleted
              ? "bg-primary/20 orange-glow ring-2 ring-primary"
              : "bg-primary/10 hover:bg-primary/20"
          }`}
          title={isTodayCompleted ? "Mark as not done today" : "Mark as done today"}
        >
          {isTodayCompleted && (
            <Check className="absolute -top-1 -right-1 h-3.5 w-3.5 text-primary-foreground bg-primary rounded-full p-0.5" />
          )}
          <IconComponent className="h-5 w-5 text-primary" />
        </button>
        <span className="text-lg font-bold text-primary">{percentage}%</span>
        
        {/* Actions */}
        {!isEditing && (
          <div className="ml-auto flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-7 w-7 p-0 glass-button">
              <Pencil className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(todo.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/20">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Title + description */}
      <div className="mt-2 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="bg-secondary/50 border-primary/30 focus:border-primary h-7 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/20">
              <Check className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0 text-muted-foreground">
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground truncate">{todo.text}</p>
            {todo.description && (
              <p className="hidden md:block text-xs text-muted-foreground mt-0.5 truncate">
                {todo.description}
              </p>
            )}
          </>
        )}
      </div>

      {/* 7 day circles */}
      <div className="flex items-center gap-1 mt-auto pt-2">
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
                flex-1 aspect-square rounded-full flex items-center justify-center
                transition-all duration-300 min-w-0
                ${isCompletedToday
                  ? "bg-primary text-primary-foreground hover:scale-110"
                  : isCompletedPast
                    ? "bg-muted-foreground/40 text-background hover:scale-110"
                    : "border border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:scale-110"
                }
                ${day.isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : ""}
              `}
              title={format(day.date, "MMM d")}
            >
              {day.isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="text-[10px] font-medium">{day.dayLabel}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TodoItem;
