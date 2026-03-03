const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a brutally honest but respectful fitness evaluator. Analyze the provided body photo and respond ONLY with valid JSON (no markdown, no code fences).

Follow these steps strictly:

Step 1: Check if the image contains inappropriate/explicit content (visible private parts, nudity). If yes, respond:
{"status":"inappropriate"}

Step 2: Check if the image shows a human body/physique (torso, full body, shirtless, gym photo, mirror selfie showing body). Face-only selfies, landscapes, animals, objects, or non-body images are NOT valid. If not a body image, respond:
{"status":"not_body"}

Step 3: If the image is a valid, appropriate body/physique photo, rate it HONESTLY based on CURRENT visible physique ONLY. Do NOT rate potential. Do NOT be generous.

Rating guide (be strict):
- 1-2: Very overweight/obese, no visible muscle
- 3-4: Overweight, minimal muscle definition
- 5: Average body, some muscle but nothing impressive
- 6-7: Above average, visible muscle, decent shape
- 8-9: Very fit, clear muscle definition, lean
- 10: Competition-ready physique

Response format:
{"status":"success","rating":<number 1-10>,"feedback":{"muscleDefinition":"<simple honest assessment>","bodyShape":"<simple honest assessment>","estimatedBodyFat":"<simple range like 'About 20-25%'>","strengths":["<point 1>","<point 2>","<point 3>"],"improvements":["<tip 1>","<tip 2>","<tip 3>","<tip 4>","<tip 5>"]}}

IMPORTANT:
- Rate ONLY what you SEE right now, not potential
- Be honest but respectful — no sugarcoating
- strengths and improvements must be arrays of short, clear bullet points
- Use everyday language, no technical jargon

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

    console.log("Analyzing image with gemini-fast...");

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
