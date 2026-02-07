import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X } from "lucide-react";
import type { Todo } from "@/types/todo";
import { getIconComponent } from "@/lib/icons";
import { format, addDays, isSameDay, isAfter } from "date-fns";

interface TodoItemProps {
  todo: Todo;
  onToggleDay: (id: string, dayIndex: number) => void;
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
  const percentage = Math.round((completions.length / 7) * 100);
  const createdDate = new Date(todo.createdAt || new Date());
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(createdDate, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const isCompleted = completions.includes(dateStr);
    const isToday = isSameDay(date, today);
    const isFuture = isAfter(date, today) && !isToday;
    const dayLabel = format(date, 'd');
    return { date, dateStr, isCompleted, isToday, isFuture, dayLabel, index: i };
  });

  return (
    <div className="group glass-card p-4 pt-6 transition-all duration-300 hover:border-primary/30 animate-scroll-fade-in relative overflow-hidden">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted/30">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Top row on mobile / Left side on desktop */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative p-2.5 md:p-3 rounded-xl bg-primary/20 orange-glow shrink-0">
            <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-bold text-primary">{percentage}%</span>
              {!isEditing && (
                <span className="text-sm font-medium text-foreground truncate">
                  {todo.text}
                </span>
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
        <div className="flex items-center justify-between md:justify-end gap-1 md:gap-1.5 shrink-0">
          {days.map((day) => (
            <button
              key={day.dateStr}
              disabled={day.isFuture}
              onClick={(e) => {
                e.stopPropagation();
                if (!day.isFuture) {
                  onToggleDay(todo.id, day.index);
                }
              }}
              className={`
                relative w-8 h-8 md:w-8 md:h-8 rounded-full flex items-center justify-center
                transition-all duration-300
                ${day.isFuture
                  ? "opacity-40 cursor-not-allowed border-2 border-muted-foreground/20 text-muted-foreground/50"
                  : day.isCompleted
                    ? "bg-primary text-primary-foreground hover:scale-110"
                    : "border-2 border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:scale-110"
                }
                ${day.isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
              `}
              title={format(day.date, 'MMM d')}
            >
              {day.isCompleted ? (
                <Check className="h-4 w-4 animate-scale-in" />
              ) : (
                <span className="text-xs font-medium">{day.dayLabel}</span>
              )}
            </button>
          ))}

          {/* Mobile-only action buttons */}
          {!isEditing && (
            <div
              className="flex md:hidden gap-1 ml-2"
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
