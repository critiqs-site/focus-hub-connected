

# Improve Food Scanner Accuracy

## Problem
The current AI prompt is too vague — it says "estimate portions based on what you see" without giving the model concrete reference data. This leads to inflated calories (900 vs expert's ~650) and wrong food identification (calling roti "naan" at 300cal instead of ~110cal each).

## Solution
Rewrite the system prompt in `supabase/functions/food-scanner/index.ts` with strict accuracy guidelines:

### New Prompt Strategy
1. **Step-by-step visual estimation methodology:**
   - First identify the dish type, cuisine, and cooking method
   - Estimate portion weight in grams using plate/bowl as reference (~25cm standard plate)
   - Cross-reference against USDA/standard nutrition databases per 100g values
   - Calculate per-item calories from weight × per-100g density

2. **Built-in reference data for common foods** (per 100g):
   - Rice (cooked): 130 kcal | Roti/chapati: 300 kcal/100g (~110 per 40g piece) | Naan: 260 kcal/100g (~260 per 100g piece)
   - Chickpea curry (avg): 120-180 kcal/100g depending on oil/coconut | Potato curry: 100-150 kcal/100g
   - Instruct model to differentiate roti vs naan (roti is thin, ~40-60g; naan is thick, ~80-100g)

3. **Accuracy constraints:**
   - Always estimate weight in grams first, then derive calories
   - Provide a calorie range (low–high) instead of a single number, with a "best estimate" midpoint
   - Assume moderate oil unless visually heavy/greasy
   - Never round to convenient numbers like 300/350 — use calculated values
   - Health rating must factor in: fiber, protein quality, micronutrient density, processing level, glycemic load

4. **Output format enhancement** — add `estimatedWeight` per food item and a `calorieRange` in totals:
   ```json
   {
     "foods": [{ "name": "Whole wheat roti", "estimatedWeightG": 45, "calories": 110, ... }],
     "totals": { "calories": 650, "calorieRange": { "low": 550, "high": 740 }, ... }
   }
   ```

### Frontend Update (`src/components/FoodScanner.tsx`)
- Display calorie range alongside the total (e.g., "~650 kcal (550–740)")
- Show estimated weight per food item in the breakdown
- Update types to include `estimatedWeightG` and `calorieRange`

### Files to Edit
- `supabase/functions/food-scanner/index.ts` — rewrite system prompt
- `src/components/FoodScanner.tsx` — display calorie range and weights

