

# Add 3 New Tools: Outfit Rater, Food Scanner, Breathing Exercises

## Overview
Add three new tools to the Tools tab, following the same pattern as the existing Physique Rater. Two are AI-powered (via Pollinations edge functions), one is a pure frontend breathing exercise tool.

---

## 1. Outfit Rater (AI-powered)

### Edge Function: `supabase/functions/outfit-rater/index.ts`
- Same architecture as `physique-rater` — uses Pollinations API with `gemini-fast` primary, `openai-fast` fallback
- System prompt evaluates: fit (1-10), color coordination, style category, body-type suitability, and 5 improvement suggestions
- Response JSON: `{ status, rating, feedback: { fit, colorCoordination, styleCategory, bodyTypeSuitability, strengths[], improvements[] } }`
- Same error states: `inappropriate`, `not_body` (renamed to `not_outfit`), `error`

### Component: `src/components/OutfitRater.tsx`
- Clone PhysiqueRater structure: upload → analyze → results with rating, feedback cards, bullet lists
- Same drag-drop upload, 5MB limit, base64 transmission
- "ASK AI" button sends image + "How can I improve my outfit?" to floating chat
- Icons: `Shirt` from lucide-react

### Config: Add `[functions.outfit-rater] verify_jwt = false` to `supabase/config.toml`

---

## 2. Food Scanner (AI-powered)

### Edge Function: `supabase/functions/food-scanner/index.ts`
- Same Pollinations architecture with vision model
- System prompt: identify food items, estimate calories, protein, carbs, fats per item and total
- Response JSON: `{ status, foods: [{ name, calories, protein, carbs, fats }], totals: { calories, protein, carbs, fats }, healthRating (1-10), tips[] }`
- Error states: `not_food`, `error`

### Component: `src/components/FoodScanner.tsx`
- Upload photo → AI identifies food items with macro breakdown
- Display: table/cards showing each food item with macros, totals summary, health rating, tips
- "ASK AI" button sends image + "Give me a healthier alternative for this meal"
- Icons: `UtensilsCrossed` from lucide-react

### Config: Add `[functions.food-scanner] verify_jwt = false` to `supabase/config.toml`

---

## 3. Breathing Exercises (No AI, frontend-only)

### Component: `src/components/BreathingExercise.tsx`
- **3 science-backed techniques:**
  1. **Box Breathing** (Navy SEALs) — 4s inhale, 4s hold, 4s exhale, 4s hold. Activates parasympathetic nervous system.
  2. **4-7-8 Breathing** (Dr. Andrew Weil) — 4s inhale, 7s hold, 8s exhale. Triggers relaxation response.
  3. **Wim Hof Method** — 30 deep breaths, then hold. Increases adrenaline, reduces inflammation.

- **UI:**
  - Technique selector (3 cards with descriptions)
  - Animated breathing circle that expands/contracts with the phase (inhale/hold/exhale)
  - Phase label ("Inhale", "Hold", "Exhale") with countdown timer
  - Round counter (e.g., "Round 2/4")
  - Session duration selector (1 min, 3 min, 5 min)
  - Start/Pause/Reset controls
  - Benefits listed under each technique (backed by research)

- **Animation:** CSS transitions on a circle element — scale up on inhale, hold at scale, scale down on exhale. Smooth `transition: transform` with duration matching the phase.

---

## 4. Update ToolsView

### `src/components/ToolsView.tsx`
- Import and render all 4 tools (existing Physique Rater + 3 new) as separate glass-card sections
- Each with icon, title, description, and the component
- Order: Physique Rater, Outfit Rater, Food Scanner, Breathing Exercises
- Icons: `Dumbbell`, `Shirt`, `UtensilsCrossed`, `Wind`

---

## Files to Create/Edit
- **Create:** `supabase/functions/outfit-rater/index.ts`
- **Create:** `supabase/functions/food-scanner/index.ts`
- **Create:** `src/components/OutfitRater.tsx`
- **Create:** `src/components/FoodScanner.tsx`
- **Create:** `src/components/BreathingExercise.tsx`
- **Edit:** `src/components/ToolsView.tsx` (add 3 new tool sections)
- **Edit:** `supabase/config.toml` (add 2 new function entries)

