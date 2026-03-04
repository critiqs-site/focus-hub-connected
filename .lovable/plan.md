

# Comprehensive UI/UX Overhaul Plan

## 1. Profile Menu → Bottom-Left Fixed Button
Move `UserProfileMenu` from the header to a fixed bottom-left floating button (mirroring the chatbot on the right).

**Files:** `src/pages/Index.tsx`, `src/components/UserProfileMenu.tsx`

---

## 2. Rolling 7-Day Todo Window (Always Shows Today)
Currently todos show 7 fixed days from `createdAt`. After day 7, they're dead.

**Fix:** Change to a rolling window: today + 6 previous days. Users can always check/uncheck today and recent days.

**Files:** `src/components/TodoItem.tsx`, `src/hooks/useTodos.ts` (update `handleToggleDay` to use date strings directly instead of day index)

---

## 3. Today vs Past Completion Visual Distinction
- **Completed TODAY** → Orange/primary filled circle (current behavior)
- **Completed on a PAST day** → Grey filled circle (muted color, clearly "already done but not today")
- **Not completed** → Empty circle with border

**File:** `src/components/TodoItem.tsx`

---

## 4. "Remaining" and "Done" Head Sections
Two virtual top-level sections that auto-sort todos:
- **Remaining**: Todos NOT completed today
- **Done**: Todos completed today (moved here automatically)

These appear above user-created dividers. User dividers still group within each head section.

**File:** `src/pages/Index.tsx` — filter todos into two groups based on today's completion, render both sections

---

## 5. Click Card/Checkbox to Toggle Today
Add a clickable checkbox area on the todo card that toggles today's date completion (no need to find today's circle).

**File:** `src/components/TodoItem.tsx` — add a checkbox/click handler on the icon area that calls `onToggleDay` for today

**File:** `src/hooks/useTodos.ts` — add a `handleToggleToday(id)` convenience method

---

## 6. Analytics: "Overall" Aggregated View + Show More
- Add an "Overall" option as the first item in the habit selector. When selected, calculate aggregated completion % across ALL todos.
- After 3 habit buttons, show "Show More" to reveal the next batch of 3.

**File:** `src/components/AnalyticsView.tsx`

---

## 7. Notes: Real Emojis Instead of Lucide Icons
Replace the Lucide mood icons (Laugh, Smile, Meh, Frown, CloudRain) with actual emoji characters: 😁 😊 😐 😢 😞

**Files:** `src/components/MoodSelector.tsx`, `src/components/NoteEntry.tsx`

---

## 8. Notes: Past Entries After Calendar
Move the "Past Entries" section to render AFTER the `YearlyCalendar` component instead of before.

**File:** `src/components/NotesSection.tsx` — reorder JSX

---

## 9. AI Chat: Direct Client Call (Skip Edge Function)
Call Pollinations API directly from the frontend. Pollinations is a free/open API — no secret key needed for basic usage. This eliminates the Supabase edge function round-trip latency.

**File:** `src/components/FloatingAIChat.tsx` — replace `supabase.functions.invoke("ai-chat")` with a direct `fetch("https://gen.pollinations.ai/v1/chat/completions")` call. Include the system prompt and context directly in the client code. Use model `openai-fast`, non-streaming.

---

## 10. Mobile Fixes
- **Todo date circles**: Make the 7-day circles scroll horizontally on mobile instead of compressing. Use `overflow-x-auto` and `flex-nowrap` with `min-w` on each circle.
- **Tab navigation**: Add a visible border/background to the tab bar, make tabs horizontally scrollable on mobile with `overflow-x-auto`.

**Files:** `src/components/TodoItem.tsx`, `src/components/Header.tsx`

---

## Files Summary

| File | Changes |
|------|---------|
| `src/components/TodoItem.tsx` | Rolling 7-day window, today vs past colors, checkbox toggle, mobile scroll fix |
| `src/hooks/useTodos.ts` | `handleToggleToday`, update `handleToggleDay` for date-based toggle |
| `src/pages/Index.tsx` | Move profile to bottom-left, Remaining/Done sections |
| `src/components/UserProfileMenu.tsx` | Restyle as fixed bottom-left floating button |
| `src/components/AnalyticsView.tsx` | Add "Overall" aggregated view, "Show More" pagination |
| `src/components/MoodSelector.tsx` | Replace Lucide icons with real emojis |
| `src/components/NoteEntry.tsx` | Use emoji instead of icon component |
| `src/components/NotesSection.tsx` | Move past entries after calendar |
| `src/components/FloatingAIChat.tsx` | Direct Pollinations API call, remove edge function dependency |
| `src/components/Header.tsx` | Mobile-friendly tabs with scroll and border |

