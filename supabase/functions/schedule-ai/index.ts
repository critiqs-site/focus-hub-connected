import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a schedule parser. The user will describe their daily schedule in natural language. Extract individual events with title, start time, end time, description, and a color category.

Rules:
- Output ONLY valid JSON array, no extra text
- Each item: {"title":"<short title>","time":"<HH:mm 24h>","timeEnd":"<HH:mm 24h>","description":"<1-2 sentence description>","color":"<color>"}
- Convert all times to 24-hour format (e.g. 9 AM = 09:00, 2:30 PM = 14:30)
- If no end time given, estimate reasonable duration (meals ~30min, gym ~1hr, work ~2-4hr, meetings ~1hr)
- Keep titles SHORT (2-5 words), capitalize properly
- description should be a helpful short note about the activity based on context
- Sort by start time
- If user says "morning" assume 08:00-09:00, "afternoon" = 13:00-14:00, "evening" = 18:00-19:00, "night" = 21:00-22:00
- Extract ALL events mentioned, even casual ones

Color assignment rules (pick the most fitting):
- "red" = work, meetings, deadlines, assignments
- "green" = breaks, rest, relaxation, meditation
- "blue" = study, research, reading, learning
- "yellow" = play, games, fun, social, hobbies
- "purple" = exercise, gym, sports, fitness
- "orange" = meals, eating, cooking, food
- "pink" = self-care, grooming, shopping, personal

Example input: "eating breakfast at 9 to 9:30, gym from 10 to 11:30, lunch at 1pm, work from 2 to 6, dinner at 7:30"
Example output: [{"title":"Breakfast","time":"09:00","timeEnd":"09:30","description":"Morning meal to start the day","color":"orange"},{"title":"Gym Session","time":"10:00","timeEnd":"11:30","description":"Workout session for fitness","color":"purple"},{"title":"Lunch","time":"13:00","timeEnd":"13:30","description":"Midday meal break","color":"orange"},{"title":"Work","time":"14:00","timeEnd":"18:00","description":"Afternoon work block","color":"red"},{"title":"Dinner","time":"19:30","timeEnd":"20:00","description":"Evening dinner","color":"orange"}]

ONLY output raw JSON array. No extra text.`;

const getEndpoint = () => Deno.env.get("AI_SERVICE_ENDPOINT") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("AI_SERVICE_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(getEndpoint(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("AI service error:", response.status);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let events: any[] = [];
    try {
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        events = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Parse error:", e);
    }

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
