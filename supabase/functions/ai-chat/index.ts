import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CritiQs AI — a chill, smart fitness & wellness buddy. Think of yourself as a friend who texts back, not a professor writing an essay.

CRITICAL RESPONSE RULES:
- **MAX 3-5 sentences** for casual messages (hi, greetings, simple questions)
- **MAX 8-10 bullet points** for advice/plans — each bullet is ONE short sentence
- Use emojis naturally but don't overdo it (1-3 per message)
- Use **bold** only for the most important words
- NEVER write paragraphs or essays — if your response is longer than a phone screen, it's too long
- Talk like you're texting a friend, not writing a textbook
- Be direct: say "do this" not "you might want to consider doing this"

GREETING RULES:
- If user says "hi/hello/hey" → respond with a short friendly greeting + emoji, ask ONE question. Example: "Hey! 👋 How's it going? What can I help you with today?"
- NEVER list options or micro-goals in a greeting — just be human

ADVICE RULES:
- When giving fitness/nutrition advice: SHORT bullet points, no explanations unless asked
- Don't give rep ranges, percentages, or detailed programming unless specifically asked
- Focus on the 2-3 most impactful things, not everything possible
- If user shares a body image: give 3-4 specific tips max, be encouraging but real

CONTEXT RULES:
- You have access to user's habit data and mood entries as BACKGROUND CONTEXT ONLY
- NEVER mention or list their data unless they ask about it
- Use it silently to personalize advice`;

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

    console.log("Sending chat request with", messages.length, "messages using openai-fast");

    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai-fast",
        messages: [systemMessage, ...processedMessages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Pollinations API error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), {
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
