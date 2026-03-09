import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Clock, Plus, Trash2, CheckCircle2, Circle, Calendar, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ScheduledEvent } from "@/types/todo";

interface EventsViewProps {
  events: ScheduledEvent[];
  onAddEvent: (title: string, time: string, date: string) => void;
  onEditEvent: (id: string, updates: Partial<Pick<ScheduledEvent, "title" | "description" | "time" | "completed">>) => void;
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

const EventsView = ({ events, onAddEvent, onEditEvent, onDeleteEvent, onToggleComplete }: EventsViewProps) => {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
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

  const currentEvent = useMemo(() => {
    for (let i = todayEvents.length - 1; i >= 0; i--) {
      const [h, m] = todayEvents[i].time.split(":").map(Number);
      const eventMin = h * 60 + m;
      if (eventMin <= nowMinutes && !todayEvents[i].completed) return todayEvents[i];
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
    onAddEvent(newTitle.trim(), newTime, todayStr);
    setNewTitle("");
    setNewTime("09:00");
    setShowAddForm(false);
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

          {currentEvent ? (
            <div className="w-full rounded-2xl p-5 lg:p-6" style={{ ...glassStyle, background: 'hsla(24, 95%, 53%, 0.1)' }}>
              <p className="text-xs text-primary font-semibold tracking-wider mb-2">ACTIVE NOW</p>
              <p className="text-xl lg:text-2xl font-bold text-foreground">{currentEvent.title}</p>
              <p className="text-sm text-muted-foreground mt-2">Started at {currentEvent.time}</p>
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
              <p className="text-sm text-muted-foreground mt-1">No more events today</p>
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

      {/* MIDDLE — Today's Schedule */}
      <div className="rounded-2xl p-6 lg:p-8 flex flex-col lg:min-h-[65vh]" style={glassStyle}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Today's Schedule</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-7 w-7 p-0 hover:bg-primary/20 text-primary"
          >
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {showAddForm && (
          <div className="rounded-xl p-3 mb-4 space-y-2" style={glassStyle}>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Event title..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-2 py-1.5 rounded-lg"
              style={{ background: 'hsla(0, 0%, 100%, 0.04)' }}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground outline-none px-2 py-1.5 rounded-lg [color-scheme:dark]"
                style={{ background: 'hsla(0, 0%, 100%, 0.04)' }}
              />
              <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8">
                Add
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
          {todayEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No events for today</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tap + to add your first event</p>
            </div>
          ) : (
            todayEvents.map(event => {
              const isActive = currentEvent?.id === event.id;
              const isSelected = selectedId === event.id;
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedId(event.id === selectedId ? null : event.id)}
                  className={`w-full text-left rounded-xl p-3 flex items-center gap-3 transition-all duration-200 group ${
                    isSelected ? 'ring-1 ring-primary/40' : ''
                  }`}
                  style={{
                    ...glassStyle,
                    ...(isActive ? { background: 'hsla(24, 95%, 53%, 0.08)', borderColor: 'hsla(24, 95%, 53%, 0.2)' } : {}),
                  }}
                >
                  <button
                    onClick={e => { e.stopPropagation(); onToggleComplete(event.id); }}
                    className="flex-shrink-0"
                  >
                    {event.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-medium truncate ${event.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {event.title}
                    </p>
                  </div>
                  <span className={`text-sm font-medium tabular-nums flex-shrink-0 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {event.time}
                  </span>
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

            <div className="flex items-center gap-3">
              <input
                type="time"
                value={selectedEvent.time}
                onChange={e => onEditEvent(selectedEvent.id, { time: e.target.value })}
                className="bg-transparent text-base text-foreground outline-none px-4 py-3 rounded-xl [color-scheme:dark]"
                style={{ ...glassStyle }}
              />
              <button
                onClick={() => onToggleComplete(selectedEvent.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
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
              <label className="text-xs text-muted-foreground font-medium mb-2 block">Instructions & Details</label>
              <Textarea
                value={selectedEvent.description}
                onChange={e => onEditEvent(selectedEvent.id, { description: e.target.value })}
                placeholder="Add detailed instructions, steps, or notes for this event..."
                className="flex-1 min-h-[150px] bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:ring-1 focus:ring-primary/30"
                style={{ background: 'hsla(0, 0%, 100%, 0.03)', border: '1px solid hsla(0, 0%, 100%, 0.06)' }}
              />
            </div>

            <Button
              variant="ghost"
              onClick={() => { onDeleteEvent(selectedEvent.id); setSelectedId(null); }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 self-start gap-2 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Event
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={glassStyle}>
              <Clock className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">Select an event to view details</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Add instructions and descriptions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsView;
