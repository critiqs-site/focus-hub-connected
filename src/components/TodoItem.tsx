import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X, Pin, Flame } from "lucide-react";
import type { Todo } from "@/types/todo";
import { getIconComponent } from "@/lib/icons";
import { format, isSameDay, subDays } from "date-fns";
import { getFixedWeekDays } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TodoItemProps {
  todo: Todo;
  onToggleDay: (id: string, dateStr: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  pinnedCount: number;
}

function calculateStreak(completions: string[]): { streak: number; frozen: boolean } {
  if (!completions || completions.length === 0) return { streak: 0, frozen: false };
  const sorted = [...completions].sort().reverse();
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const twoDaysAgo = format(subDays(new Date(), 2), "yyyy-MM-dd");

  let streak = 0;
  let frozen = false;

  // Check if completed today
  if (sorted[0] === today) {
    streak = 1;
    let checkDate = subDays(new Date(), 1);
    for (let i = 1; i < 365; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      if (sorted.includes(dateStr)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        // Check one more day back for freeze
        const dayBefore = format(subDays(checkDate, 1), "yyyy-MM-dd");
        if (sorted.includes(dayBefore)) {
          // There was a single gap - count it as frozen but continue
          checkDate = subDays(checkDate, 2);
          streak++; // count the day before gap
          for (let j = i + 2; j < 365; j++) {
            const d = format(checkDate, "yyyy-MM-dd");
            if (sorted.includes(d)) { streak++; checkDate = subDays(checkDate, 1); }
            else break;
          }
        }
        break;
      }
    }
  } else if (sorted[0] === yesterday) {
    // Not done today but done yesterday - frozen state
    frozen = true;
    streak = 1;
    let checkDate = subDays(new Date(), 2);
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      if (sorted.includes(dateStr)) { streak++; checkDate = subDays(checkDate, 1); }
      else break;
    }
  } else if (sorted[0] === twoDaysAgo) {
    // Missed 2 days - streak resets
    return { streak: 0, frozen: false };
  }

  return { streak, frozen };
}

function getWeekCompletions(completions: string[], goalDays: number): { done: number; goal: number } {
  const today = new Date();
  const days = getFixedWeekDays(today);
  const done = days.filter(d => completions.includes(format(d, "yyyy-MM-dd"))).length;
  return { done, goal: goalDays };
}

