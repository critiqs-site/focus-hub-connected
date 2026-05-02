import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  locked: boolean;
  last_visited_at: string;
  created_at: string;
  updated_at: string;
}

export interface Doc {
  id: string;
  title: string;
  short_description: string;
  body: string;
  pinned: boolean;
  locked: boolean;
  last_visited_at: string;
  created_at: string;
  updated_at: string;
}

const GUEST_NOTES_KEY = "guest_notes";
const GUEST_DOCS_KEY = "guest_docs";

function readGuest<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function writeGuest<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const useNotebook = (userId: string | undefined) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const isGuest = !userId;

  const load = useCallback(async () => {
    setLoading(true);
    if (isGuest) {
      setNotes(readGuest<Note>(GUEST_NOTES_KEY));
      setDocs(readGuest<Doc>(GUEST_DOCS_KEY));
      setLoading(false);
      return;
    }
    const [n, d] = await Promise.all([
      supabase.from("notes").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
      supabase.from("docs").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    ]);
    if (n.data) setNotes(n.data as Note[]);
    if (d.data) setDocs(d.data as Doc[]);
    setLoading(false);
  }, [userId, isGuest]);

  useEffect(() => { load(); }, [load]);

  // ===== Notes =====
  const saveNote = async (input: Partial<Note> & { id?: string }) => {
    const now = new Date().toISOString();
    if (isGuest) {
      const list = readGuest<Note>(GUEST_NOTES_KEY);
      if (input.id) {
        const idx = list.findIndex(x => x.id === input.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...input, updated_at: now } as Note;
      } else {
        list.unshift({
          id: crypto.randomUUID(), title: input.title || "", body: input.body || "",
          pinned: false, locked: false,
          last_visited_at: now, created_at: now, updated_at: now,
        });
      }
      writeGuest(GUEST_NOTES_KEY, list);
      setNotes([...list]);
      return;
    }
    if (input.id) {
      const { error } = await supabase.from("notes").update({
        title: input.title, body: input.body, pinned: input.pinned, locked: input.locked,
      }).eq("id", input.id);
      if (error) { toast.error("Failed to save note"); return; }
    } else {
      const { error } = await supabase.from("notes").insert({
        user_id: userId!, title: input.title || "", body: input.body || "",
      });
      if (error) { toast.error("Failed to create note"); return; }
    }
    await load();
  };

  const deleteNote = async (id: string) => {
    if (isGuest) {
      const list = readGuest<Note>(GUEST_NOTES_KEY).filter(x => x.id !== id);
      writeGuest(GUEST_NOTES_KEY, list);
      setNotes(list);
      return;
    }
    await supabase.from("notes").delete().eq("id", id);
    await load();
  };

  const togglePinNote = async (id: string, pinned: boolean) => {
    if (isGuest) return saveNote({ id, pinned });
    await supabase.from("notes").update({ pinned }).eq("id", id);
    await load();
  };

  const toggleLockNote = async (id: string, locked: boolean) => {
    if (isGuest) return; // guests cannot lock
    await supabase.from("notes").update({ locked }).eq("id", id);
    await load();
  };

  const visitNote = async (id: string) => {
    if (isGuest) return;
    await supabase.from("notes").update({ last_visited_at: new Date().toISOString() }).eq("id", id);
  };

  // ===== Docs =====
  const saveDoc = async (input: Partial<Doc> & { id?: string }) => {
    const now = new Date().toISOString();
    if (isGuest) {
      const list = readGuest<Doc>(GUEST_DOCS_KEY);
      if (input.id) {
        const idx = list.findIndex(x => x.id === input.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...input, updated_at: now } as Doc;
      } else {
        list.unshift({
          id: crypto.randomUUID(), title: input.title || "", short_description: input.short_description || "", body: input.body || "",
          pinned: false, locked: false, last_visited_at: now, created_at: now, updated_at: now,
        });
      }
      writeGuest(GUEST_DOCS_KEY, list);
      setDocs([...list]);
      return;
    }
    if (input.id) {
      const { error } = await supabase.from("docs").update({
        title: input.title, short_description: input.short_description, body: input.body,
        pinned: input.pinned, locked: input.locked,
      }).eq("id", input.id);
      if (error) { toast.error("Failed to save doc"); return; }
    } else {
      const { error } = await supabase.from("docs").insert({
        user_id: userId!, title: input.title || "", short_description: input.short_description || "", body: input.body || "",
      });
      if (error) { toast.error("Failed to create doc"); return; }
    }
    await load();
  };

  const deleteDoc = async (id: string) => {
    if (isGuest) {
      const list = readGuest<Doc>(GUEST_DOCS_KEY).filter(x => x.id !== id);
      writeGuest(GUEST_DOCS_KEY, list);
      setDocs(list);
      return;
    }
    await supabase.from("docs").delete().eq("id", id);
    await load();
  };

  const togglePinDoc = async (id: string, pinned: boolean) => {
    if (isGuest) return saveDoc({ id, pinned });
    await supabase.from("docs").update({ pinned }).eq("id", id);
    await load();
  };

  const toggleLockDoc = async (id: string, locked: boolean) => {
    if (isGuest) return;
    await supabase.from("docs").update({ locked }).eq("id", id);
    await load();
  };

  const visitDoc = async (id: string) => {
    if (isGuest) return;
    await supabase.from("docs").update({ last_visited_at: new Date().toISOString() }).eq("id", id);
  };

  return {
    notes, docs, loading, isGuest, refetch: load,
    saveNote, deleteNote, togglePinNote, toggleLockNote, visitNote,
    saveDoc, deleteDoc, togglePinDoc, toggleLockDoc, visitDoc,
  };
};

// ===== PIN helpers =====
async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function getUserPinHash(userId: string): Promise<string | null> {
  const { data } = await supabase.from("notebook_pins").select("pin_hash").eq("user_id", userId).maybeSingle();
  return data?.pin_hash ?? null;
}

export async function setUserPin(userId: string, pin: string) {
  const pin_hash = await sha256(pin + ":" + userId);
  const existing = await getUserPinHash(userId);
  if (existing) {
    await supabase.from("notebook_pins").update({ pin_hash }).eq("user_id", userId);
  } else {
    await supabase.from("notebook_pins").insert({ user_id: userId, pin_hash });
  }
}

export async function verifyUserPin(userId: string, pin: string): Promise<boolean> {
  const stored = await getUserPinHash(userId);
  if (!stored) return false;
  const candidate = await sha256(pin + ":" + userId);
  return stored === candidate;
}