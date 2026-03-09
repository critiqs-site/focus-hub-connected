import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Clock, Plus, Trash2, CheckCircle2, Circle, Sparkles, X, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ScheduledEvent } from "@/types/todo";

interface EventsViewProps {
  events: ScheduledEvent[];
  onAddEvent: (title: string, time: string, date: string, timeEnd?: string) => void;
  onAddMultipleEvents: (events: Array<{ title: string; time: string; timeEnd: string; date: string }>) => void;
  onEditEvent: (id: string, updates: Partial<Pick<ScheduledEvent, "title" | "description" | "time" | "timeEnd" | "completed">>) => void;
  onDeleteEvent: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const glassStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.06) 0%, hsla(0, 0%, 100%, 0.02) 100%)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: '1px solid hsla(0, 0%, 100%, 0.06)',
  boxShadow: 'inset 0 1px 0 0 hsla(0, 0%, 100%, 0.05), 0 8px 32px hsla(0, 0%, 0%, 0.3)',
};

const formatTime12 = (time: string) => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const EventsView = ({ events, onAddEvent, onAddMultipleEvents, onEditEvent, onDeleteEvent, onToggleComplete }: EventsViewProps) => {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTimeStart, setNewTimeStart] = useState("09:00");
  const [newTimeEnd, setNewTimeEnd] = useState("10:00");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const todayEvents = useMemo(() =>
    events.filter(e => e.date === todayStr).sort((a, b) => a.time.localeCompare(b.time)),
    [events, todayStr]
  );

  const selectedEvent = events.find(e => e.id === selectedId);
  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const activeEvent = useMemo(() => {
    for (let i = todayEvents.length - 1; i >= 0; i--) {
      const e = todayEvents[i];
      const [h, m] = e.time.split(":").map(Number);
      const startMin = h * 60 + m;
      if (e.timeEnd) {
        const [eh, em] = e.timeEnd.split(":").map(Number);
        const endMin = eh * 60 + em;
        if (startMin <= nowMinutes && nowMinutes < endMin && !e.completed) return e;
      } else {
        if (startMin <= nowMinutes && !e.completed) return e;
      }
    }
    return null;
  }, [todayEvents, nowMinutes]);

  const nextEvent = useMemo(() => {
    return todayEvents.find(e => {
      const [h, m] = e.time.split(":").map(Number);
      return h * 60 + m > nowMinutes && !e.completed;
    });
  }, [todayEvents, nowMinutes]);

  const getCountdown = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const diff = (h * 60 + m) - nowMinutes;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddEvent(newTitle.trim(), newTimeStart, todayStr, newTimeEnd);
    setNewTitle("");
    setNewTimeStart("09:00");
    setNewTimeEnd("10:00");
    setShowAddForm(false);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("schedule-ai", {
        body: { message: aiPrompt },
      });
      if (error) throw error;
      const parsed = data?.events;
      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
        toast.error("Couldn't parse any events. Try being more specific.");
        return;
      }
      const mapped = parsed.map((e: any) => ({
        title: e.title,
        time: e.time,
        timeEnd: e.timeEnd || "",
        date: todayStr,
      }));
      onAddMultipleEvents(mapped);
      setAiPrompt("");
      setShowAIForm(false);
    } catch (err) {
      console.error("AI schedule error:", err);
      toast.error("Failed to generate schedule. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // Determine event status for styling
  const getEventStatus = (event: ScheduledEvent) => {
    if (event.completed) return "completed";
    const [h, m] = event.time.split(":").map(Number);
    const startMin = h * 60 + m;
    if (event.timeEnd) {
      const [eh, em] = event.timeEnd.split(":").map(Number);
      const endMin = eh * 60 + em;
      if (startMin <= nowMinutes && nowMinutes < endMin) return "active";
    }
    if (activeEvent?.id === event.id) return "active";
    if (startMin > nowMinutes) return "upcoming";
    return "past";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_1.2fr] gap-4 lg:gap-6 animate-fade-in min-h-[70vh]">
      {/* LEFT — Right Now */}
      <div className="rounded-2xl p-6 lg:p-8 flex flex-col" style={glassStyle}>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Right Now</h3>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-5xl lg:text-7xl font-bold text-foreground mb-2 tabular-nums">
            {format(currentTime, "h:mm")}
          </p>
          <p className="text-base lg:text-lg text-muted-foreground mb-8">{format(currentTime, "a · EEEE")}</p>

          {activeEvent ? (
            <div className="w-full rounded-2xl p-5 lg:p-6" style={{ ...glassStyle, background: 'hsla(24, 95%, 53%, 0.1)' }}>
              <p className="text-xs text-primary font-semibold tracking-wider mb-2">● ACTIVE</p>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{activeEvent.title}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {formatTime12(activeEvent.time)}{activeEvent.timeEnd ? ` — ${formatTime12(activeEvent.timeEnd)}` : ""}
              </p>
            </div>
          ) : nextEvent ? (
            <div className="w-full rounded-2xl p-5 lg:p-6" style={glassStyle}>
              <p className="text-xs text-muted-foreground font-semibold tracking-wider mb-2">COMING UP</p>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{nextEvent.title}</p>
              <p className="text-base text-primary font-semibold mt-2">in {getCountdown(nextEvent.time)}</p>
            </div>
          ) : (
            <div className="w-full rounded-2xl p-5 lg:p-6" style={glassStyle}>
              <p className="text-3xl mb-2">✨</p>
              <p className="text-lg text-foreground font-semibold">You're free!</p>
              <p className="text-sm text-muted-foreground mt-1">No more tasks today</p>
            </div>
          )}
        </div>

        {todayEvents.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid hsla(0, 0%, 100%, 0.06)' }}>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{todayEvents.filter(e => e.completed).length}/{todayEvents.length} done</span>
              <span>{Math.round((todayEvents.filter(e => e.completed).length / todayEvents.length) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'hsla(0, 0%, 100%, 0.06)' }}>
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(todayEvents.filter(e => e.completed).length / todayEvents.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* MIDDLE — Schedule Stream */}
      <div className="rounded-2xl p-6 lg:p-8 flex flex-col lg:min-h-[65vh]" style={glassStyle}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Schedule Stream</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowAIForm(!showAIForm); setShowAddForm(false); }}
              className="h-7 gap-1.5 px-2.5 hover:bg-primary/20 text-primary text-xs"
              title="Write from AI"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowAddForm(!showAddForm); setShowAIForm(false); }}
              className="h-7 w-7 p-0 hover:bg-primary/20 text-primary"
            >
              {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* AI Write Form */}
        {showAIForm && (
          <div className="rounded-xl p-4 mb-4 space-y-3" style={{ ...glassStyle, background: 'hsla(24, 95%, 53%, 0.06)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Write from AI</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe your schedule naturally — AI will parse it into events
            </p>
            <Textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder='e.g. "eating breakfast 9 to 9:30, gym 10 to 11:30, lunch at 1pm, work 2 to 6, dinner at 7:30"'
              className="min-h-[80px] bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:ring-1 focus:ring-primary/30"
              style={{ background: 'hsla(0, 0%, 100%, 0.04)', border: '1px solid hsla(0, 0%, 100%, 0.06)' }}
            />
            <div className="flex items-center gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowAIForm(false); setAiPrompt(""); }}
                className="text-xs text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || aiLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 gap-1.5"
              >
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                Generate Schedule
              </Button>
            </div>
          </div>
        )}

        {/* Manual Add Form */}
        {showAddForm && (
          <div className="rounded-xl p-3 mb-4 space-y-2" style={glassStyle}>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-2 py-1.5 rounded-lg"
              style={{ background: 'hsla(0, 0%, 100%, 0.04)' }}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="time"
                  value={newTimeStart}
                  onChange={e => setNewTimeStart(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-foreground outline-none px-2 py-1.5 rounded-lg [color-scheme:dark]"
                  style={{ background: 'hsla(0, 0%, 100%, 0.04)' }}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="time"
                  value={newTimeEnd}
                  onChange={e => setNewTimeEnd(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-foreground outline-none px-2 py-1.5 rounded-lg [color-scheme:dark]"
                  style={{ background: 'hsla(0, 0%, 100%, 0.04)' }}
                />
              </div>
              <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Event Stream */}
        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
          {todayEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No schedule for today</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tap + to add manually or ✨ AI to auto-generate</p>
            </div>
          ) : (
            todayEvents.map((event, index) => {
              const status = getEventStatus(event);
              const isSelected = selectedId === event.id;

              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedId(event.id === selectedId ? null : event.id)}
                  className={`w-full text-left rounded-xl p-3.5 flex items-start gap-3 transition-all duration-300 group relative ${
                    isSelected ? 'ring-1 ring-primary/40' : ''
                  }`}
                  style={{
                    ...glassStyle,
                    opacity: status === "completed" ? 0.4 : status === "past" ? 0.55 : status === "upcoming" ? Math.max(0.5, 1 - index * 0.08) : 1,
                    ...(status === "active" ? {
                      background: 'hsla(24, 95%, 53%, 0.08)',
                      borderColor: 'hsla(24, 95%, 53%, 0.25)',
                      boxShadow: 'inset 0 1px 0 0 hsla(24, 95%, 53%, 0.1), 0 4px 20px hsla(24, 95%, 53%, 0.15)',
                    } : {}),
                  }}
                >
                  {/* Active indicator dot */}
                  {status === "active" && (
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                      </span>
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Active</span>
                    </div>
                  )}

                  <button
                    onClick={e => { e.stopPropagation(); onToggleComplete(event.id); }}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {event.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-semibold truncate ${
                      event.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}>
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{event.description}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                    <span className={`text-xs font-medium tabular-nums ${
                      status === "active" ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {formatTime12(event.time)}
                    </span>
                    {event.timeEnd && (
                      <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                        {formatTime12(event.timeEnd)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT — Details */}
      <div className="rounded-2xl p-6 lg:p-8 flex flex-col" style={glassStyle}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Details</h3>
        </div>

        {selectedEvent ? (
          <div className="flex-1 flex flex-col space-y-4">
            <div>
              <input
                type="text"
                value={selectedEvent.title}
                onChange={e => onEditEvent(selectedEvent.id, { title: e.target.value })}
                className="w-full bg-transparent text-2xl lg:text-3xl font-bold text-foreground outline-none px-1 py-2 rounded-lg focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={glassStyle}>
                <input
                  type="time"
                  value={selectedEvent.time}
                  onChange={e => onEditEvent(selectedEvent.id, { time: e.target.value })}
                  className="bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="time"
                  value={selectedEvent.timeEnd || ""}
                  onChange={e => onEditEvent(selectedEvent.id, { timeEnd: e.target.value })}
                  className="bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
                />
              </div>
              <button
                onClick={() => onToggleComplete(selectedEvent.id)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedEvent.completed
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={glassStyle}
              >
                {selectedEvent.completed ? "✓ Done" : "Mark Done"}
              </button>
            </div>

            <div className="flex-1">
              <label className="text-sm text-muted-foreground font-medium mb-3 block">Instructions & Details</label>
              <Textarea
                value={selectedEvent.description}
                onChange={e => onEditEvent(selectedEvent.id, { description: e.target.value })}
                placeholder="Add detailed instructions, steps, or notes..."
                className="flex-1 min-h-[200px] lg:min-h-[250px] bg-transparent resize-none text-base text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:ring-1 focus:ring-primary/30"
                style={{ background: 'hsla(0, 0%, 100%, 0.03)', border: '1px solid hsla(0, 0%, 100%, 0.06)' }}
              />
            </div>

            <Button
              variant="ghost"
              onClick={() => { onDeleteEvent(selectedEvent.id); setSelectedId(null); }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 self-start gap-2 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={glassStyle}>
              <Clock className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">Select a task to view details</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Add instructions and descriptions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsView;
