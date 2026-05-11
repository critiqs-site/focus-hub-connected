# Status Audit + Fix Plan

## Status of each item from your message

| # | Item | Current status | Action |
|---|------|----------------|--------|
| 1 | Guest sees empty dashboard after name → must pick ≥1 premade todo | ❌ Not solved (PremadeTodoChooser exists but isn't enforced for guests; auto-routes to dashboard) | Fix |
| 2 | Disabled mic + chat icon for guests with red toast "registered users only" | ❌ Currently hidden, not shown-disabled | Fix |
| 3 | Schedule "Create from AI" → guest gets red toast instead of "Failed to generate" | ❌ Calls function, fails | Fix |
| 4 | Every AI button visible but red-toast for guests | ⚠️ Partial — some hidden | Fix |
| 5 | Timezone — auto-detect + manual picker w/ time-of-day color tint | ⚠️ TimezoneDialog exists, no list/auto-detect/time tint | Improve |
| 6 | Wider desktop layout (don't break anything) | ❌ Container too narrow | Fix |
| 7 | Remove Aurora revamp | ❌ Still in code (`/may`, badge, `revamp=aurora`) | Remove |
| 8 | Whisper: clean um/uh, casing, spelling, no over-rewriting | ⚠️ transcribe-audio function exists, no cleanup pass | Improve |
| 9 | Notebook autosave-as-draft on every change | ❌ useAutosaveDraft hook exists but not wired everywhere | Fix |
| 10 | Theme-tinted glow border on every todo (subtle) | ⚠️ Has accent border, no animated glow | Add |
| 11 | Click spark + smooth scroll | ⚠️ ClickSpark exists, smooth scroll missing | Add |
| 12 | Sound (volume) slider → elastic feel | ❌ Static | Improve |
| 13 | Mic bigger + live waveform while recording | ❌ Only stop button | Improve |
| 14 | Chat box bigger; placeholder = "Ask anything…" | ❌ Tiny + space-enter hint | Fix |
| 15 | All AI Tools → "Under Construction" lock (even for registered) | ❌ Active | Fix |
| 16 | Model routing (llama-scout / mistral / nova-fast) per task | ❌ All on one model | Fix |
| 17 | Auto-detect icon: scout for first 5 todos per user, then mistral | ❌ Not implemented | Add |
| 18 | Schedule AI → mistral | ❌ | Update |
| 19 | Chat → llama; 14000 chars/hour combined (user+AI), glowing "X remaining this hour", carry-over negative | ⚠️ useAiUsage hook is word-based per day | Rewrite |
| 20 | Floating chat button missing on dashboard, only shows on Notebook in corner | ❌ Bug | Fix |
| 21 | Glassy icon style upgrade (per reference images) | ⚠️ GlassIcon exists, weak | Improve |

---

## Phase 1 — Critical UX & guest gating

**Guest onboarding enforcement**
- `OnboardingDialog` for guests: after name step, force `PremadeTodoChooser`. "Start Now" disabled until ≥1 picked. Auto-create `Morning` and `Night` dividers and route picked items into them by tag.

**Floating chat visible everywhere for guests**
- Always mount `FloatingAIChat` for guests in the same bottom-right slot.
- Mic + send button visible but `disabled` styled (50% opacity, red ring on hover).
- On click → red destructive toast: "This feature is only available for registered users."
- Same treatment for Schedule "Create from AI", Add-Todo "Auto-detect icon" sparkle, all AI tool cards, voice on dashboard.

**AI Tools lockdown (everyone)**
- `ToolsView` cards: overlay "🚧 Under Construction" badge, disable click, route blocked. Keep visuals.

---

## Phase 2 — Timezone system

- New `TimezoneDialog` v2:
  - **Auto-detect** button → `Intl.DateTimeFormat().resolvedOptions().timeZone`.
  - Searchable list of IANA zones with country, GMT offset, and **current local time** displayed live.
  - Time-of-day tint chip per row: morning=sky, noon/afternoon=amber, evening=orange, night=indigo.
- Persist for guests in localStorage (`critiqs-tz`), for users in `profiles.timezone`.
- All date/time math (schedule, journal, completion windows, streaks, hourly AI quota) reads from a single `useTimezone()` selector.

---

## Phase 3 — AI model routing + hourly char quota

**Routing matrix (server-side only, never tell user):**
| Task | Model |
|------|-------|
| Add-todo auto-detect icon, first 5 per user | `llama-scout` |
| Add-todo auto-detect icon, after 5 | `mistral` |
| Schedule AI generation | `mistral` |
| Floating chat | `llama-scout` |
| Easy/short calls (future) | `nova-fast` |

- Track per-user `icon_autodetect_count` in `profiles` (or localStorage for guests though guests are blocked anyway).

**Hourly char quota for chat (registered only)**
- Table `ai_usage_hourly(user_id, hour_bucket timestamptz, chars_used int)`. RLS scoped to user.
- Each chat round: edge function adds `userMsg.length + assistantReply.length` to current hour bucket.
- Limit = 14,000 chars/hour. If next request would exceed → reject with friendly message; carry-over: any negative balance subtracts from next hour's 14,000.
- UI: small pill above chat input "**X chars left this hour**", current hour glows (animated theme-color ring).

---

## Phase 4 — Voice (Whisper) cleanup pass

- After transcription, run a tiny mistral pass with strict system prompt:
  - Remove fillers (um, uh, hmm, like, you know).
  - Fix casing + punctuation + obvious spelling.
  - **Do not paraphrase, do not reorder beyond grammar fixes, preserve the speaker's words.**
  - Example rule baked in: "hello my dad is 25 name saiful" → "Hello, my dad is 25 and his name is Saiful." (NOT "my dad's name is Saiful and he is 25").
- Mic UI: bigger circular button, while recording show animated waveform from `AudioContext`/`AnalyserNode`; tap = stop.

---

## Phase 5 — Notebook autosave

- Wire `useAutosaveDraft` into `NoteDialog` and `DocDialog`:
  - Debounced 400ms save to localStorage key `notebook-draft-{noteId|new}`.
  - On dialog open, if draft newer than saved record → restore + show "Restored unsaved draft" pill.
  - Clear draft on successful save.

---

## Phase 6 — Visual polish

**Wider desktop layout**
- Bump `Index.tsx` main container `max-w-3xl` → `max-w-6xl xl:max-w-7xl`. Increase grid gaps and todo internal padding at `lg:`/`xl:` breakpoints. Mobile untouched.

**Glassy icon overhaul (per reference image #2)**
- `GlassIcon` v2:
  - Rounded-2xl 56px tile, `backdrop-blur(20px)`, layered gradient bg (white 8% → theme 6%).
  - Inner top highlight `inset 0 1px 0 rgba(255,255,255,0.18)`.
  - Outer halo `0 0 24px hsl(var(--primary)/0.35)`.
  - Top-left gloss overlay div, animated bottom shimmer on hover.
  - Icon gets `drop-shadow` in primary.

**Per-todo border glow**
- `.todo-glow-border` utility with `::after` masked 1px conic gradient using `--primary`, slow 8s rotation, subtle (opacity ~0.4). Business-tone, not flashy.

**Click spark + smooth scroll**
- Mount `ClickSpark` globally in `App.tsx`.
- Add `html { scroll-behavior: smooth }` and Lenis-style inertia via tiny custom listener (no extra dep) on main scroll container.

**Volume slider elastic**
- Replace static slider with shadcn `Slider` wrapped in spring animation (`framer-motion` already used) — overshoot on release.

**Chat box**
- Width: `w-[420px] md:w-[480px] xl:w-[560px]`, height `h-[640px]`.
- Placeholder: `Ask anything…` (remove space+enter hint).
- Always-mounted bottom-right via fixed positioning in `App.tsx` (not per-view).

---

## Phase 7 — Aurora removal

- Delete: `mem://features/themes/aurora-revamp`, all `revamp=aurora` localStorage reads, the floating Aurora badge component, `/may` route.
- Keep the new glass system (it stays as default).

---

## Technical notes

- **DB migration needed:** `profiles.timezone TEXT`, `profiles.icon_autodetect_count INT DEFAULT 0`, table `ai_usage_hourly`.
- **Edge functions to update:** `ai-chat` (model=llama-scout + char quota), `schedule-ai` (mistral, guest-block), `transcribe-audio` (cleanup pass), new `detect-icon` (model switch logic).
- **Never expose model names** in any client text or toast — internal only.
- All AI failures still surface 429/402 toasts.

---

## Order of execution

1. Phase 7 (remove Aurora — clears noise)
2. Phase 1 (guest gating + floating chat fix — biggest UX bug)
3. Phase 6 (wider layout + glass icons + chat box size — visible immediately)
4. Phase 5 (notebook autosave)
5. Phase 2 (timezone)
6. Phase 3 (model routing + hourly quota — needs migration)
7. Phase 4 (whisper cleanup + mic waveform)
8. Final pass: click spark global, smooth scroll, elastic slider, todo glow border