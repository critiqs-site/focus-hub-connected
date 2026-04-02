import { useState, useCallback } from "react";
import { Upload, AlertTriangle, ServerCrash, ShieldAlert, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type RaterStatus = "idle" | "analyzing" | "success" | "error" | "not_outfit" | "inappropriate";

interface RatingResult {
  rating: number;
  feedback: {
    fit: string;
    colorCoordination: string;
    styleCategory: string;
    bodyTypeSuitability: string;
    strengths: string[];
    improvements: string[];
  };
}

interface OutfitRaterProps {
  onAskAI?: (image: string, message: string) => void;
}

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const OutfitRater = ({ onAskAI }: OutfitRaterProps) => {
  const [status, setStatus] = useState<RaterStatus>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<RatingResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStatus("idle");
    setPreview(null);
    setResult(null);
    setErrorMsg("");
  };

  const analyzeImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File too large. Max 5MB.");
      setStatus("error");
      return;
    }
    setStatus("analyzing");
    try {
      const imageBase64 = await readFileAsDataURL(file);
      setPreview(imageBase64);

      const { data, error } = await supabase.functions.invoke("outfit-rater", {
        body: { imageBase64 },
      });

      if (error) {
        setErrorMsg("Server error. Please try again later.");
        setStatus("error");
        return;
      }

      if (data.status === "success") {
        const strengths = Array.isArray(data.feedback.strengths)
          ? data.feedback.strengths
          : data.feedback.strengths?.split("\n").filter(Boolean) || [];
        const improvements = Array.isArray(data.feedback.improvements)
          ? data.feedback.improvements
          : data.feedback.improvements?.split("\n").filter(Boolean) || [];

        setResult({
          rating: data.rating,
          feedback: {
            fit: data.feedback.fit,
            colorCoordination: data.feedback.colorCoordination,
            styleCategory: data.feedback.styleCategory || "",
            bodyTypeSuitability: data.feedback.bodyTypeSuitability || "",
            strengths,
            improvements,
          },
        });
        setStatus("success");
      } else if (data.status === "not_outfit") {
        setStatus("not_outfit");
      } else if (data.status === "inappropriate") {
        setStatus("inappropriate");
      } else {
        setErrorMsg(data.message || "Something went wrong.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Server error. Please try again later.");
      setStatus("error");
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file.");
      setStatus("error");
      return;
    }
    analyzeImage(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-400";
    if (rating >= 6) return "text-yellow-400";
    if (rating >= 4) return "text-orange-400";
    return "text-red-400";
  };

  const handleAskAI = () => {
    if (preview && onAskAI) {
      onAskAI(preview, "How can I improve my outfit?");
    }
  };

  return (
    <div className="space-y-4">
      {status === "idle" ? (
        <label
          className={`glass-card border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
            dragOver ? "border-primary bg-primary/10" : "border-primary/30 hover:border-primary/60 hover:bg-primary/5"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 text-primary/60" />
          <p className="text-sm text-muted-foreground text-center">
            <span className="text-primary font-medium">Click to upload</span> or drag & drop
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP — Max 5MB</p>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileInput} />
        </label>
      ) : status === "analyzing" ? (
        <div className="glass-card p-8 flex flex-col items-center gap-4">
          {preview && <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-xl border border-primary/20" />}
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">AI is analyzing your outfit...</p>
        </div>
      ) : status === "success" && result ? (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card p-6 flex flex-col items-center gap-3">
            {preview && <img src={preview} alt="Your outfit" className="w-48 h-48 object-cover rounded-xl border border-primary/20" />}
            <p className="text-sm text-muted-foreground">Your outfit:</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-6xl font-bold ${getRatingColor(result.rating)}`}>{result.rating}</span>
              <span className="text-2xl text-muted-foreground">/10</span>
            </div>
            {result.feedback.styleCategory && (
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {result.feedback.styleCategory}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass-card p-4">
              <p className="text-xs text-primary font-medium mb-1">👔 Fit</p>
              <p className="text-sm text-foreground">{result.feedback.fit}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-primary font-medium mb-1">🎨 Color Coordination</p>
              <p className="text-sm text-foreground">{result.feedback.colorCoordination}</p>
            </div>
          </div>

          {result.feedback.bodyTypeSuitability && (
            <div className="glass-card p-4">
              <p className="text-xs text-primary font-medium mb-1">🧍 Body Type Suitability</p>
              <p className="text-sm text-foreground">{result.feedback.bodyTypeSuitability}</p>
            </div>
          )}

          <div className="glass-card p-4">
            <p className="text-xs text-primary font-medium mb-2">⭐ Strengths</p>
            <ul className="space-y-1.5">
              {result.feedback.strengths.map((s, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card p-4">
            <p className="text-xs text-primary font-medium mb-2">🎯 What to Improve</p>
            <ul className="space-y-1.5">
              {result.feedback.improvements.map((tip, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground text-center italic">AI can make mistakes. Please double check.</p>

          <Button onClick={reset} variant="outline" className="w-full">Rate Another Outfit</Button>

          {onAskAI && (
            <button
              onClick={handleAskAI}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 orange-glow"
            >
              <Sparkles className="w-5 h-5" />
              ASK AI
            </button>
          )}
        </div>
      ) : status === "error" ? (
        <div className="glass-card p-6 border-destructive/40 bg-destructive/5 flex flex-col items-center gap-3 animate-fade-in">
          <ServerCrash className="h-10 w-10 text-destructive" />
          <p className="text-sm font-medium text-destructive">Server Error</p>
          <p className="text-xs text-muted-foreground text-center">{errorMsg || "Something went wrong."}</p>
          <Button onClick={reset} variant="outline" size="sm" className="mt-2">Try Again</Button>
        </div>
      ) : status === "not_outfit" ? (
        <div className="glass-card p-6 border-yellow-500/40 bg-yellow-500/5 flex flex-col items-center gap-3 animate-fade-in">
          {preview && <img src={preview} alt="Uploaded" className="w-32 h-32 object-cover rounded-xl opacity-60" />}
          <AlertTriangle className="h-10 w-10 text-yellow-500" />
          <p className="text-sm font-medium text-yellow-500">Not an Outfit Image</p>
          <p className="text-xs text-muted-foreground text-center">Please upload a photo showing your outfit.</p>
          <Button onClick={reset} variant="outline" size="sm" className="mt-2">Upload Different Photo</Button>
        </div>
      ) : status === "inappropriate" ? (
        <div className="glass-card p-6 border-destructive/40 bg-destructive/5 flex flex-col items-center gap-3 animate-fade-in">
          {preview && <img src={preview} alt="Uploaded" className="w-32 h-32 object-cover rounded-xl opacity-30 blur-lg" />}
          <ShieldAlert className="h-10 w-10 text-destructive" />
          <p className="text-sm font-medium text-destructive">Inappropriate Content</p>
          <p className="text-xs text-muted-foreground text-center">Please upload a photo in appropriate attire.</p>
          <Button onClick={reset} variant="outline" size="sm" className="mt-2">Upload Different Photo</Button>
        </div>
      ) : null}
    </div>
  );
};

export default OutfitRater;
