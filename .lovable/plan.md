
## Plan: Polish + /may "Aurora" Revamp

### 1. Voice recorder button — theme styling
File: `src/components/VoiceRecorderButton.tsx`
- Replace `bg-secondary` idle background with a glass/primary-tinted look so the border isn't dark on dark.
- Idle: `bg-primary/10 backdrop-blur-xl border border-primary/40 text-primary` with `shadow-lg shadow-primary/30` and a soft inner ring on hover.
- Recording: keep destructive red pulse.
- Also add a subtle ambient glow ring (`ring-2 ring-primary/20`) so it pops on light themes too.

### 2. Toast position + semantic colors
File: `src/components/ui/sonner.tsx`
- Move Sonner to `position="top-right"` with `offset={80}` (visually "right-center-top") and `style={{ opacity: 0.92 }}`.
- Use `richColors` so success/warning/error map to green/yellow/red automatically.
- Add custom classNames per intent:
  - success → green border + green text
  - warning / default info → yellow accent
  - error → red accent
- Audit current toast call sites and swap neutral `toast(...)` to the right variant:
  - `toast.success` for: Transcribed, Habit Added, Note saved, Doc saved, Completed, Restored
  - `toast.warning` for: short recording, mic permission prompts, validation
  - `toast.error` for: deletes, failures, mic denied, transcription failed
- Quick scan with `rg "toast\\."` to update existing call sites.

### 3. Smarter Whisper output (clean filler words + better structure)
File: `supabase/functions/transcribe-audio/index.ts`
- Switch the upstream call to use Pollinations' transcription with `response_format=verbose_json` if supported, otherwise plain.
- After getting `text`, do a lightweight server-side cleanup pass:
  - Strip filler tokens: `\b(uh+|uhm+|um+|mhm+|hmm+|erm+|ah+|like,?|you know,?)\b` (case-insensitive), collapse double spaces, fix punctuation spacing.
  - Capitalize sentence starts and ensure trailing period.
- Return `{ text: cleanedText, raw: originalText }` so we keep the original if needed.
- No second AI call needed (saves credits) — pure regex cleanup.

### 4. Multi-line support in AI chat input
File: `src/components/FloatingAIChat.tsx`
- Replace the single-line `<input>` with a `<textarea>` (auto-grow up to ~5 rows).
- Key handling: `Enter` sends, `Shift+Enter` inserts a newline.
- Style: same rounded glass look, `resize-none`, `min-h-[40px] max-h-[140px]`, scroll on overflow.
- Render assistant messages: ensure `ReactMarkdown` already preserves line breaks; add `remark-breaks` plugin OR use `whitespace-pre-wrap` on the prose container so newlines from the AI render as breaks (currently they collapse). Use `whitespace-pre-wrap` (no new dependency).

### 5. "Aurora" — May Special Revamp Theme at `/may`
A full vibe shift, not just a color swap. Activated by visiting `/may`, then persists in localStorage as `critiqs-revamp = "aurora"`. Visiting `/` works as normal but with the revamp applied.

**Concept:** Aurora Borealis — deep midnight base with shifting cyan→magenta→violet gradients, frosted glass panels, soft motion everywhere, fluid typography.

Visual direction:
- Base: very dark navy `hsl(230 40% 5%)` with animated multi-stop conic-gradient backdrop (slow 40s rotation) layered behind everything.
- Primary accent: cyan `hsl(180 90% 60%)` shifting to magenta `hsl(300 85% 65%)` via gradient (`--primary-gradient`).
- Glass cards: heavier blur (32px), 1px gradient border using `border-image`, soft inner glow.
- Radius: `--radius: 1.25rem` (more pillowy).
- Typography: keep Poppins but add letter-spacing on headings, larger weight contrast.
- New animations:
  - `aurora-shift` — background gradient slowly drifts.
  - `glow-breath` — primary buttons gently pulse glow.
  - `card-float` — cards hover-lift with tilt.
- Mic + AI button get a glowing ring with conic gradient stroke.
- Toasts: frosted with gradient left-border.

Implementation:
- New file `src/lib/revampTheme.ts` exposing `applyRevamp()` / `clearRevamp()` / `isRevampActive()`. Adds/removes class `revamp-aurora` on `<html>`.
- New page `src/pages/MaySpecial.tsx`: on mount sets localStorage flag, shows a short hero ("Aurora unlocked ✨"), then `navigate("/")` after ~1.5s.
- Add route `<Route path="/may" element={<MaySpecial />} />` in `src/App.tsx`.
- Hook into bootstrap: in `src/main.tsx` (or `App.tsx` top-level effect), read flag and call `applyRevamp()` early so first paint already has the theme.
- In `src/index.css`, add a new layer block scoped under `.revamp-aurora` overriding tokens + introducing keyframes:
  ```
  .revamp-aurora { --background: 230 40% 5%; --primary: 180 90% 60%; --radius: 1.25rem; ... }
  .revamp-aurora body { background: conic-gradient(from 0deg at 50% 50%, ...); animation: aurora-shift 40s linear infinite; }
  .revamp-aurora .glass-card { backdrop-filter: blur(32px) saturate(180%); border-image: linear-gradient(...) 1; }
  @keyframes aurora-shift { to { background-position: 200% 0; } }
  @keyframes glow-breath { 0%,100% { box-shadow: 0 0 20px hsl(var(--primary)/.4);} 50% { box-shadow: 0 0 40px hsl(var(--primary)/.7);} }
  ```
- Coexists with existing `useTheme` color themes — Aurora overrides at a higher specificity but still respects `--primary` if user picked one (we layer accent on top).
- Add a tiny floating "Aurora" badge top-left when active so the user can confirm it's on (clickable to disable → removes class + clears flag).

### Technical details (compact)

- Sonner config:
  ```tsx
  <Sonner position="top-right" offset={72} richColors closeButton
    toastOptions={{ style:{opacity:.94}, classNames:{ toast:"backdrop-blur-xl" } }} />
  ```
- Whisper cleanup regex (server):
  ```ts
  const FILLERS = /\b(uh+m*|um+|mhm+|hmm+|erm+|ah+|like|you know)\b[,]?/gi;
  cleaned = text.replace(FILLERS,"").replace(/\s{2,}/g," ").replace(/\s([.,!?])/g,"$1").trim();
  cleaned = cleaned.charAt(0).toUpperCase()+cleaned.slice(1);
  if (cleaned && !/[.!?]$/.test(cleaned)) cleaned += ".";
  ```
- Textarea auto-grow: `onInput={e => { e.currentTarget.style.height='auto'; e.currentTarget.style.height=Math.min(e.currentTarget.scrollHeight,140)+'px'; }}`.
- Memory: save Aurora as a `feature` memory so future sessions know `/may` activates the revamp and how to disable it.

### Files touched
- edit `src/components/VoiceRecorderButton.tsx`
- edit `src/components/ui/sonner.tsx`
- edit `supabase/functions/transcribe-audio/index.ts`
- edit `src/components/FloatingAIChat.tsx`
- edit `src/index.css`
- edit `src/App.tsx`
- edit `src/main.tsx` (early revamp bootstrap)
- new `src/lib/revampTheme.ts`
- new `src/pages/MaySpecial.tsx`
- bulk-update toast call sites (sweep, ~10–15 spots) for semantic variants
- new memory: `mem://features/themes/aurora-revamp`

No new dependencies. No DB migration. One edge function redeploy (`transcribe-audio`).
