

# CRITIQS Mega Feature Update

This is a very large request with 15+ features. I'll prioritize them into phases to avoid breaking the site. Here's the full plan:

---

## Phase 1: Core UX Changes (High Priority)

### 1. Auto Guest Mode + Premade Todo Chooser
- Remove redirect to `/auth` for new users — auto-enter guest mode
- Replace the onboarding dialog with a **"Choose Your Habits"** screen shown to guests on first visit
- Premade habit categories: Morning Routine, Health, Productivity, Mindfulness, Fitness, Learning
- Each category shows 4-5 selectable habits with icons
- User picks what they want, sections + todos are created in localStorage
- "Sign up later" banner stays subtle at top

**Files**: `src/pages/Index.tsx`, `src/pages/Auth.tsx`, new `src/components/PremadeTodoChooser.tsx`

### 2. Theme Color: Maroon & White
- Update CSS variables: primary from orange (`24 95% 53%`) to maroon (`0 60% 35%`)
- Foreground stays white, accent becomes maroon
- Update all ambient orb colors, glow effects, gradients
- Update button gradients in Auth page and elsewhere

**Files**: `src/index.css`, `index.html` (theme-color meta)

### 3. Streak System with Freeze Logic
- Add `streak` and `streakFreezeDate` fields to the `Todo` type
- Calculate streak per habit: consecutive days completed ending at today
- **Freeze rule**: If user misses 1 day, streak doesn't reset — it freezes. Shows "⏸ Frozen — complete today to unfreeze". If missed again, streak resets to 0
- Display streak count with golden flame icon next to each todo
- Golden color (`#FFD700`) for streak display

**DB Migration**: Add `streak` (int, default 0), `streak_freeze_date` (text, nullable) columns to `todos` table
**Files**: `src/types/todo.ts`, `src/hooks/useTodos.ts`, `src/components/TodoItem.tsx`

### 4. Better Loading Screen
- Replace plain spinner with branded CRITIQS logo + pulsing animation
- Add a loading progress bar or shimmer skeleton for the todo list

**Files**: `src/pages/Index.tsx`

---

## Phase 2: Todo Enhancements

### 5. Goal Setting (e.g., "3 days a week")
- Add `goalDaysPerWeek` field to Todo (1-7, default 7)
- Show goal progress: "3/3 this week ✓" or "1/3 this week"
- Add goal selector in AddTodoDialog (slider or dropdown)

**DB Migration**: Add `goal_days_per_week` (int, default 7) to `todos`
**Files**: `src/types/todo.ts`, `src/components/AddTodoDialog.tsx`, `src/components/TodoItem.tsx`, `src/hooks/useTodos.ts`

### 6. Amount & Time per Habit (e.g., "1 time, 15 minutes")
- Add `targetAmount` (int) and `targetUnit` (text: "times", "minutes", "pages", etc.) fields
- Display on todo card: "1x · 15 min"
- Input fields in AddTodoDialog

**DB Migration**: Add `target_amount` (int, nullable), `target_unit` (text, nullable) to `todos`
**Files**: `src/types/todo.ts`, `src/components/AddTodoDialog.tsx`, `src/components/TodoItem.tsx`

### 7. Color per Todo
- Add `color` field to Todo (hex string, nullable)
- Show as a thin left-border accent or tinted icon background
- Color picker (6-8 preset colors) in AddTodoDialog

**DB Migration**: Add `color` (text, nullable) to `todos`
**Files**: `src/types/todo.ts`, `src/components/AddTodoDialog.tsx`, `src/components/TodoItem.tsx`

### 8. Daily Reminder Section
- Add a "Daily Reminders" section at the top or bottom of todos view
- Quick-add text reminders that show every day (not trackable, just visible)
- Stored separately or as a special divider type

**DB Migration**: Add `reminders` table or use a flag on todos
**Files**: New `src/components/DailyReminders.tsx`, `src/pages/Index.tsx`

---

## Phase 3: Analytics Overhaul

### 9. Calendar-Based Analytics
- Replace current bar chart with a **monthly calendar heatmap** (like GitHub contributions)
- Each day cell shows completion percentage via color intensity
- Stats panel below calendar:
  - Current streak (longest consecutive days with >0% completion)
  - Todos finished: `X/Y`
  - Completion rate: `XX%`
- Keep period selector but make "Monthly" the default view with calendar

**Files**: `src/components/AnalyticsView.tsx`

---

## Phase 4: Tools Expansion

### 10. Pomodoro Timer
- 25/5 minute work/break cycle with customizable durations
- Visual circular countdown timer
- Session counter, notification on completion

**Files**: New `src/components/PomodoroTimer.tsx`, `src/components/ToolsView.tsx`

### 11. Stopwatch
- Simple start/stop/reset stopwatch
- Lap recording capability

**Files**: New `src/components/Stopwatch.tsx`, `src/components/ToolsView.tsx`

---

## Phase 5: Journal / Notes Section

### 12. Midnight Journal
- Add "Journal" tab in the Header (between Schedule and Tools)
- Simple note entry with date
- Midnight reminder notification via service worker
- Glass-card styled text area, one entry per day
- Stored in existing `mood_notes` table (reuse the `note` field)

**Files**: New `src/components/JournalView.tsx`, `src/components/Header.tsx`, `src/pages/Index.tsx`, `src/lib/notifications.ts`

---

## Database Migration (Single Migration)

```sql
ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS goal_days_per_week integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS target_amount integer,
  ADD COLUMN IF NOT EXISTS target_unit text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_freeze_date text;
```

---

## Summary of New/Modified Files

| Action | File |
|--------|------|
| Edit | `src/index.css` (maroon theme) |
| Edit | `index.html` (theme-color) |
| Edit | `src/types/todo.ts` (new fields) |
| Edit | `src/hooks/useTodos.ts` (streak logic, new fields) |
| Edit | `src/components/TodoItem.tsx` (streak, color, goal, amount display) |
| Edit | `src/components/AddTodoDialog.tsx` (goal, amount, color pickers) |
| Edit | `src/components/AnalyticsView.tsx` (calendar heatmap) |
| Edit | `src/components/ToolsView.tsx` (add pomodoro, stopwatch) |
| Edit | `src/components/Header.tsx` (add Journal tab) |
| Edit | `src/pages/Index.tsx` (guest auto-login, journal tab, loading screen, reminders) |
| Edit | `src/pages/Auth.tsx` (remove auto-redirect for new visitors) |
| Edit | `src/lib/notifications.ts` (midnight reminder) |
| Create | `src/components/PremadeTodoChooser.tsx` |
| Create | `src/components/PomodoroTimer.tsx` |
| Create | `src/components/Stopwatch.tsx` |
| Create | `src/components/JournalView.tsx` |
| Create | `src/components/DailyReminders.tsx` |

This is approximately 18 files across 5 phases. Implementation will proceed phase by phase to avoid breaking anything.

