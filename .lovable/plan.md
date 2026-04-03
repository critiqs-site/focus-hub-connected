

# Phase 2 Fixes & Improvements

## 1. Daily Reminders — Smaller + Persistent + Easier UX

**Problem**: Quote card is too big, "Manage Reminders" is confusing for new users, and reminders disappear between sessions.

**Fix**:
- Edit `src/components/DailyReminders.tsx`:
  - **Shrink the quote card**: Reduce padding from `p-6` to `p-4`, quote icon from `h-8 w-8` to `h-5 w-5`, text from `text-lg` to `text-base`. Keep it compact — 2-3 lines max
  - **Persistence**: Already uses `localStorage` with key `daily_reminders` — investigate why it's not loading. Likely the `REMINDERS_KEY` or the component is re-mounting. Add a `console.log` guard and ensure `useEffect` runs correctly. The load logic looks correct; the issue may be that `randomIndex` defaults to 0 but `reminders` is empty on first render causing `reminders[0]?.text` to be undefined — this is already handled. Need to verify the localStorage key hasn't been cleared elsewhere
  - **Simpler UX**: Replace "Manage Reminders" toggle with an inline "+" button next to the refresh button. When clicked, show an input field directly below the quote. Show a small "x" on each reminder only when in edit mode. Add an "Edit" pencil icon button to enter edit mode — much more intuitive than "Manage Reminders"
  - When no reminders exist, show a smaller dashed-border card saying "Add a daily reminder to stay motivated" with a + button

## 2. Show All / Show Fewer — Progressive Loading

**Problem**: "Top 3" currently shows 3 and stops. User wants progressive "Show more" that reveals 3 more each time.

**Fix**:
- Edit `src/pages/Index.tsx`:
  - Add state `visibleCount` (default: Infinity for "All" mode, 3 for "Fewer" mode)
  - When "Top 3" is selected: set `visibleCount = 3`
  - When "All" is selected: set `visibleCount = Infinity`
  - Slice `remainingTodos` to `visibleCount` before passing to `renderTodoSection`
  - If `visibleCount < remainingTodos.length`, show a "Show more" button below todos that increments `visibleCount += 3`
  - Reset `visibleCount` when toggling between All/Fewer

## 3. Schedule View Rework

**Problem**: "Coming Up" shows "Next" even when something is active. Schedule stream is notification-style stacked cards instead of time-slot sections. Theme colors hardcoded as orange in schedule.

**Fix** — Edit `src/components/EventsView.tsx`:

### 3a. Coming Up — Show Active Event
- Compute `activeEvent` using `getEventStatus(e) === "active"` 
- If `activeEvent` exists: show it with pulsing dot + "ACTIVE NOW" label + time range, instead of "Next"
- Below active, show exactly 1 "NEXT" event (the next upcoming non-completed one)
- If no active event: show "NEXT" as current behavior but only 1 event

### 3b. Schedule Stream — Time-Slot Sections
- Instead of stacked notification cards, group events by their start hour
- Render as timeline: left side shows hour label (e.g., "9 PM"), right side shows the event card with title + duration (e.g., "1 hour")
- Each event card is a larger block with rounded corners, proper spacing between time slots
- Layout reference (from uploaded image): time label on left, event block spanning to the right with title + duration badge

### 3c. Theme-Aware Colors
- Replace all hardcoded `hsla(24, 95%, 53%, ...)` with `hsl(var(--primary) / opacity)` using template literals
- Active event glow, background gradient, border — all should use `var(--primary)`

### 3d. Per-Event Color Tinting
- Add optional `color` field to `ScheduledEvent` type in `src/types/todo.ts`
- In manual add form: add a small color picker (green, red, yellow, blue, purple, or "auto")
- In AI generation: have the edge function return a `color` field based on event category (break=green, work=red, play=yellow, study=blue, exercise=purple)
- Edit `supabase/functions/schedule-ai/index.ts`: add color assignment to the AI prompt instructions
- The event card background uses the assigned color tint instead of primary
- Need to add `color` column to `scheduled_events` table via migration
- Edit `src/hooks/useEvents.ts`: map `color` field from DB

## 4. Journal — View Older Entries

**Problem**: Journal only shows today's entry, no way to browse past entries.

**Fix** — Edit `src/components/JournalView.tsx`:
- Add a date navigator (left/right arrows + date display) above the journal form
- State: `selectedDate` (default: today)
- When navigating to a past date: load that date's entry (from Supabase or localStorage)
- Past entries are read-only (dimmed save button, or just view mode)
- Today's entry remains editable
- For guests: iterate through `guest_journal` localStorage keys
- Add a "Today" button to quickly jump back to current date

---

## Files Summary

| Action | File |
|--------|------|
| Edit | `src/components/DailyReminders.tsx` (smaller, simpler UX) |
| Edit | `src/pages/Index.tsx` (progressive show more) |
| Edit | `src/components/EventsView.tsx` (active now, timeline layout, theme colors, per-event color) |
| Edit | `src/components/JournalView.tsx` (date navigator for older entries) |
| Edit | `src/types/todo.ts` (add color to ScheduledEvent) |
| Edit | `src/hooks/useEvents.ts` (map color field) |
| Edit | `supabase/functions/schedule-ai/index.ts` (add color to AI output) |
| Create | Migration for `color` column on `scheduled_events` |

