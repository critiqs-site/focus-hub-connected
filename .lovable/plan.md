

# Fix Plan: Todo Scrollbars, Analytics, AI Speed & Context

## 1. Todo Day Circles — Remove Scrollbar Artifacts
**Problem**: The `overflow-x-auto` on the day circles container creates visible scrollbar tracks (seen in the screenshot).
**Fix**: In `TodoItem.tsx`, replace `overflow-x-auto` with `overflow-x-auto scrollbar-hide` and add a CSS utility class `.scrollbar-hide` in `index.css` that hides the scrollbar while keeping scroll functionality. Also increase the container's min spacing so circles don't compress on most screens.

**Files**: `src/components/TodoItem.tsx` (line 143), `src/index.css`

---

## 2. Analytics Overall — Average of Individual Percentages
**Problem**: Current code does `totalCompleted / (daysInMonth * todoCount)` which is technically correct but user wants the simpler mental model: average each todo's percentage.
**Fix**: In `calculateOverallStats()`, compute each todo's individual percentage (`completedDays / totalDays * 100`), then average those percentages. So 50% + 50% + 0% = 100/3 = 33%.

**File**: `src/components/AnalyticsView.tsx` (lines 73-91)

---

## 3. AI Response Speed — Use Faster Endpoint
**Problem**: `https://text.pollinations.ai/openai` takes ~13 seconds.
**Fix**: Switch to `https://text.pollinations.ai/openai` with a smaller context window — the main bottleneck is likely the large system prompt + context. Trim the system prompt significantly and only send essential context. Also try the direct endpoint `https://text.pollinations.ai/` which may be faster for simple requests.

**File**: `src/components/FloatingAIChat.tsx`

---

## 4. AI Not Reading Conversation — Fix System Prompt
**Problem**: When user says "who r u", AI responds with "Got a workout plan?" — it's ignoring the conversation and always acting like it's a first greeting.
**Fix**: The `GREETING` instruction in the system prompt is too dominant. Rewrite to clarify: "Only greet on the FIRST message. For follow-up messages, respond to what the user actually said. Read the conversation history." Also ensure `processedMessages` sends the full conversation array properly.

**File**: `src/components/FloatingAIChat.tsx` (SYSTEM_PROMPT, lines 6-39)

---

## Files Summary

| File | Change |
|------|--------|
| `src/components/TodoItem.tsx` | Hide scrollbar on day circles |
| `src/index.css` | Add `.scrollbar-hide` utility |
| `src/components/AnalyticsView.tsx` | Fix Overall to average individual percentages |
| `src/components/FloatingAIChat.tsx` | Fix system prompt for conversation awareness, optimize for speed |

