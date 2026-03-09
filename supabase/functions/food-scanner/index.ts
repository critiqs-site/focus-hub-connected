import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert clinical nutritionist with deep knowledge of USDA FoodData Central (2026). Analyze the provided food photo using a strict, methodical approach. Respond ONLY with valid JSON (no markdown, no code fences).

## STEP 1: Food Detection
If the image does NOT contain food (landscapes, people, objects, animals, etc.), respond:
{"status":"not_food"}

## STEP 2: Precise Visual Identification (CRITICAL — DO NOT GUESS)
If food is present, identify ONLY what you can actually see. Follow these rules strictly:
- **Never assume cooking methods you can't see.** If eggs are cut in half with visible yolk, they are BOILED, not scrambled. Scrambled eggs look like soft, broken curds.
- **Never double-count.** Two egg halves = 1 whole egg, not 2 eggs. Count the actual number of whole items.
- **Identify by visual appearance, not assumption:**
  • Flat, thin bread = roti/chapati (~40-60g each), NOT naan (which is thick, puffy, teardrop-shaped, ~80-100g)
  • Long green stalks = asparagus or bok choy, NOT spinach (which is leafy, flat)
  • Pink/light meat = identify precisely: chicken breast (white), ham (pink, processed), salmon (orange-pink, flaky)
  • Curds/chunks in sauce = curry; loose grains = rice; etc.
- **If uncertain between two items, state the more common/likely one but do NOT inflate calories by picking the higher-calorie option.**

## STEP 3: Weight Estimation (CRITICAL — USE VISUAL REFERENCES)
Estimate weight in grams FIRST for each item. Be conservative — most people overestimate portions.
Visual calibration:
- Standard dinner plate ≈ 25cm diameter. Use it as a ruler.
- A single large egg (whole, with shell removed) ≈ 50g
- A fist-sized portion ≈ 150g for dense foods (rice, meat), ~80-100g for light foods (greens)
- Palm-sized meat portion (no fingers) ≈ 85-100g, 3-4mm thick
- A thin slice of deli meat ≈ 20-30g
- Flatbread piece: roti ~40-60g, naan ~80-100g
- Cup of curry/stew ≈ 200-250g
- Small side of vegetables ≈ 50-80g
- Cherry tomatoes (5-6 pieces) ≈ 50-75g
- **DO NOT inflate portions.** If something looks small, estimate small. A few slices of meat ≈ 50-80g, not 150g.

## STEP 4: Calorie Calculation (FROM WEIGHT, NOT GUESSING)
Calculate calories from weight using these USDA-based reference values per 100g:

EGGS:
- Whole boiled egg: 155 kcal/100g → ~78 kcal per large egg (50g)
- Scrambled egg (with butter/oil): 149 kcal/100g
- Fried egg: 196 kcal/100g
- RULE: Two egg halves = ONE egg (~50g, ~78 kcal). Do NOT count each half separately.

GRAINS & BREAD:
- Cooked white rice: 130 kcal | Brown rice: 123 kcal
- Roti/chapati (whole wheat): 300 kcal/100g → ~120-135 kcal per 40-45g piece
- Naan (white flour): 260 kcal/100g → ~210-260 kcal per 80-100g piece
- White bread: 265 kcal | Pasta (cooked): 131 kcal

CURRIES & STEWS (per 100g cooked):
- Chickpea curry (moderate oil): 120-160 kcal
- Chicken curry: 110-150 kcal
- Potato curry/sabzi: 90-130 kcal
- Dal (lentil soup): 80-120 kcal
- Coconut milk-based curry: add 30-50 kcal/100g
- Heavy cream/butter-based: add 50-80 kcal/100g

PROTEINS (per 100g cooked):
- Chicken breast (no skin): 165 kcal | Thigh: 209 kcal
- Ham/deli meat: 145 kcal | Turkey breast: 135 kcal
- Salmon: 208 kcal | White fish: 100-130 kcal
- Eggs (boiled): 155 kcal | Tofu: 76 kcal
- Chickpeas (cooked): 164 kcal | Kidney beans: 127 kcal

VEGETABLES (per 100g cooked):
- Asparagus: 22 kcal | Bok choy: 13 kcal
- Spinach (cooked): 23 kcal | Broccoli: 35 kcal
- Potato: 87 kcal | Sweet potato: 90 kcal
- Cherry tomatoes: 18 kcal | Mixed veg: 50-80 kcal

