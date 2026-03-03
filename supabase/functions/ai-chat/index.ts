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
- You have access to user's habit data, mood entries, and profile info as context
- You can reference their todos/habits when they ask about them
- Use their interests to personalize suggestions

TODO MANAGEMENT:
You can help users manage their habits/todos. When the user asks to add, delete, or get suggestions for todos, include ACTION MARKERS in your response.

ACTION MARKER FORMAT (use these EXACTLY):
- To delete a todo: [ACTION:DELETE:todoId:todoText]
- To suggest adding a todo: [ACTION:SUGGEST:dividerName:todoText:iconName]
- To add an "Add All" button after suggestions: [ACTION:ADD_ALL]

ICON NAMES available: Dumbbell, Heart, Brain, BookOpen, Droplets, Sun, Moon, Star, Target, Flame, Apple, Coffee, Music, Pencil, Clock, Zap, Trophy, Smile, Shield, Leaf

RULES FOR ACTIONS:
- When user asks to DELETE a todo, find the matching todo from context by name, use its exact ID
- When SUGGESTING todos, check user's interests and existing habits to avoid duplicates
- Suggest 3-5 todos max, pick the best divider/section for each
- Keep action text SHORT (2-5 words max)
- Write your text response FIRST, then put action markers on separate lines at the end
- If user asks "can you see X todo" — confirm yes/no, reference the section it's in
- If a divider/section doesn't exist, use the closest matching one from their existing dividers`;

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

    // Build rich context for system prompt
    let contextSummary = "";
    if (context) {
      const { todos, dividers, notes, interests } = context;
      if (dividers?.length) {
        contextSummary += `\n\n[USER CONTEXT]\nHabit sections: ${dividers.map((d: any) => `${d.name} (id:${d.id}, icon:${d.icon})`).join(", ")}`;
      }
      if (todos?.length) {
        contextSummary += `\nUser's habits:\n${todos.map((t: any) => `- "${t.text}" (id:${t.id}, section:${t.dividerName || "unknown"}, icon:${t.icon})`).join("\n")}`;
      }
      if (interests?.length) {
        contextSummary += `\nUser interests: ${interests.join(", ")}`;
      }
      if (notes?.length) {
        const recentNotes = notes.slice(0, 5);
        contextSummary += `\nRecent mood: ${recentNotes.map((n: any) => `${n.date}: ${n.mood}${n.note ? ` - "${n.note}"` : ""}`).join("; ")}`;
      }
      contextSummary += "\n[END CONTEXT]";
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

    console.log("Sending chat request with", messages.length, "messages (non-streaming)");

    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai-fast",
        messages: [systemMessage, ...processedMessages],
        stream: false,
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

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
