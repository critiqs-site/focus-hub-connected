
## Plan: P0–P6 polish, AI lockdown, timezone, layout, transcription

A lot of these are small surgical edits — I'll group them sensibly. Below is the full scope. New DB column needed (timezone). New table needed (`ai_usage` for hourly characters).

---

### P0 — Onboarding, AI lockdown, model routing

**1) New-user onboarding popup (guests)**
- Today: `Index.tsx` auto-enables guest mode and reloads, then briefly shows `PremadeTodoChooser`. Issue: the reload loses `showChooser` state, so users land on the empty dashboard.
- Fix in `src/pages/Index.tsx`:
  - Drop the `window.location.reload()` after enabling guest mode — set state and continue.
  - Render `PremadeTodoChooser` whenever `isGuest && !localStorage.hasSeenChooser`, NOT only when state set during this render.
  - Require at least 1 todo (button already disabled when `selected.size === 0`; remove the "Skip — I'll add my own" link in `PremadeTodoChooser.tsx` so it's enforced).
- Auto-create **two sections** on completion: "Morning" (Sunrise icon) and "Night" (Moon icon). For each chosen habit, route to Morning or Night based on simple keyword heuristic (water/wake/exercise/breakfast/meditate → Morning; sleep/journal/read/screen/parents → Night; default Morning).
- Update `handleChooserComplete` accordingly. Guest data persists in `localStorage` via existing `useTodos` guest path.
- CTA button text → "Start Now!" as requested.

**2) AI tools are under construction (everyone)**
- Add a small flag `AI_TOOLS_UNDER_CONSTRUCTION = true` in a new `src/lib/aiAccess.ts`.
- In `ToolsView.tsx` (the AI tools section: PhysiqueRater / OutfitRater / FoodScanner): when the flag is on, replace each tool's body with a small "🚧 This feature is under construction." card. Keep the cards themselves visible (icon + title + description) so it still looks like a real feature catalog.
- Same flag check inside `PhysiqueRater`, `OutfitRater`, `FoodScanner` before any `supabase.functions.invoke` — show a `toast.warning("This feature is under construction.")` if somehow triggered (defense in depth).
- Floating chat (`FloatingAIChat`) and voice (`VoiceRecorderButton`) stay functional for now — only the *tools* are flagged. (User said "all AI tools" → tools tab. The chat + mic items are handled separately under P1 as registered-user features.)

**3) Internal AI routing (silent)**
- Edit `supabase/functions/ai-chat/index.ts`:
  - For `type === "icon-suggest"`: fetch the user's existing todo count via `supabase.from("todos").select("id", { count: "exact", head: true }).eq("user_id", user.id)`. If `count < 5` → `model: "llama-scout"`, else `model: "mistral"`.
  - Default chat: `model: "llama-scout"` (deep — chatbox is conversational/important).
- Edit `supabase/functions/schedule-ai/index.ts`: keep `model: "mistral"` (medium).
- Vision tools (Physique/Outfit/Food) already use vision-capable models; under-construction freeze means we don't touch routing now.
- Never expose model names to client — already true.

---

### P1 — Disabled AI states for unregistered users

**4) Visible-but-disabled chatbox + mic (guest users)**
- `Index.tsx`: render `<VoiceRecorderButton />` and the chat trigger ALSO when `isGuest`, but pass a new prop `disabled` / `locked`.
- In both components, when `disabled`:
  - Render the same icon at the same position.
  - On click → `toast.error("This feature is only available for registered users.")` (red sonner toast).
  - Do not open the chat panel, do not request the mic.
  - Add `cursor-not-allowed` + slight desaturation, but keep visible.
- Toast styling: red sonner is already configured (`error` class in `sonner.tsx`).

**5) Schedule "Create from AI" for guests**
- `EventsView.tsx` `handleAIGenerate`: `EventsView` doesn't currently know about guest state. Pass `isGuest` prop from `Index.tsx`.
- If `isGuest`, the "Create from AI" button itself shows the message on click instead of opening the form. Same `toast.error("This feature is only available for registered users.")`.
- Replace the generic `toast.error("Failed to generate schedule. Try again.")` with the registered-user message *only* when 401 from edge function (or guest); otherwise keep generic.

**6) AI auto-detect icon (Add Habit dialog)**
- `AddTodoDialog.tsx`: add `isGuest` prop (passed from Index → currently no isGuest passed; thread it through).
- "Auto detect icons" button stays visible for guests; on click → red toast "This feature is only available for registered users."
- For registered users this still calls `ai-chat` (which now silently routes by user todo count).

---

### P2 — Timezone system

