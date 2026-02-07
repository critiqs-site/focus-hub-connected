import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, isAfter, isSameDay } from "date-fns";
import type { Todo, Divider } from "@/types/todo";

const GUEST_TODOS_KEY = "guest_todos";
const GUEST_DIVIDERS_KEY = "guest_dividers";

const getGuest = <T,>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
};
const saveGuest = (key: string, data: unknown) => localStorage.setItem(key, JSON.stringify(data));

export const useTodos = (userId: string | undefined) => {
  const isGuest = !userId && localStorage.getItem("guestMode") === "true";
  const [todos, setTodos] = useState<Todo[]>([]);
  const [dividers, setDividers] = useState<Divider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (isGuest) {
      setDividers(getGuest<Divider>(GUEST_DIVIDERS_KEY));
      setTodos(getGuest<Todo>(GUEST_TODOS_KEY));
      setLoading(false);
      return;
    }
    if (!userId) return;
    setLoading(true);

    const [dividersRes, todosRes] = await Promise.all([
      supabase.from("dividers").select("*").order("created_at"),
      supabase.from("todos").select("*").order("created_at"),
    ]);

    if (dividersRes.error) console.error("Dividers error:", dividersRes.error);
    else setDividers(dividersRes.data.map((d) => ({ id: d.id, name: d.name, icon: d.icon })));

    if (todosRes.error) console.error("Todos error:", todosRes.error);
    else setTodos(todosRes.data.map((t) => ({
      id: t.id, text: t.text, dividerId: t.divider_id, icon: t.icon,
      createdAt: format(new Date(t.created_at), "yyyy-MM-dd"), completions: t.completions || [],
    })));

    setLoading(false);
  }, [userId, isGuest]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Helper to persist guest state
  const persistGuest = (newTodos?: Todo[], newDividers?: Divider[]) => {
    if (newTodos) saveGuest(GUEST_TODOS_KEY, newTodos);
    if (newDividers) saveGuest(GUEST_DIVIDERS_KEY, newDividers);
  };

  const handleToggleDay = async (id: string, dayIndex: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const targetDate = addDays(new Date(todo.createdAt), dayIndex);
    const todayDate = new Date();
    if (isAfter(targetDate, todayDate) && !isSameDay(targetDate, todayDate)) return;

    const dateStr = format(targetDate, "yyyy-MM-dd");
    const newCompletions = todo.completions.includes(dateStr)
      ? todo.completions.filter((d) => d !== dateStr)
      : [...todo.completions, dateStr];

    const newTodos = todos.map((t) => t.id === id ? { ...t, completions: newCompletions } : t);
    setTodos(newTodos);

    if (isGuest) { persistGuest(newTodos); return; }
    const { error } = await supabase.from("todos").update({ completions: newCompletions }).eq("id", id);
    if (error) { toast.error("Failed to update"); fetchData(); }
  };

  const handleEdit = async (id: string, text: string) => {
    const newTodos = todos.map((t) => t.id === id ? { ...t, text } : t);
    setTodos(newTodos);
    if (isGuest) { persistGuest(newTodos); toast.success("Habit updated"); return; }
    const { error } = await supabase.from("todos").update({ text }).eq("id", id);
    if (error) { toast.error("Failed to update"); fetchData(); } else toast.success("Habit updated");
  };

  const handleDelete = async (id: string) => {
    const newTodos = todos.filter((t) => t.id !== id);
    setTodos(newTodos);
    if (isGuest) { persistGuest(newTodos); toast.success("Habit deleted"); return; }
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); fetchData(); } else toast.success("Habit deleted");
  };

  const handleAddTodo = async (text: string, dividerId: string, icon: string) => {
    if (isGuest) {
      const newTodo: Todo = { id: crypto.randomUUID(), text, dividerId, icon, createdAt: format(new Date(), "yyyy-MM-dd"), completions: [] };
      const newTodos = [...todos, newTodo];
      setTodos(newTodos);
      persistGuest(newTodos);
      toast.success("Habit added");
      return;
    }
    if (!userId) return;
    const { data, error } = await supabase.from("todos").insert({ user_id: userId, divider_id: dividerId, text, icon, completions: [] }).select().single();
    if (error) toast.error("Failed to add habit");
    else { setTodos((prev) => [...prev, { id: data.id, text: data.text, dividerId: data.divider_id, icon: data.icon, createdAt: format(new Date(data.created_at), "yyyy-MM-dd"), completions: data.completions || [] }]); toast.success("Habit added"); }
  };

  const handleAddDivider = async (name: string, icon: string) => {
    if (isGuest) {
      const newDiv: Divider = { id: crypto.randomUUID(), name, icon };
      const newDividers = [...dividers, newDiv];
      setDividers(newDividers);
      persistGuest(undefined, newDividers);
      toast.success("Section added");
      return;
    }
    if (!userId) return;
    const { data, error } = await supabase.from("dividers").insert({ user_id: userId, name, icon }).select().single();
    if (error) toast.error("Failed to add section");
    else { setDividers((prev) => [...prev, { id: data.id, name: data.name, icon: data.icon }]); toast.success("Section added"); }
  };

  const handleDeleteDivider = async (id: string) => {
    const newDividers = dividers.filter((d) => d.id !== id);
    const newTodos = todos.filter((t) => t.dividerId !== id);
    setDividers(newDividers);
    setTodos(newTodos);
    if (isGuest) { persistGuest(newTodos, newDividers); toast.success("Section deleted"); return; }
    const { error } = await supabase.from("dividers").delete().eq("id", id);
    if (error) { toast.error("Failed to delete section"); fetchData(); } else toast.success("Section deleted");
  };

  return { todos, dividers, loading, handleToggleDay, handleEdit, handleDelete, handleAddTodo, handleAddDivider, handleDeleteDivider, refetch: fetchData };
};
