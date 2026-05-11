import { useState, useRef, useEffect } from "react";
import { Mic, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GUEST_AI_MESSAGE } from "@/lib/aiAccess";

interface VoiceRecorderButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const VoiceRecorderButton = ({ onTranscript, disabled }: VoiceRecorderButtonProps) => {
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(new Array(7).fill(0.2));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  };

  useEffect(() => () => cleanupStream(), []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone not supported in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Set up analyser for live waveform
      try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(data);
          // Split into 7 buckets, compute amplitude per bucket
          const buckets = 7;
          const next: number[] = [];
          const size = Math.floor(data.length / buckets);
          for (let b = 0; b < buckets; b++) {
            let sum = 0;
            for (let i = 0; i < size; i++) {
              const v = (data[b * size + i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / size);
            next.push(Math.min(1, Math.max(0.15, rms * 3)));
          }
          setLevels(next);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) { console.warn("waveform init failed", e); }
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;
      recorder.start();
      setState("recording");
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          // auto-stop at 2 minutes to avoid huge files
          if (next >= 120) {
            try { recorder.stop(); } catch {}
          }
          return next;
        });
      }, 1000);
    } catch (e: any) {
      console.error("mic error", e);
      if (e?.name === "NotAllowedError") {
        toast.error("Microphone permission denied");
      } else {
        toast.error("Couldn't access microphone");
      }
      cleanupStream();
      setState("idle");
    }
  };

  const stop = () => {
    const r = mediaRecorderRef.current;
    if (r && r.state !== "inactive") {
      try { r.stop(); } catch {}
    }
  };

  const handleStop = async () => {
    cleanupStream();
    const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
    chunksRef.current = [];
    if (blob.size < 1000) {
      toast.error("Recording too short");
      setState("idle");
      return;
    }
    setState("processing");
    try {
      const form = new FormData();
      form.append("file", blob, "audio.webm");
      form.append("model", "whisper");

      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        toast.error("Please sign in to use voice");
        setState("idle");
        return;
      }
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/transcribe-audio`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed (${res.status})`);
      }
      const data = await res.json();
      const text = (data?.text || "").trim();
      if (!text) {
        toast.error("Couldn't hear anything — try again");
      } else {
        onTranscript(text);
        toast.success("Transcribed");
      }
    } catch (e: any) {
      console.error("transcribe error", e);
      toast.error(e?.message || "Transcription failed");
    } finally {
      setState("idle");
      setSeconds(0);
    }
  };

  const handleClick = () => {
    if (disabled) { toast.error(GUEST_AI_MESSAGE); return; }
    if (state === "idle") start();
    else if (state === "recording") stop();
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {state === "recording" && (
        <div className="glass-panel px-4 py-2 rounded-full text-xs font-medium flex items-center gap-3 shadow-lg">
          <span className="text-destructive flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" /> {fmt(seconds)}
          </span>
          <div className="flex items-center gap-[3px] h-5 text-primary">
            {levels.map((lv, i) => (
              <span
                key={i}
                className="mic-wave-bar"
                style={{
                  height: `${Math.round(lv * 22)}px`,
                  animationDelay: `${i * 0.08}s`,
                  opacity: 0.7 + lv * 0.3,
                }}
              />
            ))}
          </div>
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={state === "processing"}
        title={
          disabled ? "Sign in to use voice" :
          state === "idle" ? "Voice → AI" :
          state === "recording" ? "Stop & transcribe" :
          "Transcribing..."
        }
        className={`w-20 h-20 rounded-full backdrop-blur-xl flex items-center justify-center transition-all duration-300 hover:scale-110 disabled:hover:scale-100 ring-2 ${
          disabled
            ? "bg-primary/10 text-primary/60 ring-primary/20 cursor-not-allowed opacity-70"
            : state === "recording"
            ? "bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/50 ring-destructive/40"
            : state === "processing"
            ? "bg-primary/10 text-primary/70 ring-primary/20 shadow-lg shadow-primary/20"
            : "bg-primary/15 text-primary border border-primary/50 ring-primary/20 shadow-lg shadow-primary/30 hover:bg-primary/25 hover:ring-primary/40 hover:shadow-primary/50"
        }`}
      >
        {state === "processing" ? <Loader2 className="w-7 h-7 animate-spin" /> :
         state === "recording" ? (
           <div className="flex items-center gap-[3px]">
             {levels.slice(0, 5).map((lv, i) => (
               <span
                 key={i}
                 className="mic-wave-bar"
                 style={{
                   height: `${Math.round(lv * 28)}px`,
                   animationDelay: `${i * 0.1}s`,
                 }}
               />
             ))}
           </div>
         ) :
         <Mic className="w-8 h-8" />}
      </button>
    </div>
  );
};

export default VoiceRecorderButton;
