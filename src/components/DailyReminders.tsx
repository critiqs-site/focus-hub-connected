import { useState, useEffect } from "react";
import { Bell, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DailyReminder } from "@/types/todo";

const REMINDERS_KEY = "daily_reminders";

const DailyReminders = () => {
  const [reminders, setReminders] = useState<DailyReminder[]>([]);
  const [newText, setNewText] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    try {
      setReminders(JSON.parse(localStorage.getItem(REMINDERS_KEY) || "[]"));
    } catch {}
  }, []);

  const save = (r: DailyReminder[]) => {
    setReminders(r);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(r));
  };

  const addReminder = () => {
    if (!newText.trim()) return;
    save([...reminders, { id: crypto.randomUUID(), text: newText.trim(), createdAt: new Date().toISOString() }]);
    setNewText("");
    setShowInput(false);
  };

  const removeReminder = (id: string) => {
    save(reminders.filter(r => r.id !== id));
  };

  if (reminders.length === 0 && !showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="w-full mb-4 p-3 rounded-xl border border-dashed border-primary/20 hover:border-primary/40 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
      >
        <Bell className="h-4 w-4" /> Add daily reminder
      </button>
    );
  }

  return (
    <div className="mb-5 space-y-2">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Bell className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Daily Reminders</span>
      </div>
      {reminders.map(r => (
        <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 text-sm">
          <span className="text-foreground flex-1">{r.text}</span>
          <button onClick={() => removeReminder(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {showInput ? (
        <div className="flex gap-2">
          <Input
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Reminder text..."
            className="bg-secondary/50 border-primary/30 text-sm h-9"
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") addReminder(); if (e.key === "Escape") setShowInput(false); }}
          />
          <Button size="sm" onClick={addReminder} className="bg-primary text-primary-foreground h-9">Add</Button>
        </div>
      ) : (
        <button onClick={() => setShowInput(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-1">
          <Plus className="h-3 w-3" /> Add reminder
        </button>
      )}
    </div>
  );
};

export default DailyReminders;
