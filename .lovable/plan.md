# Glassmorphism Revamp + Crash Fix

A full, all-at-once visual overhaul to a premium glass UI inspired by your reference images, plus a fix for the FloatingAIChat / Notebook crash blocking the app.

## 0. Critical fix first (P0)

The white screen is caused by a **broken `<button>` JSX tag in `src/components/FloatingAIChat.tsx` line 380** — the `className` string is unterminated, so Vite throws a syntax error and the entire app crashes (which is why the Notebook button also "breaks" — it never mounts). Fix: properly close the className string and the opening tag before `<MessageSquare />`. After this, both Chat and Notebook work again.

## 1. Design system foundation

Update `src/index.css` + `tailwind.config.ts`:

- New tokens: `--glass-bg`, `--glass-border`, `--glass-highlight`, `--glass-shadow`, `--theme-glow`, `--theme-tint`. All resolve from current `--primary`, so they auto-react to Orange/Purple/Maroon/etc.
- New utilities:
  - `.glass-panel` — backdrop-blur 24px, saturate 180%, layered inset highlight + outer theme-tinted glow border (image #1/#2 inspiration).
  - `.glass-panel-strong` — heavier blur for modals/auth.
  - `.glass-border-glow` — animated 1px gradient border using primary → transparent (the "hint of theme on the border" you liked).
  - `.glass-button` — rounded-full pill, gradient sheen on top, theme glow underneath (image #5).
  - `.glass-icon` — square rounded-2xl glass tile for wrapping any Lucide icon.

## 2. Glassy icons everywhere (chosen approach: CSS-styled Lucide)

Best of both worlds — keeps your 100+ icon set & all keyword logic intact, gets the look of image #3.

- New component `src/components/ui/GlassIcon.tsx`:
  - Wraps any Lucide icon in a rounded-2xl tile with: gradient bg (`from-primary/30 to-primary/5`), inset white highlight (top-left), backdrop-blur, theme-tinted outer glow.
  - Sizes: `sm | md | lg | xl`.
  - Variants: `default | strong | soft`.
- Refactor usage sites to wrap icons via `<GlassIcon icon={Star} />`:
  - `TodoItem.tsx`, `TodoDivider.tsx`, `IconPickerGrid.tsx`, `AddTodoDialog.tsx`, `AddDividerDialog.tsx`, `Navbar.tsx`, `ToolsView.tsx`, `EventsView.tsx`, `JournalView.tsx`, `NotebookView.tsx`, `Header.tsx`.
- `getIconComponent()` in `src/lib/icons.ts` is unchanged — only rendering changes.

## 3. Animated theme-reactive background

New `src/components/ThemeBackground.tsx` mounted in `App.tsx` (fixed, `inset-0`, `-z-10`, `pointer-events-none`):

- 3 large blurred radial orbs using `hsl(var(--primary))` with low alpha, each animated via CSS keyframes (slow 30–60s drift + pulse).
- A subtle perspective grid overlay (CSS, theme-tinted) at the bottom (image #7 inspiration).
- A faint noise texture (data URI SVG) for premium feel.
- Light theme variant: pastel orbs, lower opacity. Auto-switches via existing `.light-theme` / `.dark-theme` classes from `useTheme`.
- Body background simplified — heavy lifting moves into this component so it stays consistent across all pages.

## 4. Auth pages (image #1, #2)

Rewrite `src/pages/Auth.tsx`:

- Centered glass card, max-w-md, `glass-panel-strong` + animated `glass-border-glow`.
- Big "Welcome back" title, subtitle, glassy email input with a circular gradient submit button on the right (image #2).
- "OR" divider with thin lines.
- Glassy "Continue with Google" / "Continue as Guest" buttons (image #2 style).
- Link to sign-up (theme-tinted).
- Keep all existing Supabase auth logic and `useAuth` flow — purely presentational change.

## 5. Buttons & inputs (image #5)

`src/components/ui/button.tsx`: add new variants `glass`, `glass-primary`, `glass-icon`. Existing variants kept for backward compat.

`src/components/ui/input.tsx` + `textarea.tsx`: glass background + theme focus ring.

Apply across: dialogs, forms, AddTodoDialog, AddDividerDialog, Pomodoro/Stopwatch/Breathing controls.

## 6. Schedule view (image #6)

Rewrite `src/components/EventsView.tsx` layout (logic untouched):

- Big month/year header with chevron, day-strip pills horizontally scrollable. Today's pill = `glass-panel` + theme glow.
- Vertical timeline with time labels on the left (e.g. `10 am / 02 pm`), dashed connectors between events.
- Each event = glass card, status chip ("Active now" / "Upcoming" / "Done") in top-left tab style, title + subtitle, progress bar on the right.
- ACTIVE NOW pulse preserved.

## 7. Other view polish

- `Header.tsx`, `Navbar.tsx`: convert to `glass-panel` + glass-icon nav items, theme-tinted active underline.
- `FloatingAIChat.tsx`: glass-panel chat window, glassy input pill, send button as gradient circle (after fixing the crash).
- `NotebookView.tsx`, `Note/Doc Dialog`: glass cards, glass icons.
- `ToolsView.tsx`, `Pomodoro/Stopwatch/Breathing`: glass-panel cards with elastic glass sliders.
- `AnalyticsView.tsx`, `JournalView.tsx`: glass-panel sections, glass icons on stats.
- `OnboardingDialog.tsx` / `PremadeTodoChooser.tsx`: glass cards, glass-icon todo chips.

## 8. Memory updates

Add `mem://style/glass-revamp` describing the new system; update Core to "Full glassmorphism v2: glass-panel/glass-icon/glass-button utilities, theme-reactive animated orb background, removed Aurora opt-in." Remove Aurora memory.

---

## Technical notes

- All colors stay HSL via existing tokens — no hard-coded values.
- Performance: backdrop-blur only on actual glass surfaces (cards/buttons), NOT on the animated background itself (orbs are pre-blurred via `filter: blur()` on static elements). This keeps fps high even on low-end devices.
- No new heavy deps. No WebGL/canvas. Pure CSS + existing Lucide.
- Dark + light themes both supported; light variant uses lower-opacity glass and softer orb colors.
- Existing functional logic (auth, todos, schedule, notebook, AI chat, hooks) is untouched — only rendering and styling change.

## Files

**New:** `src/components/ui/GlassIcon.tsx`, `src/components/ThemeBackground.tsx`
**Edited:** `src/index.css`, `tailwind.config.ts`, `src/App.tsx`, `src/pages/Auth.tsx`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`, `src/components/FloatingAIChat.tsx` (crash fix + glass), `src/components/Header.tsx`, `src/components/Navbar.tsx`, `src/components/EventsView.tsx`, `src/components/NotebookView.tsx`, `src/components/notebook/NoteDialog.tsx`, `src/components/notebook/DocDialog.tsx`, `src/components/TodoItem.tsx`, `src/components/TodoDivider.tsx`, `src/components/IconPickerGrid.tsx`, `src/components/AddTodoDialog.tsx`, `src/components/AddDividerDialog.tsx`, `src/components/ToolsView.tsx`, `src/components/PomodoroTimer.tsx`, `src/components/Stopwatch.tsx`, `src/components/BreathingExercise.tsx`, `src/components/AnalyticsView.tsx`, `src/components/JournalView.tsx`, `src/components/OnboardingDialog.tsx`, `src/components/PremadeTodoChooser.tsx`.
