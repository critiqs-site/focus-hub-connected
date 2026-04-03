import { useState, useEffect } from "react";
import { format, addDays, subDays } from "date-fns";
import { Pencil, Save, Loader2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

  const isViewingToday = selectedDate === todayStr;

  const MOODS = [
    { value: "great", emoji: "😄", label: "Great" },
    { value: "good", emoji: "🙂", label: "Good" },
    { value: "neutral", emoji: "😐", label: "Okay" },
    { value: "bad", emoji: "😔", label: "Bad" },
    { value: "terrible", emoji: "😢", label: "Terrible" },
  ];

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
      if (error) toast.error("Failed to save"); else { setExistingId(data.id); toast.success("Journal saved"); }
    }
    setSaving(false);
  };

  const goBack = () => {
    const d = subDays(new Date(selectedDate + "T12:00:00"), 1);
    setSelectedDate(format(d, "yyyy-MM-dd"));
  };

  const goForward = () => {
    const d = addDays(new Date(selectedDate + "T12:00:00"), 1);
    const next = format(d, "yyyy-MM-dd");
    if (next <= todayStr) setSelectedDate(next);
  };

  const goToday = () => setSelectedDate(todayStr);

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date navigator */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={goBack} className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center min-w-[180px]">
          <p className="text-sm font-semibold text-foreground">
            {isViewingToday ? "Today" : format(displayDate, "EEEE")}
          </p>
          <p className="text-xs text-muted-foreground">{format(displayDate, "MMMM d, yyyy")}</p>
        </div>
        <button
          onClick={goForward}
          disabled={isViewingToday}
          className={`p-2 rounded-lg transition-colors ${isViewingToday ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-primary/10 text-muted-foreground hover:text-foreground'}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        {!isViewingToday && (
          <button onClick={goToday} className="text-xs text-primary hover:text-primary/80 font-medium px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
            Today
          </button>
        )}
      </div>

      <div className="p-6 rounded-2xl" style={glassStyle}>
        <div className="flex items-center gap-3 mb-4">
          <Pencil className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {isViewingToday ? "Today's Journal" : `Journal — ${format(displayDate, "MMM d")}`}
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

        {/* Note */}
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
