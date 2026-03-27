import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Todo, Divider } from "@/types/todo";
import { todoSchema, dividerSchema } from "@/lib/validation";

const GUEST_TODOS_KEY = "guest_todos";
const GUEST_DIVIDERS_KEY = "guest_dividers";

const getGuest = <T,>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
};
const saveGuest = (key: string, data: unknown) => localStorage.setItem(key, JSON.stringify(data));

const mapTodoRow = (t: any): Todo => ({
  id: t.id,
  text: t.text,
  description: t.description || null,
  dividerId: t.divider_id || t.dividerId,
  icon: t.icon,
  createdAt: t.created_at ? format(new Date(t.created_at), "yyyy-MM-dd") : t.createdAt,
  completions: t.completions || [],
  pinned: t.pinned || false,
  order: t.order || 0,
  goalDaysPerWeek: t.goal_days_per_week ?? t.goalDaysPerWeek ?? 7,
  targetAmount: t.target_amount ?? t.targetAmount ?? null,
  targetUnit: t.target_unit ?? t.targetUnit ?? null,
  color: t.color ?? null,
});

export const useTodos = (userId: string | undefined) => {
  const isGuest = !userId && localStorage.getItem("guestMode") === "true";
  const [todos, setTodos] = useState<Todo[]>([]);
  const [dividers, setDividers] = useState<Divider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (isGuest) {
      setDividers(getGuest<Divider>(GUEST_DIVIDERS_KEY));
      setTodos(getGuest<Todo>(GUEST_TODOS_KEY).map(t => ({ ...t, goalDaysPerWeek: t.goalDaysPerWeek ?? 7 })));
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
    else setTodos(todosRes.data.map(mapTodoRow));

    setLoading(false);
  }, [userId, isGuest]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const persistGuest = (newTodos?: Todo[], newDividers?: Divider[]) => {
    if (newTodos) saveGuest(GUEST_TODOS_KEY, newTodos);
    if (newDividers) saveGuest(GUEST_DIVIDERS_KEY, newDividers);
  };

  const handleToggleDay = async (id: string, dateStr: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const newCompletions = todo.completions.includes(dateStr)
      ? todo.completions.filter((d) => d !== dateStr)
      : [...todo.completions, dateStr];
    const newTodos = todos.map((t) => t.id === id ? { ...t, completions: newCompletions } : t);
    setTodos(newTodos);
    if (isGuest) { persistGuest(newTodos); return; }
    const { error } = await supabase.from("todos").update({ completions: newCompletions }).eq("id", id);
    if (error) { toast.error("Failed to update"); fetchData(); }
  };

  const handleToggleToday = async (id: string) => {
    await handleToggleDay(id, format(new Date(), "yyyy-MM-dd"));
  };

  const handleEdit = async (id: string, text: string) => {
    const validated = todoSchema.shape.text.safeParse(text);
    if (!validated.success) { toast.error(validated.error.errors[0]?.message || "Invalid input"); return; }
    const cleanText = validated.data;
    const newTodos = todos.map((t) => t.id === id ? { ...t, text: cleanText } : t);
    setTodos(newTodos);
    if (isGuest) { persistGuest(newTodos); toast.success("Habit updated"); return; }
    const { error } = await supabase.from("todos").update({ text: cleanText }).eq("id", id);
    if (error) { toast.error("Failed to update"); fetchData(); } else toast.success("Habit updated");
  };

  const handleDelete = async (id: string) => {
    const newTodos = todos.filter((t) => t.id !== id);
    setTodos(newTodos);
    if (isGuest) { persistGuest(newTodos); toast.success("Habit deleted"); return; }
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); fetchData(); } else toast.success("Habit deleted");
  };

  const handleUpdateIcon = async (id: string, icon: string) => {
    const newTodos = todos.map((t) => t.id === id ? { ...t, icon } : t);
    setTodos(newTodos);
    if (isGuest) { persistGuest(newTodos); toast.success("Icon updated"); return; }
    const { error } = await supabase.from("todos").update({ icon }).eq("id", id);
    if (error) { toast.error("Failed to update icon"); fetchData(); } else toast.success("Icon updated");
  };

  const handleUpdateDescription = async (id: string, description: string | null) => {
    if (description !== null) {
      const validated = todoSchema.shape.description.safeParse(description);
      if (!validated.success) { toast.error(validated.error.errors[0]?.message || "Description too long"); return; }
    }
    const newTodos = todos.map((t) => t.id === id ? { ...t, description } : t);
    setTodos(newTodos);
    if (isGuest) { persistGuest(newTodos); toast.success("Description updated"); return; }
    const { error } = await supabase.from("todos").update({ description }).eq("id", id);
    if (error) { toast.error("Failed to update description"); fetchData(); } else toast.success("Description updated");
  };

  const handleTransferTodo = async (id: string, newDividerId: string) => {
    const newTodos = todos.map((t) => t.id === id ? { ...t, dividerId: newDividerId } : t);
    setTodos(newTodos);
    if (isGuest) { persistGuest(newTodos); toast.success("Habit moved"); return; }
    const { error } = await supabase.from("todos").update({ divider_id: newDividerId }).eq("id", id);
    if (error) { toast.error("Failed to move"); fetchData(); } else toast.success("Habit moved");
  };

  const handleAddTodo = async (text: string, dividerId: string, icon: string, description?: string, goalDaysPerWeek = 7, targetAmount?: number, targetUnit?: string, color?: string) => {
    const validated = todoSchema.safeParse({ text, description: description || null, icon });
    if (!validated.success) { toast.error(validated.error.errors[0]?.message || "Invalid input"); return; }
    const { text: cleanText, description: cleanDesc, icon: cleanIcon } = validated.data;
    const maxOrder = Math.max(0, ...todos.filter(t => t.dividerId === dividerId).map(t => t.order));
    const newOrder = maxOrder + 1;

    if (isGuest) {
      const newTodo: Todo = {
        id: crypto.randomUUID(), text: cleanText, description: cleanDesc || null, dividerId, icon: cleanIcon,
        createdAt: format(new Date(), "yyyy-MM-dd"), completions: [], pinned: false, order: newOrder,
        goalDaysPerWeek, targetAmount: targetAmount || null, targetUnit: targetUnit || null, color: color || null,
      };
      const newTodos = [...todos, newTodo];
      setTodos(newTodos);
      persistGuest(newTodos);
      toast.success("Habit added");
      return;
    }
    if (!userId) return;
    const { data, error } = await supabase.from("todos").insert({
      user_id: userId, divider_id: dividerId, text: cleanText, icon: cleanIcon,
      description: cleanDesc || null, completions: [], order: newOrder,
      goal_days_per_week: goalDaysPerWeek,
      target_amount: targetAmount || null,
      target_unit: targetUnit || null,
      color: color || null,
    }).select().single();
    if (error) toast.error("Failed to add habit");
    else { setTodos((prev) => [...prev, mapTodoRow(data)]); toast.success("Habit added"); }
  };

  const handleTogglePin = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    const newPinned = !todo.pinned;
    const sameDividerTodos = todos.filter((t) => t.dividerId === todo.dividerId);
    const pinnedCount = sameDividerTodos.filter((t) => t.pinned && t.id !== id).length;
    if (newPinned && pinnedCount >= 3) { toast.error("Maximum 3 pinned habits per section"); return; }
    const newTodos = todos.map((t) => t.id === id ? { ...t, pinned: newPinned } : t);
    setTodos(newTodos);
    if (isGuest) { persistGuest(newTodos); toast.success(newPinned ? "Habit pinned" : "Habit unpinned"); return; }
    const { error } = await supabase.from("todos").update({ pinned: newPinned }).eq("id", id);
    if (error) { toast.error("Failed to update"); fetchData(); } else toast.success(newPinned ? "Habit pinned" : "Habit unpinned");
  };

  const handleAddDivider = async (name: string, icon: string) => {
    const validated = dividerSchema.safeParse({ name, icon });
    if (!validated.success) { toast.error(validated.error.errors[0]?.message || "Invalid input"); return; }
    const { name: cleanName, icon: cleanIcon } = validated.data;
    if (isGuest) {
      const newDiv: Divider = { id: crypto.randomUUID(), name: cleanName, icon: cleanIcon };
      const newDividers = [...dividers, newDiv];
      setDividers(newDividers);
      persistGuest(undefined, newDividers);
      toast.success("Section added");
      return;
    }
    if (!userId) return;
    const { data, error } = await supabase.from("dividers").insert({ user_id: userId, name: cleanName, icon: cleanIcon }).select().single();
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

  const handleReorderTodos = async (todoIds: string[]) => {
    const updatedTodos = todos.map(todo => {
      const newIndex = todoIds.indexOf(todo.id);
      return newIndex !== -1 ? { ...todo, order: newIndex } : todo;
    });
    setTodos(updatedTodos);
    if (isGuest) { persistGuest(updatedTodos); return; }
    const updates = todoIds.map((id, index) =>
      supabase.from("todos").update({ order: index }).eq("id", id)
    );
    await Promise.all(updates);
  };

  return { todos, dividers, loading, handleToggleDay, handleToggleToday, handleEdit, handleDelete, handleUpdateIcon, handleUpdateDescription, handleTransferTodo, handleAddTodo, handleAddDivider, handleDeleteDivider, handleTogglePin, handleReorderTodos, refetch: fetchData };
};
