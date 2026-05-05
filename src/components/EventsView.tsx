import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { format, addDays } from "date-fns";
import { Clock, Plus, Trash2, CheckCircle2, Circle, X, Wand2, Loader2, CalendarClock, ChevronRight, CalendarIcon, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ScheduledEvent } from "@/types/todo";

interface EventsViewProps {
  events: ScheduledEvent[];
  onAddEvent: (title: string, time: string, date: string, timeEnd?: string, color?: string) => void;
  onAddMultipleEvents: (events: Array<{ title: string; time: string; timeEnd: string; date: string; description?: string; color?: string }>) => void;
  onEditEvent: (id: string, updates: Partial<Pick<ScheduledEvent, "title" | "description" | "time" | "timeEnd" | "completed" | "color">>) => void;
  onDeleteEvent: (id: string) => void;
  onToggleComplete: (id: string) => void;
  isGuest?: boolean;
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

const formatHourLabel = (time: string) => {
  if (!time) return "";
  const [h] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12} ${ampm}`;
};

const getDuration = (start: string, end: string) => {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return "";
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${mins}m`;
};

const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  red: { bg: 'hsla(0, 70%, 50%, 0.06)', border: 'hsla(0, 70%, 50%, 0.15)', text: 'hsl(0, 70%, 60%)' },
  green: { bg: 'hsla(140, 60%, 45%, 0.06)', border: 'hsla(140, 60%, 45%, 0.15)', text: 'hsl(140, 60%, 55%)' },
  blue: { bg: 'hsla(210, 70%, 50%, 0.06)', border: 'hsla(210, 70%, 50%, 0.15)', text: 'hsl(210, 70%, 60%)' },
  yellow: { bg: 'hsla(45, 80%, 50%, 0.06)', border: 'hsla(45, 80%, 50%, 0.15)', text: 'hsl(45, 80%, 55%)' },
  purple: { bg: 'hsla(270, 60%, 55%, 0.06)', border: 'hsla(270, 60%, 55%, 0.15)', text: 'hsl(270, 60%, 65%)' },
  orange: { bg: 'hsla(24, 80%, 50%, 0.06)', border: 'hsla(24, 80%, 50%, 0.15)', text: 'hsl(24, 80%, 55%)' },
  pink: { bg: 'hsla(330, 60%, 55%, 0.06)', border: 'hsla(330, 60%, 55%, 0.15)', text: 'hsl(330, 60%, 65%)' },
};

const COLOR_OPTIONS = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink'];
const COLOR_DOTS: Record<string, string> = {
  red: 'bg-red-500', green: 'bg-green-500', blue: 'bg-blue-500',
  yellow: 'bg-yellow-500', purple: 'bg-purple-500', orange: 'bg-orange-500', pink: 'bg-pink-500',
};

const getEventColors = (event: ScheduledEvent) => {
  if (event.color && EVENT_COLORS[event.color]) return EVENT_COLORS[event.color];
  return null; // use primary-based default
};

