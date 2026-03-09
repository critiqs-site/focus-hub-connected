import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a brutally honest but respectful fashion evaluator. Analyze the provided outfit photo and respond ONLY with valid JSON (no markdown, no code fences).

Follow these steps strictly:

Step 1: Check if the image contains inappropriate/explicit content (visible private parts, nudity). If yes, respond:
{"status":"inappropriate"}

Step 2: Check if the image shows a person wearing an outfit (clothing visible). Random objects, landscapes, animals, or images without visible clothing are NOT valid. If not an outfit image, respond:
{"status":"not_outfit"}

Step 3: If the image is a valid, appropriate outfit photo, rate it HONESTLY based on the CURRENT outfit ONLY.

Rating guide (be strict):
- 1-2: Very poor outfit choice, clashing colors, terrible fit
- 3-4: Below average, some issues with fit or coordination
- 5: Average, nothing special, basic outfit
- 6-7: Above average, good color coordination, decent style
- 8-9: Very stylish, excellent fit, great color harmony
- 10: Fashion-forward, magazine-worthy outfit

Response format:
{"status":"success","rating":<number 1-10>,"feedback":{"fit":"<how well clothes fit the body>","colorCoordination":"<assessment of color choices and harmony>","styleCategory":"<e.g. Casual, Smart Casual, Streetwear, Formal>","bodyTypeSuitability":"<how well the outfit suits their body type>","strengths":["<point 1>","<point 2>","<point 3>"],"improvements":["<tip 1>","<tip 2>","<tip 3>","<tip 4>","<tip 5>"]}}

IMPORTANT:
- Rate ONLY what you SEE right now
- Be honest but respectful — no sugarcoating
- strengths and improvements must be arrays of short, clear bullet points
- Use everyday language, no technical jargon

ONLY output raw JSON. No extra text.`;

const getEndpoint = () => Deno.env.get("AI_SERVICE_ENDPOINT") || "";

async function callAI(apiKey: string, model: string, imageUrl: string) {
  const response = await fetch(AI_ENDPOINT, {
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

    console.log("Analyzing outfit with primary model...");

    let parsed = null;
    try {
      parsed = await callAI(apiKey, "gemini-fast", imageBase64);
    } catch (e) {
      console.error("Primary model error:", e);
    }

    if (!parsed) {
      console.log("Falling back to secondary model...");
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
