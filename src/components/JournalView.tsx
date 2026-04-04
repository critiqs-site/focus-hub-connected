import { useState, useEffect, useMemo } from "react";
import { format, addDays, subDays } from "date-fns";
import { Pencil, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { requestNotificationPermission, scheduleMidnightReminder } from "@/lib/notifications";

interface JournalViewProps {
  userId?: string;
}

const GUEST_JOURNAL_KEY = "guest_journal";

const JournalView = ({ userId }: JournalViewProps) => {
  const isGuest = !userId && localStorage.getItem("guestMode") === "true";
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("neutral");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [entryDates, setEntryDates] = useState<string[]>([]);

  const isViewingToday = selectedDate === todayStr;

  const MOODS = [
    { value: "great", emoji: "😄", label: "Great" },
    { value: "good", emoji: "🙂", label: "Good" },
    { value: "neutral", emoji: "😐", label: "Okay" },
    { value: "bad", emoji: "😔", label: "Bad" },
    { value: "terrible", emoji: "😢", label: "Terrible" },
  ];

  // Load all entry dates for calendar dots
  useEffect(() => {
    const loadDates = async () => {
      if (isGuest) {
        try {
          const data = JSON.parse(localStorage.getItem(GUEST_JOURNAL_KEY) || "{}");
          setEntryDates(Object.keys(data));
        } catch {}
        return;
      }
      if (!userId) return;
      const { data } = await supabase
        .from("mood_notes")
        .select("date")
        .eq("user_id", userId);
      if (data) setEntryDates(data.map(d => d.date));
    };
    loadDates();
  }, [userId, isGuest]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNote("");
      setMood("neutral");
      setExistingId(null);

      if (isGuest) {
        try {
          const data = JSON.parse(localStorage.getItem(GUEST_JOURNAL_KEY) || "{}");
          const entry = data[selectedDate];
          if (entry) { setNote(entry.note || ""); setMood(entry.mood || "neutral"); }
        } catch {}
        setLoading(false);
        return;
      }
      if (!userId) { setLoading(false); return; }
      const { data } = await supabase
        .from("mood_notes")
        .select("*")
        .eq("user_id", userId)
        .eq("date", selectedDate)
        .maybeSingle();
      if (data) {
        setNote(data.note || "");
        setMood(data.mood || "neutral");
        setExistingId(data.id);
      }
      setLoading(false);
    };
    load();

    if (isViewingToday) scheduleMidnightReminder();
  }, [userId, isGuest, selectedDate]);

  const handleSave = async () => {
    setSaving(true);
    if (isGuest) {
      try {
        const data = JSON.parse(localStorage.getItem(GUEST_JOURNAL_KEY) || "{}");
        data[selectedDate] = { note, mood };
        localStorage.setItem(GUEST_JOURNAL_KEY, JSON.stringify(data));
        if (!entryDates.includes(selectedDate)) setEntryDates(prev => [...prev, selectedDate]);
        toast.success("Journal saved");
      } catch { toast.error("Failed to save"); }
      setSaving(false);
      return;
    }
    if (!userId) return;

    if (existingId) {
      const { error } = await supabase.from("mood_notes").update({ note, mood }).eq("id", existingId);
      if (error) toast.error("Failed to save"); else toast.success("Journal updated");
    } else {
      const { data, error } = await supabase.from("mood_notes").insert({ user_id: userId, date: selectedDate, note, mood }).select().single();
      if (error) toast.error("Failed to save"); else {
        setExistingId(data.id);
        if (!entryDates.includes(selectedDate)) setEntryDates(prev => [...prev, selectedDate]);
        toast.success("Journal saved");
      }
    }
    setSaving(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    if (dateStr <= todayStr) setSelectedDate(dateStr);
  };

  const goToday = () => setSelectedDate(todayStr);

  // Convert entry dates to Date objects for calendar modifiers
  const entryDateObjects = useMemo(() => 
    entryDates.map(d => new Date(d + "T12:00:00")),
    [entryDates]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const glassStyle = {
    background: 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.08) 0%, hsla(0, 0%, 100%, 0.02) 100%)',
    backdropFilter: 'blur(40px) saturate(180%)',
    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    border: '1px solid hsla(0, 0%, 100%, 0.12)',
    boxShadow: 'inset 0 1px 1px hsla(0, 0%, 100%, 0.1), 0 8px 32px hsla(0, 0%, 0%, 0.4)',
  };

  const displayDate = new Date(selectedDate + "T12:00:00");
  const calendarSelected = new Date(selectedDate + "T12:00:00");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {/* Calendar */}
        <div className="rounded-2xl p-4" style={glassStyle}>
          <Calendar
            mode="single"
            selected={calendarSelected}
            onSelect={handleDateSelect}
            disabled={(date) => date > new Date()}
            className={cn("p-3 pointer-events-auto")}
            modifiers={{ hasEntry: entryDateObjects }}
            modifiersClassNames={{ hasEntry: "has-journal-entry" }}
          />
          {!isViewingToday && (
            <button onClick={goToday} className="w-full mt-2 text-xs text-primary hover:text-primary/80 font-medium py-2 rounded-lg hover:bg-primary/10 transition-colors">
              Go to Today
            </button>
          )}
          <style>{`
            .has-journal-entry::after {
              content: '';
              position: absolute;
              bottom: 2px;
              left: 50%;
              transform: translateX(-50%);
              width: 4px;
              height: 4px;
              border-radius: 50%;
              background: hsl(var(--primary));
            }
            .has-journal-entry {
              position: relative;
            }
          `}</style>
        </div>

        {/* Journal entry */}
        <div className="p-6 rounded-2xl" style={glassStyle}>
          <div className="flex items-center gap-3 mb-4">
            <Pencil className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {isViewingToday ? "Today's Journal" : `Journal — ${format(displayDate, "MMM d, yyyy")}`}
            </h2>
          </div>

          {/* Mood selector */}
          <div className="flex gap-2 mb-4">
            {MOODS.map(m => (
              <button
                key={m.value}
                onClick={() => isViewingToday && setMood(m.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${
                  mood === m.value ? "bg-primary/15 border border-primary/40 scale-105" : "bg-secondary/30 border border-transparent hover:bg-secondary/50"
                } ${!isViewingToday ? 'pointer-events-none' : ''}`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </button>
            ))}
          </div>

          <Textarea
            placeholder={isViewingToday ? "How was your day? What's on your mind..." : "No entry for this day"}
            value={note}
            onChange={(e) => isViewingToday && setNote(e.target.value)}
            readOnly={!isViewingToday}
            className={`min-h-[150px] bg-secondary/30 border-white/10 focus:border-primary/50 resize-none text-sm ${!isViewingToday ? 'opacity-70' : ''}`}
          />

          {isViewingToday && (
            <Button onClick={handleSave} disabled={saving} className="mt-4 w-full bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Journal</>}
            </Button>
          )}

          {!isViewingToday && !note && !existingId && (
            <p className="text-sm text-muted-foreground/50 italic text-center mt-4">No journal entry for this date</p>
          )}
        </div>
      </div>

      <button
        onClick={async () => {
          const granted = await requestNotificationPermission();
          if (granted) toast.success("Midnight journal reminder enabled");
          else toast.error("Notification permission denied");
        }}
        className="text-xs text-muted-foreground hover:text-primary transition-colors text-center w-full"
      >
        🔔 Enable midnight journal reminder
      </button>
    </div>
  );
};

export default JournalView;