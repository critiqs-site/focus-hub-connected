import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MoodNote, MoodType } from "@/types/todo";

const GUEST_NOTES_KEY = "guest_notes";

const getGuestNotes = (): MoodNote[] => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_NOTES_KEY) || "[]");
  } catch { return []; }
};

const saveGuestNotes = (notes: MoodNote[]) => {
  localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notes));
};

export const useNotes = (userId: string | undefined) => {
  const isGuest = !userId && localStorage.getItem("guestMode") === "true";
  const [notes, setNotes] = useState<MoodNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (isGuest) {
      setNotes(getGuestNotes());
      setLoading(false);
      return;
    }
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("mood_notes")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Notes error:", error);
    } else {
      setNotes(
        data.map((n) => ({
          id: n.id,
          date: n.date,
          mood: n.mood as MoodType,
          note: n.note,
          createdAt: n.created_at,
        }))
      );
    }
    setLoading(false);
  }, [userId, isGuest]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleAddNote = async (date: string, mood: MoodType, note: string) => {
    if (isGuest) {
      const existing = notes.find((n) => n.date === date);
      if (existing) {
        const updated = notes.map((n) => n.id === existing.id ? { ...n, mood, note } : n);
        setNotes(updated);
        saveGuestNotes(updated);
        toast.success("Entry updated");
      } else {
        const newNote: MoodNote = { id: crypto.randomUUID(), date, mood, note, createdAt: new Date().toISOString() };
        const updated = [newNote, ...notes];
        setNotes(updated);
        saveGuestNotes(updated);
        toast.success("Entry saved");
      }
      return;
    }
    if (!userId) return;

    const existing = notes.find((n) => n.date === date);
    if (existing) {
      const { error } = await supabase.from("mood_notes").update({ mood, note }).eq("id", existing.id);
      if (error) { toast.error("Failed to update entry"); }
      else { setNotes((prev) => prev.map((n) => (n.id === existing.id ? { ...n, mood, note } : n))); toast.success("Entry updated"); }
    } else {
      const { data, error } = await supabase.from("mood_notes").insert({ user_id: userId, date, mood, note }).select().single();
      if (error) { toast.error("Failed to save entry"); }
      else { setNotes((prev) => [{ id: data.id, date: data.date, mood: data.mood as MoodType, note: data.note, createdAt: data.created_at }, ...prev]); toast.success("Entry saved"); }
    }
  };

  const handleEditNote = async (id: string, mood: MoodType, note: string) => {
    if (isGuest) {
      const updated = notes.map((n) => n.id === id ? { ...n, mood, note } : n);
      setNotes(updated);
      saveGuestNotes(updated);
      toast.success("Entry updated");
      return;
    }
    const { error } = await supabase.from("mood_notes").update({ mood, note }).eq("id", id);
    if (error) { toast.error("Failed to update entry"); }
    else { setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, mood, note } : n))); toast.success("Entry updated"); }
  };

  const handleDeleteNote = async (id: string) => {
    if (isGuest) {
      const updated = notes.filter((n) => n.id !== id);
      setNotes(updated);
      saveGuestNotes(updated);
      toast.success("Entry deleted");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase.from("mood_notes").delete().eq("id", id);
    if (error) { toast.error("Failed to delete entry"); fetchNotes(); }
    else { toast.success("Entry deleted"); }
  };

  return { notes, loading, handleAddNote, handleEditNote, handleDeleteNote };
};
