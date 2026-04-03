import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ScheduledEvent } from "@/types/todo";
import { eventSchema } from "@/lib/validation";
import { requestNotificationPermission, scheduleEventNotification } from "@/lib/notifications";

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
        data.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          time: e.time,
          timeEnd: e.time_end || "",
          date: e.date,
          completed: e.completed,
          createdAt: e.created_at,
          color: e.color || null,
        }))
      );
    }
    setLoading(false);
  }, [userId, isGuest]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const addEvent = async (title: string, time: string, date: string, timeEnd?: string, color?: string) => {
    const validated = eventSchema.safeParse({ title, time, date, timeEnd: timeEnd || "", description: "" });
    if (!validated.success) { toast.error(validated.error.errors[0]?.message || "Invalid input"); return; }
    
    const hasPermission = await requestNotificationPermission();
    
    if (isGuest) {
      const newEvent: ScheduledEvent = {
        id: crypto.randomUUID(), title, description: "", time, timeEnd: timeEnd || "", date,
        completed: false, createdAt: new Date().toISOString(), color: color || null,
      };
      const updated = [...events, newEvent];
      setEvents(updated);
      saveGuestEvents(updated);
      toast.success("Event added");
      if (hasPermission) scheduleEventNotification(newEvent);
      return;
    }
    if (!userId) return;
    const { data, error } = await supabase
      .from("scheduled_events")
      .insert({ user_id: userId, title, time, time_end: timeEnd || "", date, color: color || null })
      .select()
      .single();
    if (error) { toast.error("Failed to add event"); }
    else {
      const created: ScheduledEvent = {
        id: data.id, title: data.title, description: data.description,
        time: data.time, timeEnd: (data as any).time_end || "", date: data.date,
        completed: data.completed, createdAt: data.created_at, color: (data as any).color || null,
      };
      setEvents(prev => [...prev, created]);
      toast.success("Event added");
      if (hasPermission) scheduleEventNotification(created);
    }
  };

  const addMultipleEvents = async (newEvents: Array<{ title: string; time: string; timeEnd: string; date: string; description?: string; color?: string }>) => {
    for (const e of newEvents) {
      const validated = eventSchema.safeParse({ title: e.title, time: e.time, date: e.date, timeEnd: e.timeEnd, description: e.description || "" });
      if (!validated.success) { toast.error(`Invalid event "${e.title}": ${validated.error.errors[0]?.message}`); return; }
    }
    
    const hasPermission = await requestNotificationPermission();
    
    if (isGuest) {
      const created = newEvents.map(e => ({
        id: crypto.randomUUID(), title: e.title, description: e.description || "", time: e.time, timeEnd: e.timeEnd,
        date: e.date, completed: false, createdAt: new Date().toISOString(), color: e.color || null,
      }));
      const updated = [...events, ...created];
      setEvents(updated);
      saveGuestEvents(updated);
      toast.success(`${created.length} events added`);
      if (hasPermission) created.forEach(scheduleEventNotification);
      return;
    }
    if (!userId) return;
    const rows = newEvents.map(e => ({ user_id: userId, title: e.title, description: e.description || "", time: e.time, time_end: e.timeEnd, date: e.date, color: e.color || null }));
    const { data, error } = await supabase.from("scheduled_events").insert(rows).select();
    if (error) { toast.error("Failed to add events"); }
    else {
      const mapped = data.map((d: any) => ({
        id: d.id, title: d.title, description: d.description, time: d.time,
        timeEnd: d.time_end || "", date: d.date, completed: d.completed, createdAt: d.created_at, color: d.color || null,
      }));
      setEvents(prev => [...prev, ...mapped]);
      toast.success(`${mapped.length} events added`);
      if (hasPermission) mapped.forEach(scheduleEventNotification);
    }
  };

  const editEvent = async (id: string, updates: Partial<Pick<ScheduledEvent, "title" | "description" | "time" | "timeEnd" | "completed" | "color">>) => {
    if (updates.title !== undefined) {
      const v = eventSchema.shape.title.safeParse(updates.title);
      if (!v.success) { toast.error(v.error.errors[0]?.message || "Invalid title"); return; }
    }
    if (updates.description !== undefined) {
      const v = eventSchema.shape.description.safeParse(updates.description);
      if (!v.success) { toast.error(v.error.errors[0]?.message || "Invalid description"); return; }
    }
    if (isGuest) {
      const updated = events.map(e => e.id === id ? { ...e, ...updates } : e);
      setEvents(updated);
      saveGuestEvents(updated);
      return;
    }
    const dbUpdates: any = { ...updates };
    if ('timeEnd' in dbUpdates) {
      dbUpdates.time_end = dbUpdates.timeEnd;
      delete dbUpdates.timeEnd;
    }
    const { error } = await supabase.from("scheduled_events").update(dbUpdates).eq("id", id);
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

  return { events, loading, addEvent, addMultipleEvents, editEvent, deleteEvent, toggleComplete };
};
