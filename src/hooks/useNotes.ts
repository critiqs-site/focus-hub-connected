import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MoodNote, MoodType } from "@/types/todo";

export const useNotes = (userId: string | undefined) => {
  const [notes, setNotes] = useState<MoodNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
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
  }, [userId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleAddNote = async (date: string, mood: MoodType, note: string) => {
    if (!userId) return;

    const existing = notes.find((n) => n.date === date);

    if (existing) {
      const { error } = await supabase
        .from("mood_notes")
        .update({ mood, note })
        .eq("id", existing.id);

      if (error) {
        toast.error("Failed to update entry");
      } else {
        setNotes((prev) =>
          prev.map((n) => (n.id === existing.id ? { ...n, mood, note } : n))
        );
        toast.success("Entry updated");
      }
    } else {
      const { data, error } = await supabase
        .from("mood_notes")
        .insert({ user_id: userId, date, mood, note })
        .select()
        .single();

      if (error) {
        toast.error("Failed to save entry");
      } else {
        setNotes((prev) => [
          {
            id: data.id,
            date: data.date,
            mood: data.mood as MoodType,
            note: data.note,
            createdAt: data.created_at,
          },
          ...prev,
        ]);
        toast.success("Entry saved");
      }
    }
  };

  const handleEditNote = async (id: string, mood: MoodType, note: string) => {
    const { error } = await supabase
      .from("mood_notes")
      .update({ mood, note })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update entry");
    } else {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, mood, note } : n))
      );
      toast.success("Entry updated");
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));

    const { error } = await supabase.from("mood_notes").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete entry");
      fetchNotes();
    } else {
      toast.success("Entry deleted");
    }
  };

  return {
    notes,
    loading,
    handleAddNote,
    handleEditNote,
    handleDeleteNote,
  };
};
