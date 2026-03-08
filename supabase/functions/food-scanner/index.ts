const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert clinical nutritionist with deep knowledge of USDA food composition databases. Analyze the provided food photo using a strict, methodical approach. Respond ONLY with valid JSON (no markdown, no code fences).

## STEP 1: Food Detection
If the image does NOT contain food (landscapes, people, objects, animals, etc.), respond:
{"status":"not_food"}

## STEP 2: Identification
If food is present, identify:
- Exact dish type, cuisine origin, and cooking method
- Differentiate similar items precisely:
  • Roti/chapati (thin, ~40-60g per piece) vs Naan (thick, leavened, ~80-100g per piece)
  • Steamed rice vs fried rice
  • Sautéed vs deep-fried
  • Fresh vs processed ingredients

## STEP 3: Weight Estimation (CRITICAL)
Estimate weight in grams FIRST for each item. Use visual cues:
- Standard dinner plate ≈ 25cm diameter. Use it as a ruler.
- A fist-sized portion ≈ 150g for dense foods, ~100g for leafy/light foods
- Flatbread piece: roti ~40-60g, naan ~80-100g, tortilla ~30-50g
- Cup of curry/stew ≈ 200-250g
- Side salad ≈ 80-120g

## STEP 4: Calorie Calculation
Calculate calories from weight using these USDA-based reference values per 100g:

GRAINS & BREAD:
- Cooked white rice: 130 kcal | Brown rice: 123 kcal
- Roti/chapati (whole wheat): 300 kcal/100g → ~110-135 kcal per 40-45g piece
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
- Chicken breast: 165 kcal | Thigh: 209 kcal
- Salmon: 208 kcal | White fish: 100-130 kcal
- Eggs (boiled): 155 kcal | Tofu: 76 kcal
- Chickpeas (cooked): 164 kcal | Kidney beans: 127 kcal

VEGETABLES (per 100g cooked):
- Spinach: 23 kcal | Broccoli: 35 kcal
- Potato: 87 kcal | Sweet potato: 90 kcal
- Pumpkin/squash: 26-45 kcal | Mixed veg: 50-80 kcal

FATS & OILS:
- 1 tbsp oil/ghee (15ml) ≈ 120 kcal
- Assume moderate oil (1-2 tbsp total per curry serving) unless sauce looks visibly oily/greasy

## STEP 5: Calculate Totals
- Sum all items for totals
- Provide a calorie RANGE: low estimate (lighter cooking) and high estimate (richer preparation)
- Best estimate = midpoint of the range
- Round calories to nearest 5, macros to nearest 0.5g
- Do NOT round to convenient multiples of 50 or 100

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

Rating scale:
1-2: Highly processed, excessive calories, minimal nutrients
3-4: Unbalanced, mostly refined carbs/fats
5: Average, room for improvement
6-7: Good balance, decent nutrients
8-9: Excellent — whole foods, high fiber, good protein, colorful
10: Near-optimal nutrition

## OUTPUT FORMAT (strict JSON):
{"status":"success","foods":[{"name":"<specific name>","estimatedWeightG":<grams>,"calories":<calculated from weight>,"protein":<g>,"carbs":<g>,"fats":<g>}],"totals":{"calories":<best estimate>,"calorieRange":{"low":<lower bound>,"high":<upper bound>},"protein":<g>,"carbs":<g>,"fats":<g>},"healthRating":<1-10>,"tips":["<tip1>","<tip2>","<tip3>","<tip4>","<tip5>"]}

## STRICT RULES:
- ALWAYS estimate weight in grams first, THEN derive calories. Never guess calories directly.
- Use the reference values above. If a food isn't listed, use your USDA knowledge.
- Assume MODERATE oil/fat unless the dish visually appears greasy or swimming in oil.
- Never inflate portions. A single serving curry is typically 200-350g, not 500g+.
- tips must be an array of short, actionable suggestions in everyday language.
- Do NOT call roti "naan" — they are different foods with very different calories.
- The calorie range should reflect realistic variability (±15-20%), not wild guesses.

ONLY output raw JSON. No extra text.`;

const POLLINATIONS_URL = "https://gen.pollinations.ai/v1/chat/completions";

async function callAI(apiKey: string, model: string, imageUrl: string) {
  const response = await fetch(POLLINATIONS_URL, {
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
    console.error(`Pollinations error (${model}):`, response.status, errorText);
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error(`No content in response (${model}):`, JSON.stringify(data));
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
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ status: "error", message: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("POLLINATIONS_API_KEY");
    if (!apiKey) {
      console.error("POLLINATIONS_API_KEY not set");
      return new Response(
        JSON.stringify({ status: "error", message: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing food with gemini-fast (improved prompt)...");

    let parsed = null;
    try {
      parsed = await callAI(apiKey, "gemini-fast", imageBase64);
    } catch (e) {
      console.error("Primary model error:", e);
    }

    if (!parsed) {
      console.log("Falling back to openai-fast...");
      try {
        parsed = await callAI(apiKey, "openai-fast", imageBase64);
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
