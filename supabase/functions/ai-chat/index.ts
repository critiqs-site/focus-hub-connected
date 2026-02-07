import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a compassionate, empathetic therapist. Your role is to listen, validate feelings, and gently guide the user toward self-awareness and emotional well-being.

IMPORTANT RULES:
- You have access to the user's habit tracker data and mood journal entries as BACKGROUND CONTEXT ONLY.
- NEVER list, enumerate, or directly mention the user's specific todos, habits, or mood entries unless the user explicitly asks about them.
- Use this context SILENTLY to better understand the user and provide more personalized, relevant advice.
- If the user says "hi" or greets you, respond warmly and ask how they're feeling — do NOT start listing their habits or data.
- Be warm, professional, supportive, and non-judgmental.
- Ask thoughtful follow-up questions.
- Offer practical coping strategies when appropriate.
- Keep responses concise but meaningful.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("LOVABLE_API_KEY not set");
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

    console.log("Sending chat request with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [systemMessage, ...messages],
        stream: true,
        max_completion_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response back
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
