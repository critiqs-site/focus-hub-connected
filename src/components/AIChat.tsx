import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Todo, Divider, MoodNote } from "@/types/todo";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  todos: Todo[];
  dividers: Divider[];
  notes: MoodNote[];
}

type LoadingPhase = "sending" | "analyzing" | null;

const AIChat = ({ todos, dividers, notes }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey there! 👋 I'm your personal therapist. I'm here to listen, support, and help you navigate whatever you're going through. What's on your mind today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const charQueueRef = useRef<string[]>([]);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const displayedRef = useRef("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Smooth typing ticker
  const startTicker = useCallback(() => {
    if (tickerRef.current) return;
    tickerRef.current = setInterval(() => {
      if (charQueueRef.current.length > 0) {
        const char = charQueueRef.current.shift()!;
        displayedRef.current += char;
        const displayed = displayedRef.current;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: displayed };
          return updated;
        });
      }
    }, 20);
  }, []);

  const stopTicker = useCallback(() => {
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  // Flush remaining chars quickly when stream ends
  const flushQueue = useCallback(() => {
    stopTicker();
    if (charQueueRef.current.length > 0) {
      displayedRef.current += charQueueRef.current.join("");
      charQueueRef.current = [];
      const final = displayedRef.current;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: final };
        return updated;
      });
    }
  }, [stopTicker]);

  useEffect(() => () => stopTicker(), [stopTicker]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setLoadingPhase("sending");

    // Switch to analyzing after 1.5s
    const phaseTimer = setTimeout(() => setLoadingPhase("analyzing"), 1500);

    charQueueRef.current = [];
    displayedRef.current = "";

    try {
      const response = await fetch(
        "https://toxnaophisiylhqoprsv.supabase.co/functions/v1/ai-chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveG5hb3BoaXNpeWxocW9wcnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzE1MzgsImV4cCI6MjA4NTkwNzUzOH0.OLVTkMudZD1xwxJd10Q3TiN2kEK1sslWQGOVJ5TYTS4`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context: { todos, dividers, notes },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      // Add empty assistant message and start ticker
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      clearTimeout(phaseTimer);
      setLoadingPhase(null);
      startTicker();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              // Push chars into queue for smooth typing
              for (const ch of content) {
                charQueueRef.current.push(ch);
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Wait a bit for ticker to drain, then flush
      await new Promise((r) => setTimeout(r, 300));
      flushQueue();
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      clearTimeout(phaseTimer);
      flushQueue();
      if (!displayedRef.current) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      setLoadingPhase(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px] glass-card animate-fade-in">
      <div className="p-4 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Therapist</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Your personal AI therapist
        </p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary/50 text-foreground rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {loadingPhase && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-secondary/50 p-3 rounded-2xl rounded-bl-md">
                <p className="text-sm text-muted-foreground animate-pulse">
                  {loadingPhase === "sending" ? "Sending Request..." : "Analyzing..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-primary/20">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="bg-secondary/50 border-primary/30 focus:border-primary"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
