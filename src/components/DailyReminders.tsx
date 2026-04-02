import { useState, useEffect } from "react";
import { Bell, Plus, X, RefreshCw, ChevronDown, ChevronUp, Quote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DailyReminder } from "@/types/todo";

const REMINDERS_KEY = "daily_reminders";

const DailyReminders = () => {
  const [reminders, setReminders] = useState<DailyReminder[]>([]);
  const [newText, setNewText] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [randomIndex, setRandomIndex] = useState(0);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(REMINDERS_KEY) || "[]");
      setReminders(stored);
      if (stored.length > 0) {
        setRandomIndex(Math.floor(Math.random() * stored.length));
      }
    } catch {}
  }, []);

  const save = (r: DailyReminder[]) => {
    setReminders(r);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(r));
  };

  const addReminder = () => {
    if (!newText.trim()) return;
    const updated = [...reminders, { id: crypto.randomUUID(), text: newText.trim(), createdAt: new Date().toISOString() }];
    save(updated);
    setNewText("");
    if (reminders.length === 0) setRandomIndex(0);
  };

  const removeReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    save(updated);
    if (updated.length > 0) {
      setRandomIndex(Math.min(randomIndex, updated.length - 1));
    }
  };

  const refresh = () => {
    if (reminders.length <= 1) return;
    let newIdx: number;
    do {
      newIdx = Math.floor(Math.random() * reminders.length);
    } while (newIdx === randomIndex);
    setRandomIndex(newIdx);
  };

  // No reminders — show add button
  if (reminders.length === 0 && !showManage) {
    return (
      <button
        onClick={() => setShowManage(true)}
        className="w-full mb-5 p-4 rounded-xl border border-dashed border-primary/20 hover:border-primary/40 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
      >
        <Bell className="h-4 w-4" /> Add Daily Reminder
      </button>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Quote display */}
      {reminders.length > 0 && (
        <div className="glass-card p-6 relative">
          <div className="flex items-start gap-3">
            <Quote className="h-8 w-8 text-primary/30 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-medium text-foreground leading-relaxed">
                {reminders[randomIndex]?.text}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Daily Reminder</p>
            </div>
            <button
              onClick={refresh}
              className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/10 flex-shrink-0"
              title="Show another reminder"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Manage section */}
      <button
        onClick={() => setShowManage(!showManage)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-1"
      >
        {showManage ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Manage Reminders ({reminders.length})
      </button>

      {showManage && (
        <div className="space-y-2 pl-1">
          {reminders.map(r => (
            <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 text-sm">
              <span className="text-foreground flex-1">{r.text}</span>
              <button onClick={() => removeReminder(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Add a reminder..."
              className="bg-secondary/50 border-primary/30 text-sm h-9"
              onKeyDown={e => { if (e.key === "Enter") addReminder(); }}
            />
            <Button size="sm" onClick={addReminder} className="bg-primary text-primary-foreground h-9">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReminders;
