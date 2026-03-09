import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ScheduledEvent } from "@/types/todo";

const GUEST_EVENTS_KEY = "guest_events";

const getGuestEvents = (): ScheduledEvent[] => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_EVENTS_KEY) || "[]");
  } catch { return []; }
};

const saveGuestEvents = (events: ScheduledEvent[]) => {
  localStorage.setItem(GUEST_EVENTS_KEY, JSON.stringify(events));
};

export const useEvents = (userId: string | undefined) => {
  const isGuest = !userId && localStorage.getItem("guestMode") === "true";
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (isGuest) {
      setEvents(getGuestEvents());
      setLoading(false);
      return;
    }
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("scheduled_events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Events error:", error);
    } else {
      setEvents(
        data.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          time: e.time,
          date: e.date,
          completed: e.completed,
          createdAt: e.created_at,
        }))
      );
    }
    setLoading(false);
  }, [userId, isGuest]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const addEvent = async (title: string, time: string, date: string) => {
    if (isGuest) {
      const newEvent: ScheduledEvent = {
        id: crypto.randomUUID(), title, description: "", time, date,
        completed: false, createdAt: new Date().toISOString(),
      };
      const updated = [...events, newEvent];
      setEvents(updated);
      saveGuestEvents(updated);
      toast.success("Event added");
      return;
    }
    if (!userId) return;
    const { data, error } = await supabase
      .from("scheduled_events")
      .insert({ user_id: userId, title, time, date })
      .select()
      .single();
    if (error) { toast.error("Failed to add event"); }
    else {
      setEvents(prev => [...prev, {
        id: data.id, title: data.title, description: data.description,
        time: data.time, date: data.date, completed: data.completed, createdAt: data.created_at,
      }]);
      toast.success("Event added");
    }
  };

  const editEvent = async (id: string, updates: Partial<Pick<ScheduledEvent, "title" | "description" | "time" | "completed">>) => {
    if (isGuest) {
      const updated = events.map(e => e.id === id ? { ...e, ...updates } : e);
      setEvents(updated);
      saveGuestEvents(updated);
      return;
    }
    const { error } = await supabase.from("scheduled_events").update(updates).eq("id", id);
    if (error) { toast.error("Failed to update event"); }
    else { setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e)); }
  };

  const deleteEvent = async (id: string) => {
    if (isGuest) {
      const updated = events.filter(e => e.id !== id);
      setEvents(updated);
      saveGuestEvents(updated);
      toast.success("Event deleted");
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== id));
    const { error } = await supabase.from("scheduled_events").delete().eq("id", id);
    if (error) { toast.error("Failed to delete event"); fetchEvents(); }
    else { toast.success("Event deleted"); }
  };

  const toggleComplete = async (id: string) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    await editEvent(id, { completed: !event.completed });
  };

  return { events, loading, addEvent, editEvent, deleteEvent, toggleComplete };
};