const TodoItem = ({ todo, onToggleDay, onEdit, onDelete, onTogglePin, pinnedCount }: TodoItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  const handleSave = () => {
    if (editText.trim()) { onEdit(todo.id, editText.trim()); setIsEditing(false); }
  };

  const handleCancel = () => { setEditText(todo.text); setIsEditing(false); };

  const IconComponent = getIconComponent(todo.icon || "Target");
  const completions = todo.completions || [];
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const isTodayCompleted = completions.includes(todayStr);

  const fixedDays = getFixedWeekDays(today);
  const days = fixedDays.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return { date, dateStr, isCompleted: completions.includes(dateStr), isToday: isSameDay(date, today), dayLabel: format(date, "d") };
  });

  const completedCount = days.filter(d => d.isCompleted).length;
  const percentage = Math.round((completedCount / fixedDays.length) * 100);

  const { streak, frozen } = useMemo(() => calculateStreak(completions), [completions]);
  const weekProgress = useMemo(() => getWeekCompletions(completions, todo.goalDaysPerWeek), [completions, todo.goalDaysPerWeek]);

  const handleQuickToggle = () => { onToggleDay(todo.id, todayStr); };

  const colorAccent = todo.color || null;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group p-4 lg:p-6 pt-6 lg:pt-8 transition-all duration-500 animate-scroll-fade-in relative overflow-hidden cursor-grab active:cursor-grabbing rounded-2xl ${
        todo.pinned ? "ring-1 ring-primary/30" : ""
      } ${isDragging ? "opacity-60 scale-105 rotate-1 shadow-2xl z-50" : "opacity-100"}`}
      style={{
        ...style,
        background: 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.08) 0%, hsla(0, 0%, 100%, 0.02) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: colorAccent ? `1px solid ${colorAccent}40` : '1px solid hsla(0, 0%, 100%, 0.12)',
        borderLeft: colorAccent ? `4px solid ${colorAccent}` : undefined,
        boxShadow: 'inset 0 1px 1px hsla(0, 0%, 100%, 0.1), 0 8px 32px hsla(0, 0%, 0%, 0.4)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.12) 0%, hsla(0, 0%, 100%, 0.04) 100%)';
        if (!colorAccent) (e.currentTarget as HTMLElement).style.border = '1px solid hsla(0, 60%, 35%, 0.25)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 1px 1px hsla(0, 0%, 100%, 0.15), 0 0 30px -5px hsla(0, 60%, 35%, 0.2), 0 8px 32px hsla(0, 0%, 0%, 0.5)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.08) 0%, hsla(0, 0%, 100%, 0.02) 100%)';
        (e.currentTarget as HTMLElement).style.border = colorAccent ? `1px solid ${colorAccent}40` : '1px solid hsla(0, 0%, 100%, 0.12)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 1px 1px hsla(0, 0%, 100%, 0.1), 0 8px 32px hsla(0, 0%, 0%, 0.4)';
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
          style={{ width: `${percentage}%`, background: colorAccent ? `linear-gradient(90deg, ${colorAccent}, ${colorAccent}99)` : 'linear-gradient(90deg, hsl(var(--primary)), hsla(0, 60%, 35%, 0.7))', boxShadow: `0 0 12px ${colorAccent ? colorAccent + '66' : 'hsla(0, 60%, 35%, 0.4)'}` }}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={handleQuickToggle}
            onPointerDown={(e) => e.stopPropagation()}
            className={`relative p-2.5 md:p-3 lg:p-4 rounded-xl shrink-0 transition-all duration-300 ${
              isTodayCompleted
                ? "bg-primary/20 maroon-glow ring-2 ring-primary"
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
                {/* Streak badge */}
                {streak > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-bold streak-glow shrink-0" title={frozen ? "Streak frozen — complete today!" : `${streak} day streak`}>
                    <Flame className="h-3.5 w-3.5" style={{ color: '#FFD700' }} />
                    <span style={{ color: '#FFD700' }}>{streak}</span>
                    {frozen && <span className="text-[10px] ml-0.5 text-yellow-500/70">⏸</span>}
                  </span>
                )}
              </div>
              {/* Meta line: description, goal, amount */}
              {!isEditing && (
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {todo.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-[300px] lg:max-w-[400px]">
                      {todo.description}
                    </p>
                  )}
                  {todo.goalDaysPerWeek < 7 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      weekProgress.done >= weekProgress.goal ? 'bg-green-500/20 text-green-400' : 'bg-secondary/50 text-muted-foreground'
                    }`}>
                      {weekProgress.done}/{weekProgress.goal}/wk {weekProgress.done >= weekProgress.goal ? '✓' : ''}
                    </span>
                  )}
                  {todo.targetAmount && (
                    <span className="text-[10px] text-muted-foreground bg-secondary/40 px-1.5 py-0.5 rounded-full">
                      {todo.targetAmount}x{todo.targetUnit ? ` · ${todo.targetUnit}` : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
            {isEditing && (
              <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="bg-secondary/50 border-primary/30 focus:border-primary h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
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

          {/* Hover actions - desktop */}
          {!isEditing && (
            <div className="hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
              <Button size="sm" variant="ghost" onClick={() => { if (!todo.pinned && pinnedCount >= 3) return; onTogglePin(todo.id); }}
                className={`h-8 w-8 p-0 ${todo.pinned ? "text-primary bg-primary/20 hover:bg-primary/30" : "glass-button"}`}
                title={todo.pinned ? "Unpin" : pinnedCount >= 3 ? "Max 3 pins" : "Pin"}>
                <Pin className={`h-3.5 w-3.5 ${todo.pinned ? "fill-primary" : ""}`} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0 glass-button">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(todo.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20">
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
                  onClick={(e) => { e.stopPropagation(); if (day.isToday) onToggleDay(todo.id, day.dateStr); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`relative min-w-[2rem] w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0
                    ${isCompletedToday ? "bg-primary text-primary-foreground hover:scale-110 cursor-pointer"
                      : isCompletedPast ? "bg-muted-foreground/40 text-background cursor-default"
                        : day.isToday ? "border-2 border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:scale-110 cursor-pointer"
                          : "border-2 border-muted-foreground/30 text-muted-foreground cursor-default opacity-60"}
                    ${day.isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                  `}
                  title={day.isToday ? format(day.date, "MMM d") + " (click to toggle)" : format(day.date, "MMM d")}
                >
                  {day.isCompleted ? <Check className="h-4 w-4 animate-scale-in" /> : <span className="text-xs lg:text-sm font-medium">{day.dayLabel}</span>}
                </button>
              );
            })}
          </div>

          {/* Mobile action buttons */}
          {!isEditing && (
            <div className="flex md:hidden gap-1 ml-2 flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
              <Button size="sm" variant="ghost" onClick={() => { if (!todo.pinned && pinnedCount >= 3) return; onTogglePin(todo.id); }}
                className={`h-8 w-8 p-0 ${todo.pinned ? "text-primary bg-primary/20" : "glass-button"}`}>
                <Pin className={`h-3.5 w-3.5 ${todo.pinned ? "fill-primary" : ""}`} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0 glass-button">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDelete(todo.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/20">
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
