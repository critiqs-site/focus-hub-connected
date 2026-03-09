

## Issues to Fix

### 1. Analytics Tooltip: Orange percentage text invisible
**File**: `src/components/AnalyticsView.tsx` (line ~133)
- Change `text-primary` to `text-foreground` (white/black depending on theme) in the CustomTooltip percentage text.

### 2. "No Previous Data" showing incorrectly
**File**: `src/components/AnalyticsView.tsx` (lines 76-112)
- The weekly "previous period" uses `subDays(today, 13-i)` which gives days 7-13 ago. The issue is that the user's completion data only exists for the current rolling week (days 0-6 ago), so there's never data in the previous window.
- Fix: Align the analytics periods with the fixed-week system (see #3). The "previous week" should be the actual previous fixed week, not a rolling window.

### 3. Fix 7-day window logic: Use fixed weeks instead of rolling
**Problem**: Currently TodoItem shows days `subDays(today, 6)` through `today` — a rolling window. User wants fixed week blocks: days 1-7, 8-14, 15-21, 22-28 of the month.

**Files**: `src/components/TodoItem.tsx` (lines 49-56), `src/components/AnalyticsView.tsx`
- Create a utility function `getCurrentWeekDays()` that returns the fixed 7-day block the current date falls in:
  - Day 1-7 → shows days 1-7
  - Day 8-14 → shows days 8-14
  - Day 15-21 → shows days 15-21
  - Day 22-28+ → shows days 22-28 (or to end of month)
- Apply this same logic to `DateDisplay.tsx` and `AnalyticsView.tsx` for consistency.
- For analytics "previous period" in weekly mode, use the previous fixed week block.

### 4. Only allow marking TODAY's todo as done
**File**: `src/components/TodoItem.tsx` (lines 217-243)
- Remove the `onClick` handler from past day circles — only the current day's circle should be clickable.
- Past completed days show as read-only indicators (checkmark or filled, but no click).
- Keep the quick-toggle icon button (already toggles today only).

### Summary of changes
- **`src/lib/utils.ts`** or new utility: Add `getFixedWeekDays(date)` helper
- **`src/components/TodoItem.tsx`**: Use fixed week days, disable clicking on non-today circles
- **`src/components/DateDisplay.tsx`**: Use fixed week days
- **`src/components/AnalyticsView.tsx`**: Fix tooltip color, align weekly period with fixed weeks, fix previous period calculation