FATS & OILS:
- 1 tbsp oil/ghee (15ml) ≈ 120 kcal
- Only add cooking fat if the food visibly glistens or pools with oil. If dry/plain, assume minimal added fat.

## STEP 5: Calculate Totals
- Sum all items for totals
- Provide a calorie RANGE: low estimate (smaller portions, leaner prep) and high estimate (larger portions, richer prep)
- Best estimate = midpoint of the range
- Round calories to nearest 5, macros to nearest 0.5g
- The range should be ±15-20% of best estimate, reflecting realistic variability
- **SANITY CHECK**: Compare your total against common sense. A light meal of 1 egg + some veggies + a small piece of meat should NOT exceed 300-400 kcal. A full plate of curry + rice + bread = 500-800 kcal. If your number seems high, re-examine portions.

## STEP 6: Health Rating
Rate 1-10 considering ALL of these:
- Fiber content (legumes, whole grains, vegetables = higher)
- Protein quality and quantity
- Micronutrient density (colorful vegetables = higher)
- Processing level (whole foods = higher, processed = lower)
- Glycemic load (refined carbs = lower rating)
- Fat quality (olive oil, nuts = neutral; deep fried = lower)
- Sodium (visible cheese, processed meat = lower)
- Portion appropriateness
- Balance: meals lacking entire food groups (e.g., no carbs/fiber) cap at 7-8 even if otherwise healthy

Rating scale:
1-2: Highly processed, excessive calories, minimal nutrients
3-4: Unbalanced, mostly refined carbs/fats
5: Average, room for improvement
6-7: Good balance OR strong in one area but missing others
8-9: Excellent — whole foods, high fiber, good protein, colorful, balanced
10: Near-optimal nutrition

## OUTPUT FORMAT (strict JSON):
{"status":"success","foods":[{"name":"<specific name>","estimatedWeightG":<grams>,"calories":<calculated from weight>,"protein":<g>,"carbs":<g>,"fats":<g>}],"totals":{"calories":<best estimate>,"calorieRange":{"low":<lower bound>,"high":<upper bound>},"protein":<g>,"carbs":<g>,"fats":<g>},"healthRating":<1-10>,"tips":["<tip1>","<tip2>","<tip3>","<tip4>","<tip5>"]}

## STRICT RULES:
- ALWAYS estimate weight in grams first, THEN derive calories. Never guess calories directly.
- Use the reference values above. If a food isn't listed, use your USDA knowledge.
- Two halves of an egg = ONE egg. Count actual whole items.
- NEVER call roti "naan" — they are visually and calorically different.
- NEVER call boiled eggs "scrambled" — look at the actual texture.
- Assume MODERATE oil/fat ONLY if the dish visually appears cooked with oil. Plain boiled/steamed food = minimal fat.
- Never inflate portions. Estimate conservatively based on visual size relative to plate/hand.
- tips must be an array of short, actionable suggestions in everyday language.
- The calorie range should reflect realistic variability (±15-20%), not wild guesses.
- If drinks are visible but not clearly identifiable, do NOT include them in the breakdown.

ONLY output raw JSON. No extra text.`;

const getEndpoint = () => Deno.env.get("AI_SERVICE_ENDPOINT") || "";

async function callAI(apiKey: string, model: string, imageUrl: string) {
  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SYSTEM_PROMPT },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI service error (${model}):`, response.status, errorText);
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error(`No content in AI response (${model}):`, JSON.stringify(data));
    return null;
  }

  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ status: "error", message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !authData?.claims) {
      return new Response(
        JSON.stringify({ status: "error", message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ status: "error", message: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("AI_SERVICE_KEY");
    if (!apiKey) {
      console.error("AI_SERVICE_KEY not set");
      return new Response(
        JSON.stringify({ status: "error", message: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing food with primary model...");

    let parsed = null;
    try {
      parsed = await callAI(apiKey, "mistral", imageBase64);
    } catch (e) {
      console.error("Primary model error:", e);
    }

    if (!parsed) {
      console.log("Retrying with model...");
      try {
        parsed = await callAI(apiKey, "mistral", imageBase64);
      } catch (e) {
        console.error("Fallback model error:", e);
      }
    }

    if (!parsed) {
      return new Response(
        JSON.stringify({ status: "error", message: "AI service unavailable. Please try again later." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Result status:", parsed.status);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ status: "error", message: "Server error. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
