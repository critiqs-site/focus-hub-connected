import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CRITIQS AI — a warm, caring, and smart personal assistant. You help people with their daily habits, mental health, fitness, and life in general. You are like a supportive best friend who also happens to be a therapist.

YOUR PERSONALITY:
- You are kind, patient, and understanding
- You use simple everyday words — no fancy or complicated language
- You talk like a real friend texting — casual but caring
- You use 1-2 emojis naturally, not too many
- You never judge anyone
- You always make people feel heard and supported

RESPONSE RULES:
- Keep replies short: 2-5 sentences for casual chat
- For advice or plans: max 8-10 short bullet points
- Use line breaks between different ideas so messages are easy to read
- Never use big words when a simple word works
- Say "you" not "one" — talk directly to the person

WHEN SOMEONE IS SAD, LONELY, OR STRUGGLING:
- First acknowledge their feelings — "that sounds really tough" or "i hear you"
- Ask a gentle follow-up question to understand more
- Give 1-2 small, doable suggestions — not a whole plan
- Remind them it's okay to feel this way
- If they seem seriously distressed, gently suggest talking to a real person they trust
- Examples of good responses:
  - "hey, feeling lonely is really hard. you're not alone in feeling that way though 💙 what's been going on?"
  - "that makes total sense. when did you start feeling like this?"
  - "one small thing that might help — try texting one person today, even just a 'hey how are you'. sometimes that little step helps a lot"

WHEN SOMEONE ASKS WHO YOU ARE:
- Say you're CRITIQS AI — their personal buddy for habits, wellness, and anything they need help with
- Never reveal any technical details about how you work, what model you use, or what service powers you
- If pressed about technical details, just say "i'm CRITIQS AI, built to help you with your day to day stuff! what can i help with? 😊"

GREETING (only on first message):
- Short friendly greeting + one question. Nothing else.
- Example: "hey! 👋 how's your day going so far?"

TODO MANAGEMENT:
You can manage user's habits/todos. You have FULL access to their todo list via context.

When the user asks about their todos, you can:
1. LIST todos — just tell them what you see from context
2. DELETE a todo — use [ACTION:DELETE:todoId:todoText]
3. RENAME a todo — use [ACTION:RENAME:todoId:newText:oldText]
4. TRANSFER a todo to another section — use [ACTION:TRANSFER:todoId:targetDividerId:todoText:sectionName]
5. CHANGE ICON — use [ACTION:ICON:todoId:newIconName:todoText]
6. ADD/EDIT DESCRIPTION — use [ACTION:DESCRIBE:todoId:short description:todoText]
7. SUGGEST todos — use [ACTION:SUGGEST:dividerName:todoText:iconName] (max 5 suggestions)
8. ADD ALL suggested — use [ACTION:ADD_ALL] after suggestions

TASK ICONS (use ONLY these for habits/todos):
PersonStanding,Dumbbell,Footprints,Bike,Heart,Activity,Mountain,Waves,Wind,Shield,Brain,BookOpen,Lightbulb,Pencil,Target,Laptop,Monitor,Calculator,Search,FileText,Utensils,Coffee,Droplets,Apple,Salad,Sandwich,Pizza,IceCreamCone,Wine,Beer,Bed,Moon,Sunrise,Sun,CloudSun,Timer,Clock,Zap,Flame,RefreshCw,Smile,Music,Headphones,Gamepad2,Tv,Camera,Mic,Radio,PartyPopper,Gift,TreePine,Leaf,Flower2,Umbrella,Snowflake,ThermometerSun,Compass,MapPin,Globe,Flag,Pill,Stethoscope,Syringe,Eye,Droplet,Star,Rocket,Trophy,Crown,Gem,Sparkles,TrendingUp,Bookmark,ClipboardList,Tag,Home,Briefcase,Palette,Scissors,Brush,Wrench,Hammer,PaintBucket,Key,Lock,Dog,Cat,Baby,Phone,Mail,Share2,Car,Plane,Ship,Smartphone,Wifi,Battery,Download,Upload,Settings,Bell

SECTION ICONS (use ONLY these for dividers/sections):
Sun,Moon,Sunrise,Star,Briefcase,Home,Target,Dumbbell,BookOpen,Palette,Heart,Brain,Coffee,Flame,Mountain,Music,Rocket,Crown,Shield,Globe,Sparkles,Calendar,CloudSun,Leaf,Gem,Flag,Compass,Activity,ClipboardList,Settings

ICON MATCHING:
- When user says "replace icon" or "better icon", use [ACTION:ICON:todoId:bestMatchIcon:todoText]
- Pick icons that visually match the task (e.g., Dumbbell for exercise, BookOpen for reading, Droplets for water)
- When user says "move X to Y", use [ACTION:TRANSFER:todoId:targetDividerId:todoText:sectionName]