**7) Timezone settings in profile menu**
- New file `src/lib/timezone.ts`:
  - `getStoredTimezone()` reads from localStorage (key `critiqs-tz`) or falls back to `Intl.DateTimeFormat().resolvedOptions().timeZone` (auto).
  - `setTimezone(tz)` saves it.
  - `getNowInTz(tz)` → returns `Date` representing current local time in that tz (use `formatInTimeZone` from `date-fns-tz` — already a small util we can ship by writing `Intl.DateTimeFormat` formatters; no new dep).
  - `getOffsetLabel(tz)` returns `GMT+8` style.
  - `TIMEZONE_LIST` — curated list of ~50 common IANA zones with `{ tz, label, country }`.
  - For registered users, also persist timezone in `profiles.timezone` column.
- New component `src/components/TimezoneDialog.tsx`:
  - Big `AUTO DETECT` button at top → calls `Intl....resolvedOptions().timeZone`, sets it, shows confirmation chip with current time + color band.
  - Search input + scrollable list of timezones. Each row: `{ flag/country • region } | GMT±N | LIVE TIME` with a colored left border based on the current local-time bucket.
- Wire from `UserProfileMenu.tsx`: add a "Change Timezone" item available to **both** guest and registered users.
- DB migration: `ALTER TABLE profiles ADD COLUMN timezone text;` (regenerates `types.ts` automatically).
- On change: dispatch a `window` custom event `critiqs:timezone-changed`. Components that show "current time" / "today" listen and re-render. Schedule (`EventsView`) reads "today" via a `useTimezone()` hook (new) instead of `new Date()`.

**8) Visual time-of-day color cues**
- In `src/lib/timezone.ts`:
  ```ts
  export function timeOfDayBand(date: Date) {
    const h = date.getHours();
    if (h < 6 || h >= 21) return { id: "night",     hsl: "215 70% 65%", label: "Night" };     // bluish
    if (h < 11)            return { id: "morning",   hsl: "200 80% 78%", label: "Morning" };   // sky blue
    return                       { id: "day",       hsl: "45 85% 65%",  label: "Afternoon" }; // soft yellow
  }
  ```
- Use band color for: timezone row left-border, header date badge, and a tiny "🌅 Morning" pill in the schedule view.

---

### P3 — Layout + visuals

**9) Wider desktop layout**
- Replace `max-w-6xl lg:max-w-7xl` → `max-w-6xl xl:max-w-[88rem] 2xl:max-w-[100rem]` in `Index.tsx`, plus matching changes in `Header`/`Navbar` containers.
- Bump padding scale at `xl`: `xl:px-12 2xl:px-16`.
- Verify mobile/tablet untouched (no change below `xl`).
- Add a max-width clamp inside major sections (e.g. `EventsView`, `AnalyticsView`) so content doesn't stretch awkwardly on ultrawide.

**10) Remove Aurora**
- Delete `src/pages/MaySpecial.tsx`, `src/lib/revampTheme.ts`, `src/components/AuroraBadge.tsx`.
- Remove the `/may` route + `AuroraBadge` mount from `src/App.tsx`.
- Remove `bootstrapRevamp()` call from `src/main.tsx`.
- Strip the entire `.revamp-aurora { ... }` block + Aurora keyframes/utilities from `src/index.css`.
- Remove the Aurora memory file & index entry.

**11) Subtle theme-aware border glow on todos**
- New CSS utility in `index.css`:
  ```css
  .todo-glow {
    box-shadow:
      0 0 0 1px hsl(var(--primary) / .15),
      0 0 20px -8px hsl(var(--primary) / .35),
      inset 0 0 14px -8px hsl(var(--primary) / .15);
  }
  .todo-glow:hover {
    box-shadow:
      0 0 0 1px hsl(var(--primary) / .35),
      0 0 28px -8px hsl(var(--primary) / .55),
      inset 0 0 18px -8px hsl(var(--primary) / .25);
  }
  ```
- Apply `.todo-glow` to the outer wrapper inside `TodoItem.tsx` (alongside existing `glass-card`). Keeps the "business-y, not flashy" vibe — no rainbows, no sweep animation.
- (Skipping the heavy mesh-gradient BorderGlow component you pasted — too noisy for the requested aesthetic. We can revisit if you want the cursor-tracking variant later.)

**12) Click spark + smooth scroll**
- Smooth scroll: add `html { scroll-behavior: smooth; }` and `* { scroll-behavior: smooth; }` for inner scrollers, plus a tiny inertial-scroll helper for desktop wheel via `lenis` would be nicer but adds a dep — instead use plain CSS + `overscroll-behavior: contain` + `scroll-snap-type: none` cleanup. No new deps.
- Click spark: new component `src/components/ClickSpark.tsx` mounted once in `App.tsx`. Listens to `pointerdown` on `window`, spawns an absolutely-positioned div with 6 small radial particles using primary color, removed via `setTimeout(400)`. Pure DOM, no canvas, low-cost. `prefers-reduced-motion` disables it.

