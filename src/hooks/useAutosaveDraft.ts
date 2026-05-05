import { useEffect, useRef } from "react";

const DRAFT_PREFIX = "notebook_draft:";

export function draftKey(scope: "note" | "doc", id?: string) {
  return `${DRAFT_PREFIX}${scope}:${id || "new"}`;
}

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch { return null; }
}

export function clearDraft(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

/** Debounced autosave to localStorage. */
export function useAutosaveDraft<T>(key: string, value: T, enabled = true, delay = 300) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!enabled) return;
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }, delay);
    return () => { if (t.current) clearTimeout(t.current); };
  }, [key, value, enabled, delay]);
}