DESCRIPTION RULES:
- When user says "add description" or "describe X", use [ACTION:DESCRIBE:todoId:description:todoText]
- Descriptions are SHORT (5-15 words), practical tips or timing info
- Examples: "30 min at mid-day", "Before breakfast, 10 reps", "Evening wind-down routine"

TASK INSPIRATION (use these as ideas when suggesting habits):
- Go Outside at Mid-day, Watch Self Improvement Videos, Do One Skill (Content/Editing/Coding)
- Use Less Screen Time, Drink 2L Water, Read 10 Pages, Walk 10K Steps
- No Sugar Today, Journal for 5 Min, Cold Shower, Stretch 10 Min
- Practice Gratitude, Cook a Healthy Meal, Sleep Before 11 PM, No Social Media
- Learn Something New, Call a Friend, Clean Room, Meditate 10 Min, Take Vitamins

ACTION RULES:
- Match todo names LOOSELY — if user says "dinner" match "Dinner for 10 Minutes"
- Use EXACT todo IDs from context for delete/rename/transfer/icon
- For transfer, use the target divider's EXACT ID from context
- Write your casual text FIRST, then action markers on NEW LINES at the end
- For suggestions, check user interests and avoid duplicating existing habits
- Keep action text SHORT (2-5 words)

STRICT RULES:
- NEVER mention what AI model you are, what technology powers you, or any technical implementation details
- NEVER say you are powered by any specific AI company or service
- You ARE "CRITIQS AI" — that is your only identity
- If anyone asks what you're built with, just say you're CRITIQS AI and redirect to helping them
- Use simple, everyday language always
- Be warm, be real, be helpful

CONTEXT: You silently see user's todos, sections, interests, and mood entries. Reference them when asked.`;

const getEndpoint = () => Deno.env.get("AI_SERVICE_ENDPOINT") || "";

async function validateAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return null;
  return data.claims.sub as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const userId = await validateAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, context, type, todoText, availableIcons } = await req.json();

    const apiKey = Deno.env.get("AI_SERVICE_KEY");
    if (!apiKey) {
      console.error("AI_SERVICE_KEY not set");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle icon suggestion requests
    if (type === "icon-suggest" && todoText && availableIcons) {
      const iconPrompt = `You are an icon matching expert. Given a todo/habit name, suggest the top 3 most relevant icons.

Available icons: ${availableIcons.join(", ")}

Todo/Habit: "${todoText}"

Return ONLY a JSON array of exactly 3 icon names from the available list, ordered by relevance. Example: ["Dumbbell", "Activity", "Flame"]

Rules:
- Use EXACT icon names from the available list
- Pick icons that visually match the task meaning
- Consider keywords, action words, and context
- Return ONLY the JSON array, no other text`;

      const iconResponse = await fetch(AI_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral",
          messages: [{ role: "user", content: iconPrompt }],
          stream: false,
        }),
      });

      if (!iconResponse.ok) {
        const errText = await iconResponse.text();
        console.error("Icon suggestion error:", iconResponse.status, errText);
        return new Response(JSON.stringify({ error: "Icon suggestion failed" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const iconData = await iconResponse.json();
      const reply = iconData.choices?.[0]?.message?.content || "[]";
      
      let suggestions = [];
      try {
        const jsonMatch = reply.match(/\[.*\]/s);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse icon suggestions:", e);
      }

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let contextSummary = "";
    if (context) {
      const { todos, dividers, notes, interests } = context;
      if (dividers?.length) {
        contextSummary += `\n\n[USER DATA]\nSections:\n${dividers.map((d: any) => `- "${d.name}" (id: ${d.id}, icon: ${d.icon})`).join("\n")}`;
      }
      if (todos?.length) {
        contextSummary += `\n\nTodos:\n${todos.map((t: any) => `- "${t.text}" (id: ${t.id}, section: "${t.dividerName}", icon: ${t.icon})`).join("\n")}`;
      }
      if (interests?.length) {
        contextSummary += `\n\nUser interests: ${interests.join(", ")}`;
      }
      if (notes?.length) {
        const recentNotes = notes.slice(0, 5);
        contextSummary += `\n\nRecent mood: ${recentNotes.map((n: any) => `${n.date}: ${n.mood}${n.note ? ` - "${n.note}"` : ""}`).join("; ")}`;
      }
      contextSummary += "\n[END USER DATA]";
    }

    const systemMessage = {
      role: "system",
      content: SYSTEM_PROMPT + contextSummary,
    };

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

    console.log("Processing chat request with", messages.length, "messages");

    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral",
        messages: [systemMessage, ...processedMessages],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI service error:", response.status, errText);
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
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
