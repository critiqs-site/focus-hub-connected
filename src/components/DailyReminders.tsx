import { useState, useEffect } from "react";
import { Bell, Plus, X, RefreshCw, Pencil, Quote } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DailyReminder } from "@/types/todo";

const REMINDERS_KEY = "daily_reminders";

const DailyReminders = () => {
  const [reminders, setReminders] = useState<DailyReminder[]>([]);
  const [newText, setNewText] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [randomIndex, setRandomIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(REMINDERS_KEY) || "[]");
      if (Array.isArray(stored) && stored.length > 0) {
        setReminders(stored);
        setRandomIndex(Math.floor(Math.random() * stored.length));
      }
    } catch {}
    setLoaded(true);
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
    setShowAdd(false);
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

  if (!loaded) return null;

  // No reminders — compact add prompt
  if (reminders.length === 0) {
    return (
      <div className="mb-4">
        {showAdd ? (
          <div className="flex gap-2 mb-4">
            <Input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Type a motivational reminder..."
              className="bg-secondary/50 border-primary/30 text-sm h-9 flex-1"
              onKeyDown={e => { if (e.key === "Enter") addReminder(); }}
              autoFocus
            />
            <button onClick={addReminder} className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
            </button>
            <button onClick={() => setShowAdd(false)} className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full p-3 rounded-xl border border-dashed border-primary/20 hover:border-primary/40 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <Bell className="h-3.5 w-3.5" /> Add a daily reminder to stay motivated
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-2">
      {/* Compact quote display */}
      <div className="glass-card p-4 relative">
        <div className="flex items-start gap-2.5">
          <Quote className="h-5 w-5 text-primary/30 flex-shrink-0 mt-0.5" />
          <p className="text-base font-medium text-foreground leading-relaxed flex-1 min-w-0 line-clamp-3">
            {reminders[randomIndex]?.text}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10"
              title="Add reminder"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`transition-colors p-1 rounded-lg hover:bg-primary/10 ${editMode ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              title="Edit reminders"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={refresh}
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10"
              title="Show another"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inline add */}
      {showAdd && (
        <div className="flex gap-2">
          <Input
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="Add a reminder..."
            className="bg-secondary/50 border-primary/30 text-sm h-9 flex-1"
            onKeyDown={e => { if (e.key === "Enter") addReminder(); }}
            autoFocus
          />
          <button onClick={addReminder} className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Edit mode — show all with delete */}
      {editMode && (
        <div className="space-y-1.5 pl-1">
          {reminders.map(r => (
            <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10 text-sm">
              <span className="text-foreground flex-1 truncate">{r.text}</span>
              <button onClick={() => removeReminder(r.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/50 px-1">{reminders.length} reminder{reminders.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  );
};

export default DailyReminders;
