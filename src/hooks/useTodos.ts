import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, isAfter, isSameDay } from "date-fns";
import type { Todo, Divider } from "@/types/todo";

export const useTodos = (userId: string | undefined) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [dividers, setDividers] = useState<Divider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [dividersRes, todosRes] = await Promise.all([
      supabase.from("dividers").select("*").order("created_at"),
      supabase.from("todos").select("*").order("created_at"),
    ]);

    if (dividersRes.error) {
      console.error("Dividers error:", dividersRes.error);
    } else {
      setDividers(
        dividersRes.data.map((d) => ({
          id: d.id,
          name: d.name,
          icon: d.icon,
        }))
      );
    }

    if (todosRes.error) {
      console.error("Todos error:", todosRes.error);
    } else {
      setTodos(
        todosRes.data.map((t) => ({
          id: t.id,
          text: t.text,
          dividerId: t.divider_id,
          icon: t.icon,
          createdAt: format(new Date(t.created_at), "yyyy-MM-dd"),
          completions: t.completions || [],
        }))
      );
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleDay = async (id: string, dayIndex: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const targetDate = addDays(new Date(todo.createdAt), dayIndex);
    const todayDate = new Date();

    if (isAfter(targetDate, todayDate) && !isSameDay(targetDate, todayDate)) {
      return;
    }

    const dateStr = format(targetDate, "yyyy-MM-dd");
    let newCompletions: string[];

    if (todo.completions.includes(dateStr)) {
      newCompletions = todo.completions.filter((d) => d !== dateStr);
    } else {
      newCompletions = [...todo.completions, dateStr];
    }

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completions: newCompletions } : t))
    );

    const { error } = await supabase
      .from("todos")
      .update({ completions: newCompletions })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
      fetchData();
    }
  };

  const handleEdit = async (id: string, text: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));

    const { error } = await supabase.from("todos").update({ text }).eq("id", id);

    if (error) {
      toast.error("Failed to update");
      fetchData();
    } else {
      toast.success("Habit updated");
    }
  };

  const handleDelete = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));

    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete");
      fetchData();
    } else {
      toast.success("Habit deleted");
    }
  };

  const handleAddTodo = async (text: string, dividerId: string, icon: string) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("todos")
      .insert({
        user_id: userId,
        divider_id: dividerId,
        text,
        icon,
        completions: [],
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add habit");
    } else {
      setTodos((prev) => [
        ...prev,
        {
          id: data.id,
          text: data.text,
          dividerId: data.divider_id,
          icon: data.icon,
          createdAt: format(new Date(data.created_at), "yyyy-MM-dd"),
          completions: data.completions || [],
        },
      ]);
      toast.success("Habit added");
    }
  };

  const handleAddDivider = async (name: string, icon: string) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("dividers")
      .insert({ user_id: userId, name, icon })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add section");
    } else {
      setDividers((prev) => [
        ...prev,
        { id: data.id, name: data.name, icon: data.icon },
      ]);
      toast.success("Section added");
    }
  };

  const handleDeleteDivider = async (id: string) => {
    setDividers((prev) => prev.filter((d) => d.id !== id));
    setTodos((prev) => prev.filter((t) => t.dividerId !== id));

    const { error } = await supabase.from("dividers").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete section");
      fetchData();
    } else {
      toast.success("Section deleted");
    }
  };

  return {
    todos,
    dividers,
    loading,
    handleToggleDay,
    handleEdit,
    handleDelete,
    handleAddTodo,
    handleAddDivider,
    handleDeleteDivider,
    refetch: fetchData,
  };
};
