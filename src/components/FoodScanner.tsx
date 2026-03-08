import { useState, useCallback } from "react";
import { Upload, AlertTriangle, ServerCrash, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type ScannerStatus = "idle" | "analyzing" | "success" | "error" | "not_food";

interface FoodItem {
  name: string;
  estimatedWeightG?: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface CalorieRange {
  low: number;
  high: number;
}

interface ScanResult {
  foods: FoodItem[];
  totals: {
    calories: number;
    calorieRange?: CalorieRange;
    protein: number;
    carbs: number;
    fats: number;
  };
  healthRating: number;
  tips: string[];
}

interface FoodScannerProps {
  onAskAI?: (image: string, message: string) => void;
}

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const FoodScanner = ({ onAskAI }: FoodScannerProps) => {
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
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

      const { data, error } = await supabase.functions.invoke("food-scanner", {
        body: { imageBase64 },
      });

      if (error) {
        setErrorMsg("Server error. Please try again later.");
        setStatus("error");
        return;
      }

      if (data.status === "success") {
        const tips = Array.isArray(data.tips)
          ? data.tips
          : data.tips?.split("\n").filter(Boolean) || [];

        setResult({
          foods: data.foods || [],
          totals: data.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 },
          healthRating: data.healthRating || 0,
          tips,
        });
        setStatus("success");
      } else if (data.status === "not_food") {
        setStatus("not_food");
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
      onAskAI(preview, "Give me a healthier alternative for this meal");
    }
  };

  const formatCalorieDisplay = (totals: ScanResult["totals"]) => {
    if (totals.calorieRange) {
      return (
        <div className="flex flex-col items-center">
          <p className="text-lg font-bold text-foreground">~{totals.calories}</p>
          <p className="text-xs text-muted-foreground">
            ({totals.calorieRange.low}–{totals.calorieRange.high})
          </p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center">
        <p className="text-lg font-bold text-foreground">{totals.calories}</p>
        <p className="text-xs text-muted-foreground">kcal</p>
      </div>
    );
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
          <p className="text-sm text-muted-foreground">AI is scanning your meal...</p>
        </div>
      ) : status === "success" && result ? (
        <div className="space-y-4 animate-fade-in">
          {/* Header with image and health rating */}
          <div className="glass-card p-6 flex flex-col items-center gap-3">
            {preview && <img src={preview} alt="Your meal" className="w-48 h-48 object-cover rounded-xl border border-primary/20" />}
            <p className="text-sm text-muted-foreground">Health Rating:</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-6xl font-bold ${getRatingColor(result.healthRating)}`}>{result.healthRating}</span>
              <span className="text-2xl text-muted-foreground">/10</span>
            </div>
          </div>

          {/* Macro totals */}
          <div className="grid grid-cols-4 gap-2">
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-muted-foreground">Calories</p>
              {formatCalorieDisplay(result.totals)}
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-muted-foreground">Protein</p>
              <p className="text-lg font-bold text-blue-400">{result.totals.protein}g</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-muted-foreground">Carbs</p>
              <p className="text-lg font-bold text-amber-400">{result.totals.carbs}g</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="text-xs text-muted-foreground">Fats</p>
              <p className="text-lg font-bold text-red-400">{result.totals.fats}g</p>
            </div>
          </div>

          {/* Individual food items */}
          {result.foods.length > 0 && (
            <div className="glass-card p-4">
              <p className="text-xs text-primary font-medium mb-3">🍽️ Food Breakdown</p>
              <div className="space-y-2">
                {result.foods.map((food, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground font-medium">{food.name}</span>
                      {food.estimatedWeightG && (
                        <span className="text-xs text-muted-foreground">~{food.estimatedWeightG}g</span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{food.calories} cal</span>
                      <span className="text-blue-400">{food.protein}g P</span>
                      <span className="text-amber-400">{food.carbs}g C</span>
                      <span className="text-red-400">{food.fats}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accuracy note */}
          <p className="text-xs text-muted-foreground text-center italic">
            Estimates based on visual portion analysis. Actual values may vary ±15-20%.
          </p>

          {/* Tips */}
          <div className="glass-card p-4">
            <p className="text-xs text-primary font-medium mb-2">💡 Nutrition Tips</p>
            <ul className="space-y-1.5">
              {result.tips.map((tip, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={reset} variant="outline" className="w-full">Scan Another Meal</Button>

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
      ) : status === "not_food" ? (
        <div className="glass-card p-6 border-yellow-500/40 bg-yellow-500/5 flex flex-col items-center gap-3 animate-fade-in">
          {preview && <img src={preview} alt="Uploaded" className="w-32 h-32 object-cover rounded-xl opacity-60" />}
          <AlertTriangle className="h-10 w-10 text-yellow-500" />
          <p className="text-sm font-medium text-yellow-500">No Food Detected</p>
          <p className="text-xs text-muted-foreground text-center">Please upload a photo of food or a meal.</p>
          <Button onClick={reset} variant="outline" size="sm" className="mt-2">Upload Different Photo</Button>
        </div>
      ) : null}
    </div>
  );
};

export default FoodScanner;
