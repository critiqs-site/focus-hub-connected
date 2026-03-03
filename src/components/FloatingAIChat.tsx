import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Plus, Image, Loader2, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string; image?: string };

interface FloatingAIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage?: { text: string; image?: string } | null;
  onInitialMessageConsumed?: () => void;
  todos?: any[];
  dividers?: any[];
  notes?: any[];
}

const FloatingAIChat = ({
  open, onOpenChange, initialMessage, onInitialMessageConsumed,
  todos = [], dividers = [], notes = [],
}: FloatingAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialSent = useRef(false);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  const streamChat = useCallback(async (allMessages: Message[]) => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({
            role: m.role,
            content: m.content,
            ...(m.image ? { image: m.image } : {}),
          })),
          context: { todos, dividers, notes },
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      // Add empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              const t = assistantText;
              setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: t } : m));
              scrollToBottom();
            }
          } catch { /* partial json */ }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [todos, dividers, notes]);

  // Handle initial message from physique rater
  useEffect(() => {
    if (open && initialMessage && !initialSent.current) {
      initialSent.current = true;
      const userMsg: Message = {
        role: "user",
        content: initialMessage.text,
        image: initialMessage.image,
      };
      setMessages(prev => [...prev, userMsg]);
      streamChat([...messages, userMsg]);
      onInitialMessageConsumed?.();
    }
  }, [open, initialMessage]);

  // Reset initialSent when chat closes
  useEffect(() => {
    if (!open) initialSent.current = false;
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !attachedImage) return;

    const userMsg: Message = {
      role: "user",
      content: text || "What do you see in this image?",
      ...(attachedImage ? { image: attachedImage } : {}),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setAttachedImage(null);
    scrollToBottom();
    await streamChat(newMessages);
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => setAttachedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform duration-200"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] max-h-[80vh] max-w-[calc(100vw-2rem)] flex flex-col bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">CritiQs AI</p>
                <p className="text-[10px] text-muted-foreground">Always here to help</p>
              </div>
            </div>
            <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {dragOver && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center z-10">
                <p className="text-primary font-medium">Drop image here</p>
              </div>
            )}

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 opacity-60">
                <Bot className="w-10 h-10 text-primary" />
                <p className="text-sm text-muted-foreground">Hey! Ask me anything about fitness, nutrition, or self-improvement 💪</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                }`}>
                  {msg.image && (
                    <img src={msg.image} alt="Attached" className="w-32 h-32 object-cover rounded-lg mb-2" />
                  )}
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1">
                      <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center mt-1">
                    <User className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Attached image preview */}
          {attachedImage && (
            <div className="px-4 pb-1 flex items-center gap-2">
              <img src={attachedImage} alt="Attached" className="w-10 h-10 object-cover rounded-lg border border-border" />
              <button onClick={() => setAttachedImage(null)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-border flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground hover:text-primary transition-colors p-1"
            >
              <Plus className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask anything..."
              className="flex-1 bg-secondary/50 border-none rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || (!input.trim() && !attachedImage)}
              className="text-primary hover:text-primary/80 transition-colors p-1 disabled:opacity-30"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;
