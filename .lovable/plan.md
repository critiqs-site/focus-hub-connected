

# Major App Overhaul: AI Chatbot, Physique Rater Simplification, Analytics Fix, and More

## Overview
This plan covers all the requested changes: simplifying physique rater output, adding a floating AI chatbot, removing the therapist tab, switching to `gemini-fast` model, fixing analytics "total days" calculation, and general improvements.

---

## 1. Switch AI Model to `gemini-fast` via Pollinations

**Files:** `supabase/functions/ai-chat/index.ts`, `supabase/functions/physique-rater/index.ts`

- Change model from `openai-large` to `gemini-fast` in both edge functions
- Update the physique rater system prompt to produce **simpler, friendlier language** (plain English, no jargon, bullet points for strengths/improvements)
- Update the AI chat system prompt to be friendly, use bold formatting, give short but detailed answers, and do deep research

The user mentioned providing a new Pollinations API key -- we will request the secret update.

---

## 2. Simplify Physique Rater Output + Add "ASK AI" Button

**File:** `src/components/PhysiqueRater.tsx`

Current output uses complex fitness jargon. Changes:
- Show "Your physique: X/10" instead of just the number
- Reword labels: "Proportions" becomes "Body Shape", feedback uses simple language (handled by prompt change)
- Strengths rendered as **bullet list** (split by newlines from AI)
- Improvements rendered as **bullet list**
- Add a glowing **"ASK AI"** button below "Rate Another Photo"
- When "ASK AI" is clicked: open the floating chatbot, auto-send the physique image with the message "What can I do to improve my body?"

**File:** `supabase/functions/physique-rater/index.ts`
- Update SYSTEM_PROMPT to instruct the AI to:
  - Use simple, friendly language anyone can understand
  - Return strengths and improvements as newline-separated bullet items
  - Rename "proportions" field to "bodyShape"
  - Keep estimatedBodyFat as a simple range

---

## 3. Remove Therapist Tab, Add Floating AI Chatbot

**Files to modify:** `src/components/Header.tsx`, `src/pages/Index.tsx`
**Files to create:** `src/components/FloatingAIChat.tsx`
**Files to delete (unused):** `src/components/AIChat.tsx` (replaced by FloatingAIChat)

Changes:
- Remove "Therapist" tab from `Header.tsx`
- Remove the therapist tab rendering from `Index.tsx`
- Create a new `FloatingAIChat.tsx` component:
  - Fixed AI icon button in the **bottom-right corner** (always visible, all pages)
  - When clicked, opens a professional-looking chat panel (slide up from bottom-right)
  - Professional header with bot icon and close button
  - Message area with scroll, user/assistant bubbles
  - Input area with **+ icon** for image upload (drag & drop also supported)
  - Images can be attached and sent alongside text messages
  - Streaming response using the `ai-chat` edge function
  - Supports receiving auto-filled messages from the Physique Rater ("ASK AI" flow)
- Add FloatingAIChat to `Index.tsx` so it's always rendered

---

## 4. "ASK AI" Flow from Physique Rater

When the user clicks "ASK AI" after a physique rating:
1. Open the floating chatbot
2. Attach the analyzed image (base64)
3. Auto-send message: "What can I do to improve my body?"
4. The AI sees the image and gives personalized improvement advice

This requires:
- A shared state/callback between PhysiqueRater and FloatingAIChat (via props or a simple context)
- The `ai-chat` edge function needs to support image messages (add vision capability using the same `image_url` format as physique-rater)

---

## 5. Update `ai-chat` Edge Function for Vision + Friendly Style

**File:** `supabase/functions/ai-chat/index.ts`

- Switch model to `gemini-fast`
- Update system prompt: be friendly, use bold, give short but fully detailed answers, do deep research
- Support image messages: when the client sends a message with an `image` field, include it as an `image_url` content block in the API call

---

## 6. Fix Analytics "Total Days" Bug

**File:** `src/components/AnalyticsView.tsx`

Current bug: `totalDays` uses `daysUpToToday` which only counts days from start of month to today. If today is March 3rd, it shows "X of 3 days."

Fix: Use the full number of days in the month (e.g., 30 or 31) for the total, while still only counting completions up to today. The display should say "X of 30 days completed" (full month), giving a proper monthly view.

---

## 7. General Improvements

- **Navbar mobile responsiveness**: The external links (DOCS, GITHUB, DONATE) can overflow on small screens. Wrap them or hide behind a menu on mobile.
- **Header tabs overflow**: On small screens the tab buttons can wrap awkwardly. Add horizontal scroll for tabs.

---

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/physique-rater/index.ts` | Update prompt for simple language, rename field, switch to `gemini-fast` |
| `supabase/functions/ai-chat/index.ts` | Switch to `gemini-fast`, add vision support, update prompt style |
| `src/components/PhysiqueRater.tsx` | Simplify output display, bullet lists, add "ASK AI" button |
| `src/components/FloatingAIChat.tsx` | **New** - Floating chatbot with image upload |
| `src/components/Header.tsx` | Remove "Therapist" tab |
| `src/pages/Index.tsx` | Remove therapist section, add FloatingAIChat, wire up ASK AI callback |
| `src/components/AnalyticsView.tsx` | Fix total days to use full month days |
| `src/components/AIChat.tsx` | Will be removed (replaced by FloatingAIChat) |
| `supabase/config.toml` | No changes needed (ai-chat already configured) |

---

## Technical Details

### Floating Chat State Management
- `Index.tsx` will hold `chatOpen` and `chatInitialMessage` state
- `FloatingAIChat` receives `open`, `onClose`, and optional `initialMessage` (with text + image)
- `PhysiqueRater` receives an `onAskAI(image, message)` callback
- When "ASK AI" is clicked, it calls `onAskAI(imageBase64, "What can I do to improve my body?")` which opens chat and auto-sends

### ai-chat Vision Support
Messages from client can now include:
```json
{ "role": "user", "content": "text", "image": "data:image/jpeg;base64,..." }
```
The edge function converts this to the OpenAI multimodal format:
```json
{ "role": "user", "content": [
  { "type": "text", "text": "..." },
  { "type": "image_url", "image_url": { "url": "data:..." } }
]}
```

### Analytics Fix
Change line 36 in AnalyticsView.tsx from:
```
const totalDays = daysUpToToday.length;
```
to:
```
const totalDays = daysInMonth.length;
```
This makes it show "X of 31 days" for the full month.

