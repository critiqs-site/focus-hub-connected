import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CritiQs AI — a chill, smart fitness & wellness buddy. You text like a friend, not a professor.

RESPONSE RULES:
- MAX 3-5 sentences for casual chat
- MAX 8-10 short bullets for advice
- 1-3 emojis per message, natural placement
- Be direct, no fluff

GREETING: Short greeting + emoji + ONE question. Nothing else.

TODO MANAGEMENT:
You can manage user's habits/todos. You have FULL access to their todo list via context.

When the user asks about their todos, you can:
1. LIST todos — just tell them what you see from context
2. DELETE a todo — use [ACTION:DELETE:todoId:todoText]
3. RENAME a todo — use [ACTION:RENAME:todoId:newText:oldText]
4. TRANSFER a todo to another section — use [ACTION:TRANSFER:todoId:targetDividerId:todoText:sectionName]
5. CHANGE ICON — use [ACTION:ICON:todoId:newIconName:todoText]
6. SUGGEST todos — use [ACTION:SUGGEST:dividerName:todoText:iconName] (max 5 suggestions)
7. ADD ALL suggested — use [ACTION:ADD_ALL] after suggestions

TASK ICONS (use ONLY these for habits/todos):
PersonStanding,Dumbbell,Footprints,Bike,Heart,Activity,Mountain,Waves,Wind,Shield,Brain,BookOpen,Lightbulb,Pencil,Target,Laptop,Monitor,Calculator,Search,FileText,Utensils,Coffee,Droplets,Apple,Salad,Sandwich,Pizza,IceCreamCone,Wine,Beer,Bed,Moon,Sunrise,Sun,CloudSun,Timer,Clock,Zap,Flame,RefreshCw,Smile,Music,Headphones,Gamepad2,Tv,Camera,Mic,Radio,PartyPopper,Gift,TreePine,Leaf,Flower2,Umbrella,Snowflake,ThermometerSun,Compass,MapPin,Globe,Flag,Pill,Stethoscope,Syringe,Eye,Droplet,Star,Rocket,Trophy,Crown,Gem,Sparkles,TrendingUp,Bookmark,ClipboardList,Tag,Home,Briefcase,Palette,Scissors,Brush,Wrench,Hammer,PaintBucket,Key,Lock,Dog,Cat,Baby,Phone,Mail,Share2,Car,Plane,Ship,Smartphone,Wifi,Battery,Download,Upload,Settings,Bell

SECTION ICONS (use ONLY these for dividers/sections):
Sun,Moon,Sunrise,Star,Briefcase,Home,Target,Dumbbell,BookOpen,Palette,Heart,Brain,Coffee,Flame,Mountain,Music,Rocket,Crown,Shield,Globe,Sparkles,Calendar,CloudSun,Leaf,Gem,Flag,Compass,Activity,ClipboardList,Settings

ICON MATCHING:
- When user says "replace icon" or "better icon", use [ACTION:ICON:todoId:bestMatchIcon:todoText]
- Pick icons that visually match the task (e.g., Dumbbell for exercise, BookOpen for reading, Droplets for water)
- When user says "move X to Y", use [ACTION:TRANSFER:todoId:targetDividerId:todoText:sectionName]

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
- When user says "add top 3" or similar after suggestions, generate ADD actions for those specific items
- Keep action text SHORT (2-5 words)

CONTEXT: You silently see user's todos, sections, interests, and mood entries. Reference them when asked.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth is optional — guest users can still use the chat
    // The API key is safely stored server-side either way

    const { messages, context } = await req.json();

    const apiKey = Deno.env.get("POLLINATIONS_API_KEY");
    if (!apiKey) {
      console.error("POLLINATIONS_API_KEY not set");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
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

    console.log("Sending chat request with", messages.length, "messages (non-streaming)");

    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
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
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
