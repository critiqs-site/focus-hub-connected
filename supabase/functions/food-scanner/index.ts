const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional nutritionist and food analyst. Analyze the provided food/meal photo and respond ONLY with valid JSON (no markdown, no code fences).

Follow these steps strictly:

Step 1: Check if the image shows food or a meal. If it does NOT contain food (landscapes, people, objects, animals, etc.), respond:
{"status":"not_food"}

Step 2: If the image contains food, identify each food item and estimate its nutritional content. Be as accurate as possible based on visual portion sizes.

Response format:
{"status":"success","foods":[{"name":"<food item>","calories":<number>,"protein":<grams>,"carbs":<grams>,"fats":<grams>}],"totals":{"calories":<total>,"protein":<total grams>,"carbs":<total grams>,"fats":<total grams>},"healthRating":<1-10>,"tips":["<tip 1>","<tip 2>","<tip 3>","<tip 4>","<tip 5>"]}

Health rating guide:
- 1-2: Very unhealthy, highly processed, excessive calories
- 3-4: Below average, unbalanced macros
- 5: Average, could be improved
- 6-7: Good, balanced meal
- 8-9: Very healthy, nutrient-dense
- 10: Optimal nutrition, perfect balance

IMPORTANT:
- Estimate portions based on what you see
- Round calories to nearest 5, macros to nearest 0.5g
- tips must be an array of short, actionable suggestions
- Use everyday language, no technical jargon
- Be realistic with estimates, don't inflate or deflate

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

    console.log("Analyzing food with gemini-fast...");

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
