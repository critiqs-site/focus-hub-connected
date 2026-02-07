

# Changes Plan

## 1. Rename Section Tabs

In `Header.tsx`, rename:
- "Habits" to "Todos"
- "AI" to "Therapist"

Also update the tab id from `"ai"` to `"therapist"` and update the matching logic in `Index.tsx`.

---

## 2. Therapist Section Improvements

### 2a. Loading States: "Sending Requests..." then "Analyzing..."

Add a `loadingPhase` state to `AIChat.tsx`:
- When user sends a message, show **"Sending Requests..."** for 1.5 seconds
- After 1.5s (or when first chunk arrives), switch to **"Analyzing..."**
- Replace the current spinning loader with these text labels

### 2b. Smooth Streaming (ChatGPT-style)

Instead of rendering tokens instantly as they arrive, buffer incoming tokens and display them character-by-character with a small delay (~20-30ms per character) using `setInterval`. This creates a smooth typing effect even when the backend streams fast.

### 2c. Fix AI System Prompt / Initial Message

- Change the initial greeting from "I'm your personal therapy guide" to something like: "Hey there! I'm your personal therapist. I'm here to listen and help. What's on your mind today?"
- The header text changes from "Therapy Guide" to "Therapist"
- The subtitle changes to "Your personal AI therapist"
- The system prompt sent to the edge function must instruct the AI to **never reveal or list the user's todos/notes/habits directly**. The context is for the AI to understand the user better, not to recite back.

This requires updating the edge function. Since `supabase/functions` is empty, we need to create the `ai-chat` edge function with proper system instructions.

### 2d. Create the `ai-chat` Edge Function

Create `supabase/functions/ai-chat/index.ts` with:
- CORS headers
- System prompt: "You are a compassionate therapist. You have access to the user's habits and mood journal entries as background context to understand them better. NEVER list, mention, or reveal their specific todos, habits, or notes unless the user explicitly asks about them. Use this context silently to provide more personalized, empathetic advice."
- Streaming response via OpenAI API
- This requires an `OPENAI_API_KEY` secret

---

## 3. Notes Section: Yearly Calendar with Mood Colors

### 3a. New `YearlyCalendar` Component

Add a yearly calendar grid (Jan-Dec, all days) at the top of `NotesSection.tsx`:
- Each day is a small colored cell
- Days with mood entries are colored by mood:
  - `super_happy` / `happy` -> green/emerald
  - `neutral` -> yellow/amber
  - `sad` -> orange/red
  - `depressed` -> red/rose
- Days without entries -> default dark/muted
- Clicking a day sets the `selectedDate` in NotesSection, showing that day's entry below

### 3b. Integration

Place the yearly calendar above the existing date navigation in `NotesSection.tsx`. When a date is clicked in the calendar, it updates `selectedDate` which already controls what entry is shown.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/Header.tsx` | Rename tabs |
| `src/pages/Index.tsx` | Update `"ai"` tab id to `"therapist"` |
| `src/components/AIChat.tsx` | Loading phases, smooth streaming, updated greeting/labels |
| `supabase/functions/ai-chat/index.ts` | Create edge function with therapist system prompt |
| `supabase/config.toml` | Add ai-chat function config |
| `src/components/YearlyCalendar.tsx` | New yearly mood calendar component |
| `src/components/NotesSection.tsx` | Integrate YearlyCalendar |

---

## Technical Details

**Smooth streaming implementation:** Buffer all incoming SSE tokens into a queue. A `setInterval` (25ms) pops characters from the queue and appends to the displayed message, creating a smooth typing effect regardless of backend speed.

**Loading phases:** Use a `loadingPhase` state (`"sending"` | `"analyzing"` | null`). Set to `"sending"` on submit, use `setTimeout(1500)` to switch to `"analyzing"`, clear when first token arrives or response completes.

**Yearly calendar:** A simple CSS grid (7 columns for days of week, 12 month sections). Each cell is ~12x12px. Mood colors use Tailwind classes. The component receives the `notes` array and `selectedDate`/`onSelectDate` props.

**Edge function secret needed:** `OPENAI_API_KEY` - will prompt user to add it before proceeding.

