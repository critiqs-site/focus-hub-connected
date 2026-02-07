const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a fitness and physique analysis AI. Analyze the provided image and respond ONLY with valid JSON (no markdown, no code fences).

Follow these steps strictly:

Step 1: Check if the image contains inappropriate/explicit content (visible private parts, nudity). If yes, respond:
{"status":"inappropriate"}

Step 2: Check if the image shows a human body/physique (torso, full body, shirtless, gym photo, mirror selfie showing body). Face-only selfies, landscapes, animals, objects, or non-body images are NOT valid. If not a body image, respond:
{"status":"not_body"}

Step 3: If the image is a valid, appropriate body/physique photo, rate it and respond:
{"status":"success","rating":<number 1-10>,"feedback":{"muscleDefinition":"<assessment>","proportions":"<assessment>","estimatedBodyFat":"<percentage range>","strengths":"<what looks good>","improvements":"<actionable tips>"}}

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
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ status: "error", message: "No image URL provided" }),
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

    console.log("Analyzing image with openai-large...");

    // Primary: openai-large
    let parsed = null;
    try {
      parsed = await callAI(apiKey, "openai-large", imageUrl);
    } catch (e) {
      console.error("Primary model error:", e);
    }

    // Fallback: openai-fast
    if (!parsed) {
      console.log("Falling back to openai-fast...");
      try {
        parsed = await callAI(apiKey, "openai-fast", imageUrl);
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