**13) Elastic sound slider**
- The Pomodoro sliders are radix `Slider`. Wrap them in a small `ElasticSlider` styled variant (extend `src/components/ui/slider.tsx` or create `src/components/ui/elastic-slider.tsx`):
  - Track: `transition: transform .25s cubic-bezier(.34,1.56,.64,1)` + slight scaleY on drag.
  - Thumb: spring-style scale on hover/active (`scale-110` → `scale-125 active:scale-95`).
  - Add a subtle drag-overshoot bounce via CSS keyframes triggered on pointer-up.
- Use it for the Pomodoro work/break/longBreak sliders (the only sound-adjustment-area slider — the user might mean the volume; we'll also add a small volume slider in `Stopwatch`/`PomodoroTimer` next to the mute toggle, replacing the static toggle with a 0–100 elastic slider).

**14) Mic UI improvements**
- `VoiceRecorderButton.tsx`:
  - Bump `w-14 h-14` → `w-16 h-16`.
  - When recording, replace the lone "Stop" Square icon with a **live waveform**: 5 vertical bars whose heights map to the current input volume, computed via `AnalyserNode.getByteFrequencyData()`. Stop button moves to a small chip below the bars (or a subtle outlined "Tap to stop" hint).
  - Add `<AnalyserNode>` setup when starting MediaRecorder; sample at ~25 fps with `requestAnimationFrame`.
  - Color: `hsl(var(--primary))` bars over destructive-tinted background, so users see "I'm picking up audio."

**15) Chatbox UI improvements**
- `FloatingAIChat.tsx`:
  - Width/height: `w-[380px] h-[560px]` → `w-[440px] sm:w-[480px] lg:w-[540px] h-[640px]`.
  - Placeholder: `"Ask anything... (Shift+Enter for new line)"` → `"Ask Anything…"` (per spec).
  - Keep multi-line behavior (Enter sends, Shift+Enter newline) but stop advertising it in the placeholder.

---

### P4 — Whisper transcription cleanup

**16) Smarter transcript cleanup**
- Edit `supabase/functions/transcribe-audio/index.ts`:
  - Keep current regex-based filler stripping + capitalization (already there).
  - Add a *light* AI cleanup pass with the easy-tier model (`nova-fast`):
    - System: "You clean transcripts. Remove filler (uh, hmm, like). Fix obvious capitalization & spelling. Add commas/periods where needed. DO NOT add information, do not paraphrase, do not change meaning. Keep the user's exact words and structure as much as possible."
    - User: the regex-cleaned text.
    - Temperature: 0.1, max_tokens: ~512.
  - On any failure → fall back to regex-cleaned text (don't break the feature).
  - Cap input length at ~2000 chars to limit cost; longer transcripts go through regex-only path.

---

### P5 — Notebook autosave

**17) Auto-save drafts on every change**
- New hook `src/hooks/useAutosaveDraft.ts(key, value)`:
  - Saves to `localStorage` under `notebook_draft:<key>` debounced 300ms.
  - Returns `loadDraft()` / `clearDraft()`.
- In `NoteDialog.tsx` and `DocDialog.tsx`:
  - Draft key = `note:<id|new>` / `doc:<id|new>`.
  - On every change to title/body/short_description, save draft.
  - On dialog open: if a draft exists AND it differs from the saved record, restore it and show a tiny "Recovered from draft" pill with a "Discard" button.
  - On successful `onSave`, clear that draft.
- Also inside `RichEditor.tsx` (TipTap) — emit changes upward already happens via `onChange`, so no editor change needed; the dialog hook covers it.
- Notes 500-char limit unchanged.

---

### P6 — Hourly character usage limit

**18) Hourly 14k character usage**
- New table `ai_usage`:
  ```sql
  create table public.ai_usage (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    hour_bucket timestamptz not null, -- truncated to the hour, UTC
    chars_used int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, hour_bucket)
  );
  alter table public.ai_usage enable row level security;
  create policy "Users view own usage"   on public.ai_usage for select to authenticated using (auth.uid() = user_id);
  create policy "Users insert own usage" on public.ai_usage for insert to authenticated with check (auth.uid() = user_id);
  -- updates only via edge function with service role (no update policy)
  ```
- New edge function `track-ai-usage` (called server-side from `ai-chat` after each request) that:
  - Takes `{ chars_in, chars_out }`.
  - Computes current hour bucket.
  - Upserts/increments `chars_used` (using service role).
  - Returns `{ remaining }` where remaining = 14000 minus sum of current hour. Negative carry-over: when the previous hour ended negative, subtract the overage from this hour's allowance. Implementation: keep usage rolling — when computing remaining, if `prev hour remaining < 0`, then `effective_limit = 14000 + prevRemainingNegative`.
