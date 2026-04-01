

# Phase 1 Rework Plan

## 1. Theme Selection System

**What**: Add a "Theme" button in the UserProfileMenu (for registered users only; guests see "Register"). Clicking opens a theme picker dialog with 6+ themes.

**Themes** (each sets CSS variables on `:root` + persists to `localStorage`):
- **Orange & Black** (default) — `--primary: 24 95% 53%`, dark bg
- **Purple & Black** — `--primary: 270 60% 50%`, dark bg
- **Maroon & Black** — `--primary: 0 60% 35%`, dark bg
- **Red & White** — `--primary: 0 70% 50%`, light bg (`--background: 0 0% 98%`, `--foreground: 0 0% 10%`)
- **Orange & White** — `--primary: 24 95% 53%`, light bg
- **Purple & White** — `--primary: 270 60% 50%`, light bg

**Files**:
- New `src/components/ThemePicker.tsx` — grid of color swatches in a dialog, each swatch shows primary color + bg preview
- New `src/hooks/useTheme.ts` — reads/writes `localStorage("critiqs-theme")`, applies CSS vars to `document.documentElement.style`
- Edit `src/components/UserProfileMenu.tsx` — add "Theme" menu item for registered users
- Edit `src/index.css` — revert primary back to orange as default; update body background/glass-card/glass-button to use `hsl(var(--primary))` instead of hardcoded maroon HSL values. All hardcoded `hsla(0, 60%, 35%, ...)` references get replaced with `var(--primary)` references
- Edit `src/pages/Index.tsx` — call `useTheme()` at top level
- Edit `src/components/PremadeTodoChooser.tsx` — replace hardcoded maroon colors with `hsl(var(--primary))`

**Light theme handling**: For white-bg themes, swap `--background`, `--foreground`, `--card`, `--secondary`, `--muted`, `--border` to light values. The `useTheme` hook applies a complete variable set per theme.

---

## 2. Better Todo Icons & Per-Todo Color

**What**: Replace existing premade habit icons with bolder, more distinctive ones. Each todo gets a color from 4 presets (Orange, Maroon, Blue, Purple) — default matches current theme primary.

**Changes**:
- Edit `src/components/AddTodoDialog.tsx`:
  - Remove Amount & Unit fields (delete `targetAmount`/`targetUnit` inputs)
  - Replace 8-color picker with 4 colors: Orange `#E67E22`, Maroon `#8B1A1A`, Blue `#3498DB`, Purple `#9B59B6` + a "Theme" option (uses current theme primary)
- Edit `src/components/TodoItem.tsx`: Remove `targetAmount`/`targetUnit` display
- Edit `src/components/PremadeTodoChooser.tsx`: Update habit icons to bolder choices where applicable

---

## 3. Goal Slider Fix & Smart Day Spacing

**What**: Make the goal slider smoother and implement comfortable day spacing.

**Changes**:
- Edit `src/components/ui/slider.tsx` — increase thumb size, add smooth cursor styling
- Edit `src/components/AddTodoDialog.tsx` — the slider already works, just ensure it's smooth (it likely is; the `step={1}` is correct for 1-7)
- Edit `src/components/TodoItem.tsx` — implement spaced day selection logic: for goal=3 on a 7-day week, highlight days 1, 3, 5 (evenly spaced with gaps). The circles for "goal days" get a subtle indicator showing which days are "suggested"

**Smart spacing algorithm**: For `goalDays` out of 7, calculate evenly spaced indices: `Math.round(i * 7 / goalDays)` for `i = 0..goalDays-1`. Show a subtle dot/ring on those day circles to indicate "recommended days."

---

## 4. Premade Todos Rework

**What**: Replace the category-based habit chooser with a simple flow: enter name → pick from a flat list of 10 premade habits (select at least 1).

**Premade habits**:
1. Meditate for 5 minutes (Brain)
2. Exercise for 10 minutes (Dumbbell)
3. Call my parents at night (Phone)
4. Drink 2L of water (Droplets)
5. Read for 15 minutes (BookOpen)
6. Sleep before midnight (Moon)
7. No junk food today (Apple)
8. Write in my journal (Pencil)
9. Walk 10,000 steps (Footprints)
10. Practice gratitude (Smile)

**Changes**:
- Rewrite `src/components/PremadeTodoChooser.tsx` — two-step flow:
  1. Name input
  2. Flat checklist of 10 habits with icons, select ≥1
  3. "Get Started" button creates a single "My Habits" divider + selected todos
- Edit `src/pages/Index.tsx` — pass name to chooser, save guest name to localStorage
- Edit `src/components/OnboardingDialog.tsx` — for registered users, replace interests selection with the same 10 habit picker. Save name to profile, create todos.

---

## 5. Better Loading Screen

**What**: Circular loading animation with CRITIQS logo inside. Shows until ALL data (todos, events, profile) is ready.

**Changes**:
- Edit `src/pages/Index.tsx` — replace both loading states with a centered logo inside a spinning ring (CSS border animation or SVG circle). Wait for `!authLoading && !todosLoading && !eventsLoading`.
- Edit `src/index.css` — add `@keyframes spinRing` for the circular loader

---

## 6. Auto-reload (Service Worker)

The service worker (`public/sw.js`) already uses network-first for HTML and hashed assets are cache-busted by Vite. This is already working — no changes needed. The `sw.js` with `CACHE_NAME = "critiqs-v" + Date.now()` ensures new deployments invalidate old caches.

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/components/ThemePicker.tsx` |
| Create | `src/hooks/useTheme.ts` |
| Edit | `src/components/UserProfileMenu.tsx` (add Theme button) |
| Edit | `src/index.css` (orange default, CSS var references, loader animation) |
| Edit | `src/components/AddTodoDialog.tsx` (remove amount/unit, 4-color picker) |
| Edit | `src/components/TodoItem.tsx` (remove amount/unit, add goal day indicators) |
| Edit | `src/components/ui/slider.tsx` (smoother thumb) |
| Edit | `src/components/PremadeTodoChooser.tsx` (name + flat 10-habit picker) |
| Edit | `src/components/OnboardingDialog.tsx` (name + 10-habit picker) |
| Edit | `src/pages/Index.tsx` (useTheme, unified loading screen) |

