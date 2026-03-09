const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a schedule parser. The user will describe their daily schedule in natural language. Extract individual events with title, start time, and end time.

Rules:
- Output ONLY valid JSON array, no extra text
- Each item: {"title":"<short title>","time":"<HH:mm 24h>","timeEnd":"<HH:mm 24h>"}
- Convert all times to 24-hour format (e.g. 9 AM = 09:00, 2:30 PM = 14:30)
- If no end time given, estimate reasonable duration (meals ~30min, gym ~1hr, work ~2-4hr, meetings ~1hr)
- Keep titles SHORT (2-5 words), capitalize properly
- Sort by start time
- If user says "morning" assume 08:00-09:00, "afternoon" = 13:00-14:00, "evening" = 18:00-19:00, "night" = 21:00-22:00
- Extract ALL events mentioned, even casual ones

Example input: "eating breakfast at 9 to 9:30, gym from 10 to 11:30, lunch at 1pm, work from 2 to 6, dinner at 7:30"
Example output: [{"title":"Breakfast","time":"09:00","timeEnd":"09:30"},{"title":"Gym Session","time":"10:00","timeEnd":"11:30"},{"title":"Lunch","time":"13:00","timeEnd":"13:30"},{"title":"Work","time":"14:00","timeEnd":"18:00"},{"title":"Dinner","time":"19:30","timeEnd":"20:00"}]

ONLY output raw JSON array. No extra text.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("POLLINATIONS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
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
      console.error("AI error:", response.status);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let events = [];
    try {
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        events = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Parse error:", e, "Content:", cleaned);
    }

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