const EventsView = ({ events, onAddEvent, onAddMultipleEvents, onEditEvent, onDeleteEvent, onToggleComplete, isGuest }: EventsViewProps) => {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTimeStart, setNewTimeStart] = useState("09:00");
  const [newTimeEnd, setNewTimeEnd] = useState("10:00");
  const [newColor, setNewColor] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const selectedEvent = events.find(e => e.id === selectedId);

  useEffect(() => {
    if (selectedEvent) {
      setLocalTitle(selectedEvent.title);
      setLocalDescription(selectedEvent.description);
    }
  }, [selectedId, selectedEvent?.title, selectedEvent?.description]);

  const debouncedEdit = useCallback((id: string, updates: Partial<Pick<ScheduledEvent, "title" | "description" | "time" | "timeEnd" | "completed">>) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onEditEvent(id, updates);
    }, 500);
  }, [onEditEvent]);

  const dateEvents = useMemo(() =>
    events.filter(e => e.date === selectedDateStr).sort((a, b) => a.time.localeCompare(b.time)),
    [events, selectedDateStr]
  );

  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isToday = selectedDateStr === todayStr;

  const getEventStatus = (event: ScheduledEvent) => {
    if (event.completed) return "completed";
    if (!isToday) return "upcoming";
    const [h, m] = event.time.split(":").map(Number);
    const startMin = h * 60 + m;
    if (event.timeEnd) {
      const [eh, em] = event.timeEnd.split(":").map(Number);
      const endMin = eh * 60 + em;
      if (startMin <= nowMinutes && nowMinutes < endMin) return "active";
    }
    if (startMin > nowMinutes) return "upcoming";
    return "past";
  };

  const activeEvent = useMemo(() => {
    if (!isToday) return null;
    return dateEvents.find(e => getEventStatus(e) === "active") || null;
  }, [dateEvents, nowMinutes, isToday]);

  const nextEvent = useMemo(() => {
    if (!isToday) return null;
    return dateEvents.find(e => {
      const [h, m] = e.time.split(":").map(Number);
      return h * 60 + m > nowMinutes && !e.completed;
    });
  }, [dateEvents, nowMinutes, isToday]);

  const getCountdown = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const diff = (h * 60 + m) - nowMinutes;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const doneCount = dateEvents.filter(e => e.completed).length;
  const donePercent = dateEvents.length > 0 ? Math.round((doneCount / dateEvents.length) * 100) : 0;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddEvent(newTitle.trim(), newTimeStart, selectedDateStr, newTimeEnd, newColor || undefined);
    setNewTitle("");
    setNewTimeStart("09:00");
    setNewTimeEnd("10:00");
    setNewColor("");
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
        date: selectedDateStr,
        description: e.description || "",
        color: e.color || null,
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

  // Group events by start hour for timeline
  const timelineGroups = useMemo(() => {
    const sorted = [...dateEvents].sort((a, b) => a.time.localeCompare(b.time));
    const groups: { hour: string; events: ScheduledEvent[] }[] = [];
    for (const event of sorted) {
      const hourKey = event.time.split(":")[0];
      const existing = groups.find(g => g.hour === hourKey);
      if (existing) {
        existing.events.push(event);
      } else {
        groups.push({ hour: hourKey, events: [event] });
      }
    }
    return groups;
  }, [dateEvents]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_1.2fr] gap-4 lg:gap-6 animate-fade-in min-h-[70vh]">
      {/* LEFT — Coming Up */}
      <div className="rounded-2xl p-6 lg:p-8 flex flex-col" style={glassStyle}>
        <div className="flex items-center gap-2 mb-5">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
            {isToday ? "Coming Up" : format(selectedDate, "MMM d")}
          </h3>
        </div>

        {/* Date Picker */}
        <div className="mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-transparent border-muted-foreground/20 hover:bg-secondary/30",
                  selectedDateStr === todayStr && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDateStr === todayStr ? "Today" : format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          {/* Active Now */}
          {isToday && activeEvent && (
            <div className="w-full rounded-2xl p-5 lg:p-6" style={{
              ...glassStyle,
              background: `linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 100%)`,
              border: `1px solid hsl(var(--primary) / 0.3)`,
              boxShadow: `0 4px 24px hsl(var(--primary) / 0.15)`,
            }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
                <p className="text-xs text-primary font-bold tracking-wider uppercase">Active Now</p>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground mb-1">{activeEvent.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime12(activeEvent.time)}{activeEvent.timeEnd ? ` — ${formatTime12(activeEvent.timeEnd)}` : ""}
              </p>
            </div>
          )}

          {/* Next Event */}
          {isToday && nextEvent && (
            <div className="w-full rounded-xl p-3 lg:p-4" style={{
              ...glassStyle,
              background: `linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--primary) / 0.02) 100%)`,
            }}>
              <p className="text-[10px] text-primary/70 font-semibold tracking-wider mb-1 uppercase">Next</p>
              <p className="text-base lg:text-lg font-bold text-foreground mb-0.5">{nextEvent.title}</p>
              <p className="text-sm text-primary font-bold">in {getCountdown(nextEvent.time)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatTime12(nextEvent.time)}{nextEvent.timeEnd ? ` — ${formatTime12(nextEvent.timeEnd)}` : ""}
              </p>
            </div>
          )}

          {/* No events state */}
          {(!isToday || (!activeEvent && !nextEvent)) && (
            <div className="w-full rounded-2xl p-6" style={glassStyle}>
              <p className="text-3xl mb-3">✨</p>
              <p className="text-lg text-foreground font-semibold">
                {dateEvents.length === 0 ? "No events" : "You're free!"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {dateEvents.length === 0 ? "Add events to this day" : "No upcoming tasks"}
              </p>
            </div>
          )}
        </div>

        {dateEvents.length > 0 && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid hsla(0, 0%, 100%, 0.06)' }}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground font-medium">Progress</span>
              <span className="text-primary font-bold">{donePercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'hsla(0, 0%, 100%, 0.06)' }}>
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${donePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* MIDDLE — Schedule Stream (Timeline) */}
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
              onClick={() => {
                if (isGuest) { toast.error("This feature is only available for registered users."); return; }
                setShowAIForm(!showAIForm); setShowAddForm(false);
              }}
              className="h-7 gap-1.5 px-2.5 hover:bg-primary/20 text-primary text-xs"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create from AI</span>
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
          <div className="rounded-xl p-4 mb-4 space-y-3" style={{ ...glassStyle, background: 'hsl(var(--primary) / 0.06)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Wand2 className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Create from AI</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe your schedule naturally. AI will auto-assign colors.
            </p>
            <Textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder='e.g. "breakfast 9 to 9:30, gym 10 to 11:30, lunch at 1pm, work 2 to 6"'
              className="min-h-[80px] bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:ring-1 focus:ring-primary/30"
              style={{ background: 'hsla(0, 0%, 100%, 0.04)', border: '1px solid hsla(0, 0%, 100%, 0.06)' }}
            />
            <div className="flex items-center gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => { setShowAIForm(false); setAiPrompt(""); }} className="text-xs text-muted-foreground">Cancel</Button>
              <Button size="sm" onClick={handleAIGenerate} disabled={!aiPrompt.trim() || aiLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 gap-1.5">
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                Generate
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
                <input type="time" value={newTimeStart} onChange={e => setNewTimeStart(e.target.value)} className="flex-1 bg-transparent text-xs text-foreground outline-none px-2 py-1.5 rounded-lg [color-scheme:dark]" style={{ background: 'hsla(0, 0%, 100%, 0.04)' }} />
                <span className="text-xs text-muted-foreground">to</span>
                <input type="time" value={newTimeEnd} onChange={e => setNewTimeEnd(e.target.value)} className="flex-1 bg-transparent text-xs text-foreground outline-none px-2 py-1.5 rounded-lg [color-scheme:dark]" style={{ background: 'hsla(0, 0%, 100%, 0.04)' }} />
              </div>
            </div>
            {/* Color picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground mr-1">Color:</span>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(newColor === c ? "" : c)}
                  className={`w-5 h-5 rounded-full ${COLOR_DOTS[c]} transition-all ${newColor === c ? 'ring-2 ring-offset-1 ring-offset-background ring-foreground scale-110' : 'opacity-60 hover:opacity-100'}`}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">Add</Button>
            </div>
          </div>
        )}

        {/* Timeline View */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {dateEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No schedule for {selectedDateStr === todayStr ? "today" : format(selectedDate, "MMM d")}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tap + to add or use Create from AI</p>
            </div>
          ) : (
            <div className="space-y-1">
              {timelineGroups.map(group => (
                <div key={group.hour} className="flex gap-3">
                  {/* Hour label */}
                  <div className="w-14 flex-shrink-0 pt-3">
                    <span className="text-xs font-semibold text-muted-foreground/70 tabular-nums">
                      {formatHourLabel(group.hour + ":00")}
                    </span>
                  </div>
                  {/* Timeline line + events */}
                  <div className="flex-1 space-y-1.5 pb-3 border-l border-primary/15 pl-4 relative">
                    <div className="absolute left-[-3px] top-4 w-1.5 h-1.5 rounded-full bg-primary/40" />
                    {group.events.map(event => {
                      const status = getEventStatus(event);
                      const isSelected = selectedId === event.id;
                      const duration = getDuration(event.time, event.timeEnd);

                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedId(event.id === selectedId ? null : event.id)}
                          className={`w-full text-left transition-all duration-200 rounded-xl p-3.5 group relative ${isSelected ? 'ring-1 ring-primary/50' : ''}`}
                          style={{
                            background: status === "active"
                              ? `linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.04) 100%)`
                              : 'linear-gradient(135deg, hsla(0, 0%, 100%, 0.06) 0%, hsla(0, 0%, 100%, 0.02) 100%)',
                            border: status === "active"
                              ? `1px solid hsl(var(--primary) / 0.25)`
                              : '1px solid hsla(0, 0%, 100%, 0.08)',
                            opacity: status === "completed" ? 0.4 : 1,
                            boxShadow: status === "active" ? `0 4px 16px hsl(var(--primary) / 0.12)` : 'none',
                          }}
                        >
                          <div className="flex items-start gap-3">
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
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-semibold truncate ${event.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {event.title}
                                </p>
                                {status === "active" && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                  {formatTime12(event.time)}{event.timeEnd ? ` – ${formatTime12(event.timeEnd)}` : ""}
                                </span>
                                {duration && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                                    {duration}
                                  </span>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-xs text-muted-foreground/60 truncate mt-1">{event.description}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
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
            <input
              type="text"
              value={localTitle}
              onChange={e => {
                setLocalTitle(e.target.value);
                debouncedEdit(selectedEvent.id, { title: e.target.value });
              }}
              className="w-full bg-transparent text-2xl lg:text-3xl font-bold text-foreground outline-none px-1 py-2 rounded-lg focus:ring-1 focus:ring-primary/30 transition-all"
            />

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={glassStyle}>
                <input type="time" value={selectedEvent.time} onChange={e => onEditEvent(selectedEvent.id, { time: e.target.value })} className="bg-transparent text-sm text-foreground outline-none [color-scheme:dark]" />
                <span className="text-xs text-muted-foreground">to</span>
                <input type="time" value={selectedEvent.timeEnd || ""} onChange={e => onEditEvent(selectedEvent.id, { timeEnd: e.target.value })} className="bg-transparent text-sm text-foreground outline-none [color-scheme:dark]" />
              </div>
              <button onClick={() => onToggleComplete(selectedEvent.id)} className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedEvent.completed ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} style={glassStyle}>
                {selectedEvent.completed ? "✓ Done" : "Mark Done"}
              </button>
              <button onClick={() => { onDeleteEvent(selectedEvent.id); setSelectedId(null); }} className="px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:text-destructive transition-all flex items-center gap-1.5" style={glassStyle}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>

            {/* Color picker in details */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Color:</span>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => onEditEvent(selectedEvent.id, { color: selectedEvent.color === c ? null : c } as any)}
                  className={`w-5 h-5 rounded-full ${COLOR_DOTS[c]} transition-all ${selectedEvent.color === c ? 'ring-2 ring-offset-1 ring-offset-background ring-foreground scale-110' : 'opacity-50 hover:opacity-100'}`}
                />
              ))}
            </div>

            <div className="flex-1">
              <label className="text-sm text-muted-foreground font-medium mb-3 block">Instructions & Details</label>
              <Textarea
                value={localDescription}
                onChange={e => {
                  setLocalDescription(e.target.value);
                  debouncedEdit(selectedEvent.id, { description: e.target.value });
                }}
                placeholder="Add detailed instructions, steps, or notes..."
                className="flex-1 min-h-[200px] lg:min-h-[250px] bg-transparent resize-none text-base text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:ring-1 focus:ring-primary/30"
                style={{ background: 'hsla(0, 0%, 100%, 0.03)', border: '1px solid hsla(0, 0%, 100%, 0.06)' }}
              />
            </div>
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
