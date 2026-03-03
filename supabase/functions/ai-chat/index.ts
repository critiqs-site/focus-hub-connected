import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a friendly, supportive AI assistant for a habit tracking & wellness app called CritiQs. You help users with fitness, nutrition, mental health, and self-improvement.

IMPORTANT RULES:
- Be **warm, friendly, and encouraging** — like a supportive friend who knows their stuff
- Use **bold** for key points and important advice
- Keep responses **short but fully detailed** — no fluff, every word counts
- Use bullet points and clear structure
- If the user shares a body/physique image, give **specific, actionable improvement advice**
- You have access to the user's habit tracker data and mood journal entries as BACKGROUND CONTEXT ONLY
- NEVER list or directly mention the user's specific todos, habits, or mood entries unless explicitly asked
- Use context SILENTLY to give more personalized advice
- If the user says "hi", respond warmly and ask how they're doing — do NOT list their data
- Give practical, real-world advice that anyone can follow`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();

    const apiKey = Deno.env.get("POLLINATIONS_API_KEY");
    if (!apiKey) {
      console.error("POLLINATIONS_API_KEY not set");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context summary for system prompt
    let contextSummary = "";
    if (context) {
      const { todos, dividers, notes } = context;
      if (todos?.length) {
        contextSummary += `\n\n[INTERNAL CONTEXT - DO NOT SHARE WITH USER]\nUser's habits: ${todos.map((t: any) => t.text).join(", ")}`;
      }
      if (dividers?.length) {
        contextSummary += `\nHabit categories: ${dividers.map((d: any) => d.name).join(", ")}`;
      }
      if (notes?.length) {
        const recentNotes = notes.slice(0, 7);
        contextSummary += `\nRecent mood entries: ${recentNotes.map((n: any) => `${n.date}: ${n.mood}${n.note ? ` - "${n.note}"` : ""}`).join("; ")}`;
      }
      contextSummary += "\n[END INTERNAL CONTEXT]";
    }

    const systemMessage = {
      role: "system",
      content: SYSTEM_PROMPT + contextSummary,
    };

    // Process messages to handle image content (vision support)
    const processedMessages = messages.map((msg: any) => {
      if (msg.image && msg.role === "user") {
        return {
          role: "user",
          content: [
            { type: "text", text: msg.content || "" },
            { type: "image_url", image_url: { url: msg.image } },
          ],
        };
      }
      return { role: msg.role, content: msg.content };
    });

    console.log("Sending chat request with", messages.length, "messages");

    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-fast",
        messages: [systemMessage, ...processedMessages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Pollinations API error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
