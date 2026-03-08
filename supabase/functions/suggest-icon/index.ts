const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALL_ICONS = [
  "PersonStanding","Dumbbell","Footprints","Bike","Heart","Activity","Mountain","Waves","Wind","Shield",
  "Brain","BookOpen","Lightbulb","Pencil","Target","Laptop","Monitor","Calculator","Search","FileText",
  "Utensils","Coffee","Droplets","Apple","Salad","Sandwich","Pizza","IceCreamCone","Wine","Beer",
  "Bed","Moon","Sunrise","Sun","CloudSun","Timer","Clock","Zap","Flame","RefreshCw",
  "Smile","Music","Headphones","Gamepad2","Tv","Camera","Mic","Radio","PartyPopper","Gift",
  "TreePine","Leaf","Flower2","Umbrella","Snowflake","ThermometerSun","Compass","MapPin","Globe","Flag",
  "Pill","Stethoscope","Syringe","Eye","Droplet","Star","Rocket","Trophy","Crown","Gem",
  "Sparkles","TrendingUp","Bookmark","ClipboardList","Tag","Home","Briefcase","Palette","Scissors","Brush",
  "Wrench","Hammer","PaintBucket","Key","Lock","Dog","Cat","Baby","Phone","Mail",
  "Share2","Car","Plane","Ship","Smartphone","Wifi","Battery","Download","Upload","Settings","Bell"
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { todoName } = await req.json();
    if (!todoName || typeof todoName !== "string") {
      return new Response(JSON.stringify({ icons: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("POLLINATIONS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Given this habit/todo name: "${todoName}"

Pick the TOP 3 most relevant icons from this list that best represent this habit visually:
${ALL_ICONS.join(", ")}

Return ONLY a JSON array of exactly 3 icon names, nothing else. Example: ["Dumbbell","Heart","Activity"]`;

    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        messages: [
          { role: "system", content: "You are an icon matching assistant. You ONLY return a JSON array of exactly 3 icon names. No explanation, no markdown, just the array." },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("Pollinations error:", response.status);
      return new Response(JSON.stringify({ icons: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON array from response
    const match = reply.match(/\[[\s\S]*?\]/);
    if (!match) {
      return new Response(JSON.stringify({ icons: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = JSON.parse(match[0]);
    const validIcons = parsed.filter((name: string) => ALL_ICONS.includes(name)).slice(0, 3);

    return new Response(JSON.stringify({ icons: validIcons }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("suggest-icon error:", error);
    return new Response(JSON.stringify({ icons: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