- Update `ai-chat` edge function: at the end of a successful response, call the tracker (or inline the same logic). Compute `chars_in = sum(messages[].content.length)`, `chars_out = reply.length`.
- New client hook `src/hooks/useAiUsage.ts`:
  - Polls `ai_usage` for the current hour every 30s, also re-fetches after each chat send.
  - Exposes `{ remaining, limit, hour }`.
- **19) Display**:
  - In `FloatingAIChat`, top-right of the header, show `"{remaining} chars left this hour"`.
  - Apply a subtle glow class:
    ```css
    .usage-glow { text-shadow: 0 0 10px hsl(var(--primary) / .6); }
    .usage-glow.negative { color: hsl(var(--destructive)); text-shadow: 0 0 10px hsl(var(--destructive) / .6); }
    ```
  - When `remaining < 0`, prefix with `−` sign and use destructive color.
  - When `remaining < 1000`, gentle pulse animation.
- Per the system instruction `<no-backend-rate-limiting>`: we will NOT enforce a hard server-side block. We only display the remaining counter (and let the client UI nudge users). If usage is negative, we still allow the request — it just reports a negative remainder. (User can request a hard cutoff later; flagging this trade-off explicitly.)

---

### Files & touch list (compact)

```
NEW:
  src/lib/aiAccess.ts                AI_TOOLS_UNDER_CONSTRUCTION + helpers
  src/lib/timezone.ts                tz utils + curated list
  src/hooks/useTimezone.ts           reactive tz hook
  src/hooks/useAutosaveDraft.ts      notebook draft helper
  src/hooks/useAiUsage.ts            hourly usage poller
  src/components/TimezoneDialog.tsx  full tz picker
  src/components/ClickSpark.tsx      global click spark
  src/components/ui/elastic-slider.tsx  springy slider variant
  supabase/functions/track-ai-usage/index.ts
  supabase/migrations/<ts>_ai_usage_and_timezone.sql

EDIT:
  src/pages/Index.tsx                onboarding fix, guest mic/chat mount, wider layout, isGuest props
  src/components/PremadeTodoChooser.tsx  "Start Now!", remove skip, enforce >=1
  src/components/UserProfileMenu.tsx  add "Change Timezone" entry (guest+user)
  src/components/ToolsView.tsx       under-construction cards
  src/components/PhysiqueRater.tsx
  src/components/OutfitRater.tsx     under-construction guard
  src/components/FoodScanner.tsx
  src/components/FloatingAIChat.tsx  bigger, placeholder, usage chip, guest-disabled mode
  src/components/VoiceRecorderButton.tsx  bigger, waveform, guest-disabled
  src/components/AddTodoDialog.tsx   guest gate on auto-detect
  src/components/EventsView.tsx      guest gate on Create from AI, tz-aware "today"
  src/components/TodoItem.tsx        .todo-glow class
  src/components/notebook/NoteDialog.tsx  autosave hook
  src/components/notebook/DocDialog.tsx   autosave hook
  src/components/Stopwatch.tsx       elastic volume slider replacing static toggle
  src/components/PomodoroTimer.tsx   elastic sliders
  src/index.css                      remove .revamp-aurora; add .todo-glow, .usage-glow, click-spark keyframes, smooth scroll
  src/App.tsx                        remove /may + AuroraBadge; mount ClickSpark
  src/main.tsx                       remove bootstrapRevamp
  supabase/functions/ai-chat/index.ts  per-user model routing + usage tracking call
  supabase/functions/schedule-ai/index.ts  ensure mistral
  supabase/functions/transcribe-audio/index.ts  add nova-fast cleanup pass

DELETE:
  src/pages/MaySpecial.tsx
  src/lib/revampTheme.ts
  src/components/AuroraBadge.tsx
  mem://features/themes/aurora-revamp  (and its index entry)
```

### Migrations (one combined)

```sql
-- timezone column
alter table public.profiles add column if not exists timezone text;

-- ai_usage table + RLS (as shown above)
```

### Notes / trade-offs to confirm

- **Hard rate-limit cut-off**: per platform guidance I'm only *displaying* the negative remainder, not blocking AI calls. Say the word if you want a hard 0-block instead.
- **Smooth scroll**: doing it with pure CSS (no `lenis` dep). If you want truly inertial Apple-style scroll, I can add `lenis` (~3 KB).
- **AI auto-cleanup of transcripts**: adds a small extra AI call per recording. If you want zero cost, I can stay regex-only.
- **Border glow**: I'm using a subtle theme-tinted shadow rather than the full cursor-tracking BorderGlow you pasted (which is heavy and flashy). Tell me to swap to the full mesh-gradient version if you really want it.

If this all looks right I'll execute it in one pass.
