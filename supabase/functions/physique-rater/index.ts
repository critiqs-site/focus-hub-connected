import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const systemPrompt = `You are a fitness and physique analysis AI. Analyze the provided image and respond ONLY with valid JSON (no markdown, no code fences).

Follow these steps strictly:

Step 1: Check if the image contains inappropriate/explicit content (visible private parts, nudity). If yes, respond:
{"status":"inappropriate"}

Step 2: Check if the image shows a human body/physique (torso, full body, shirtless, gym photo, mirror selfie showing body). Face-only selfies, landscapes, animals, objects, or non-body images are NOT valid. If not a body image, respond:
{"status":"not_body"}

Step 3: If the image is a valid, appropriate body/physique photo, rate it and respond:
{"status":"success","rating":<number 1-10>,"feedback":{"muscleDefinition":"<assessment>","proportions":"<assessment>","estimatedBodyFat":"<percentage range>","strengths":"<what looks good>","improvements":"<actionable tips>"}}

ONLY output raw JSON. No extra text.`;

    console.log("Calling Pollinations API with image URL:", imageUrl.substring(0, 80) + "...");

    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai-large",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: systemPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pollinations API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ status: "error", message: "AI service unavailable. Please try again later." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Pollinations API response received");

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in API response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ status: "error", message: "AI returned empty response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON from the AI response, handling potential markdown fences
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ status: "error", message: "AI returned invalid response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsed result status:", parsed.status);

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
