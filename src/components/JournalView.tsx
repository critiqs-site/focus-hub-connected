import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Pencil, Save, Loader2 } from "lucide-react";
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
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("neutral");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const MOODS = [
    { value: "great", emoji: "😄", label: "Great" },
    { value: "good", emoji: "🙂", label: "Good" },
    { value: "neutral", emoji: "😐", label: "Okay" },
    { value: "bad", emoji: "😔", label: "Bad" },
    { value: "terrible", emoji: "😢", label: "Terrible" },
  ];

  useEffect(() => {
    const load = async () => {
      if (isGuest) {
        try {
          const data = JSON.parse(localStorage.getItem(GUEST_JOURNAL_KEY) || "{}");
          const entry = data[todayStr];
          if (entry) { setNote(entry.note || ""); setMood(entry.mood || "neutral"); }
        } catch {}
        setLoading(false);
        return;
      }
      if (!userId) return;
      const { data } = await supabase
        .from("mood_notes")
        .select("*")
        .eq("user_id", userId)
        .eq("date", todayStr)
        .maybeSingle();
      if (data) {
        setNote(data.note || "");
        setMood(data.mood || "neutral");
        setExistingId(data.id);
      }
      setLoading(false);
    };
    load();

    // Schedule midnight reminder
    scheduleMidnightReminder();
  }, [userId, isGuest, todayStr]);

  const handleSave = async () => {
    setSaving(true);
    if (isGuest) {
      try {
        const data = JSON.parse(localStorage.getItem(GUEST_JOURNAL_KEY) || "{}");
        data[todayStr] = { note, mood };
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
      const { data, error } = await supabase.from("mood_notes").insert({ user_id: userId, date: todayStr, note, mood }).select().single();
      if (error) toast.error("Failed to save"); else { setExistingId(data.id); toast.success("Journal saved"); }
    }
    setSaving(false);
  };

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-2xl" style={glassStyle}>
        <div className="flex items-center gap-3 mb-4">
          <Pencil className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Today's Journal</h2>
          <span className="text-xs text-muted-foreground ml-auto">{format(new Date(), "EEEE, MMM d")}</span>
        </div>

        {/* Mood selector */}
        <div className="flex gap-2 mb-4">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${
                mood === m.value ? "bg-primary/15 border border-primary/40 scale-105" : "bg-secondary/30 border border-transparent hover:bg-secondary/50"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Note */}
        <Textarea
          placeholder="How was your day? What's on your mind..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[150px] bg-secondary/30 border-white/10 focus:border-primary/50 resize-none text-sm"
        />

        <Button onClick={handleSave} disabled={saving} className="mt-4 w-full bg-primary hover:bg-primary/90">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Journal</>}
        </Button>
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
