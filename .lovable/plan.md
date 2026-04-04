

# Phase 2 Fixes Plan

## 1. Goal-Based Auto-Skip for Non-Required Days

**Problem**: Todos with goals like "4 days/week" show as remaining even on days they don't need to be done. User wants non-scheduled days to appear as already done.

**Fix** in `src/pages/Index.tsx`:
- When filtering `remainingTodos` and `doneTodos`, check if today is a "suggested day" for the todo's goal
- If `todo.goalDaysPerWeek < 7` and today's index in the fixed week is NOT in `getSuggestedDays(todo.goalDaysPerWeek)`, AND the todo is not already completed today, treat it as "done" (move to Done section with a "Not scheduled today" indicator)
- Import `getSuggestedDays` logic (or move to utils) and `getFixedWeekDays` to determine today's day index

**Also edit** `src/components/TodoItem.tsx`: Add a subtle "rest day" indicator when the todo appears in Done but wasn't actually completed

## 2. Todo Load-In Animation (Staggered)

**Fix** in `src/pages/Index.tsx` and `src/index.css`:
- Add staggered `animation-delay` to each `TodoItem` wrapper based on index
- In `src/index.css`: Add a `@keyframes todo-slide-in` animation (translateY(20px) + opacity 0 → 0 + 1)
- Apply class `animate-todo-in` with `animation-fill-mode: backwards` so each item appears sequentially
- Each item gets `style={{ animationDelay: '${index * 80}ms' }}`

## 3. Analytics Fixes + Bar Chart

**Problem**: Analytics may not properly track past days (it uses `calculateDailyPercentage` which checks `todos.completions` — this should work since completions persist). The real issue is the heatmap uses hardcoded maroon colors instead of theme-aware primary.

**Fix** in `src/components/AnalyticsView.tsx`:
- Replace hardcoded `hsla(0, 60%, 35%, ...)` in `getHeatColor` with `hsl(var(--primary) / opacity)` values
- Add a **monthly bar chart** below the calendar heatmap:
  - For each day of the viewed month (up to today), render a vertical bar
  - Bar height = completion percentage (0-100%)
  - X-axis = day numbers, Y-axis implied by bar height
  - Use primary color for bars
  - Pure CSS/div-based chart (no library needed)
  - Show day labels every 5 days to avoid clutter

## 4. Schedule — Smaller "Next" Card + Lower Color Opacity

**Fix** in `src/components/EventsView.tsx`:
- **Next card**: Reduce padding from `p-5 lg:p-6` to `p-3 lg:p-4`, reduce title font from `text-xl lg:text-2xl` to `text-lg`, reduce countdown font
- **Event colors**: In `EVENT_COLORS`, reduce background opacity from `0.12` to `0.06`, border from `0.3` to `0.15` — more subtle tinting

## 5. Journal — Calendar with Entry Indicators

**Fix** in `src/components/JournalView.tsx`:
- Replace the simple chevron date navigator with a proper calendar (using existing `Calendar` component from shadcn)
- Fetch all journal dates that have entries (from Supabase: `select date from mood_notes where user_id = ?` or from guest localStorage)
- On the calendar, highlight dates that have journal entries with a colored dot (primary color)
- Clicking a date loads that entry
- Keep the "Today" button for quick navigation
- Past entries remain read-only

## 6. Verify Tools Work

**What**: The tools (Pomodoro, Stopwatch, Breathing) are standalone React components — they should work. No code changes needed unless broken. Will not modify unless issues found.

---

## Files Summary

| Action | File |
|--------|------|
| Edit | `src/pages/Index.tsx` (goal-based auto-skip, staggered animation delays) |
| Edit | `src/components/TodoItem.tsx` (rest day indicator) |
| Edit | `src/index.css` (todo-slide-in keyframes) |
| Edit | `src/components/AnalyticsView.tsx` (theme-aware heatmap colors, bar chart) |
| Edit | `src/components/EventsView.tsx` (smaller Next card, lower color opacity) |
| Edit | `src/components/JournalView.tsx` (calendar with entry dots) |
| Edit | `src/lib/utils.ts` (export getSuggestedDays if needed) |

