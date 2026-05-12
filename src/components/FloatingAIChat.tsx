import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Plus, Loader2, User, Check, Trash2, Pencil, ArrowRight, ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Todo, Divider } from "@/types/todo";
import { supabase } from "@/integrations/supabase/client";
import critiqsLogo from "@/assets/critiqs-ai-logo.png";
import { voiceBus } from "@/lib/voiceBus";

import { TODO_ICON_NAMES, DIVIDER_ICON_NAMES } from "@/lib/icons";
import { toast } from "sonner";
import { useAiUsage } from "@/hooks/useAiUsage";

type Message = { role: "user" | "assistant"; content: string; image?: string };

interface ActionButton {
  type: "DELETE" | "SUGGEST" | "ADD_ALL" | "RENAME" | "TRANSFER" | "ICON" | "DESCRIBE";
  todoId?: string;
  todoText?: string;
  dividerName?: string;
  iconName?: string;
  newText?: string;
  description?: string;
  targetDividerId?: string;
  sectionName?: string;
}

interface FloatingAIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage?: { text: string; image?: string } | null;
  onInitialMessageConsumed?: () => void;
  todos?: Todo[];
  dividers?: Divider[];
  notes?: never[];
  interests?: string[];
  onAddTodo?: (text: string, dividerId: string, icon: string) => void;
  onDeleteTodo?: (id: string) => void;
  onRenameTodo?: (id: string, text: string) => void;
  onTransferTodo?: (id: string, dividerId: string) => void;
  onUpdateIcon?: (id: string, icon: string) => void;
  onUpdateDescription?: (id: string, description: string | null) => void;
  userId?: string;
  disabled?: boolean;
}

function parseActions(text: string): { cleanText: string; actions: ActionButton[] } {
  const actionRegex = /\[ACTION:(DELETE|SUGGEST|ADD_ALL|RENAME|TRANSFER|ICON|DESCRIBE)(?::([^:\]]*?))?(?::([^:\]]*?))?(?::([^:\]]*?))?(?::([^:\]]*?))?\]/g;
  const actions: ActionButton[] = [];
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    const type = match[1] as ActionButton["type"];
    if (type === "DELETE") {
      actions.push({ type, todoId: match[2], todoText: match[3] });
    } else if (type === "SUGGEST") {
      actions.push({ type, dividerName: match[2], todoText: match[3], iconName: match[4] });
    } else if (type === "RENAME") {
      actions.push({ type, todoId: match[2], newText: match[3], todoText: match[4] });
    } else if (type === "TRANSFER") {
      actions.push({ type, todoId: match[2], targetDividerId: match[3], todoText: match[4], sectionName: match[5] });
    } else if (type === "ICON") {
      actions.push({ type, todoId: match[2], iconName: match[3], todoText: match[4] });
    } else if (type === "DESCRIBE") {
      actions.push({ type, todoId: match[2], description: match[3], todoText: match[4] });
    } else if (type === "ADD_ALL") {
      actions.push({ type: "ADD_ALL" });
    }
  }

  const cleanText = text.replace(actionRegex, "").trim();
  return { cleanText, actions };
}

const FloatingAIChat = ({
  open, onOpenChange, initialMessage, onInitialMessageConsumed,
  todos = [], dividers = [], interests = [],
  onAddTodo, onDeleteTodo, onRenameTodo, onTransferTodo, onUpdateIcon, onUpdateDescription,
  userId,
  disabled = false,
}: FloatingAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialSent = useRef(false);
  const { used, remaining, limit, refresh: refreshUsage } = useAiUsage(userId);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  const sendToAI = useCallback(async (allMessages: Message[]) => {
    setIsLoading(true);
    try {
      // Build compact context
      let ctx = "";
      if (dividers.length || todos.length) {
        const todoLines = todos.map(t => {
          const sec = dividers.find(d => d.id === t.dividerId)?.name || "?";
          return `${t.id}|${t.text}|${sec}|${t.icon}${t.description ? `|${t.description}` : ""}`;
        });
        const divLines = dividers.map(d => `${d.id}|${d.name}|${d.icon}`);
        ctx += `\n[DATA]\nSections: ${divLines.join("; ")}\nTodos: ${todoLines.join("; ")}`;
      }
      if (interests.length) ctx += `\nInterests: ${interests.join(",")}`;
      if (ctx) ctx += "\n[/DATA]";

      const processedMessages = allMessages.map(m => {
        if (m.image && m.role === "user") {
          return {
            role: "user",
            content: [
              { type: "text", text: m.content || "" },
              { type: "image_url", image_url: { url: m.image } },
            ],
          };
        }
        return { role: m.role, content: m.content };
      });

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: processedMessages,
          context: {
            todos: todos.map(t => ({
              id: t.id,
              text: t.text,
              description: t.description || null,
              dividerName: dividers.find(d => d.id === t.dividerId)?.name || "?",
              icon: t.icon,
            })),
            dividers: dividers.map(d => ({ id: d.id, name: d.name, icon: d.icon })),
            interests,
          },
        },
      });

      if (error) {
        const msg = (error as any)?.context?.body?.error || (error as any)?.message || "AI service error";
        if (String(msg).toLowerCase().includes("hourly")) {
          toast.error("Hourly AI limit reached. Try again next hour.");
        }
        throw new Error(msg);
      }

      const reply = data?.reply || "Sorry, something went wrong.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      refreshUsage();
    } catch (e) {
      console.error("Chat error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [todos, dividers, interests, refreshUsage]);

  useEffect(() => {
    if (open && initialMessage && !initialSent.current && !disabled) {
      initialSent.current = true;
      const userMsg: Message = { role: "user", content: initialMessage.text, image: initialMessage.image };
      setMessages(prev => [...prev, userMsg]);
      sendToAI([...messages, userMsg]);
      onInitialMessageConsumed?.();
    }
  }, [open, initialMessage, disabled]);

  useEffect(() => {
    if (!open) initialSent.current = false;
  }, [open]);

  useEffect(() => {
    return voiceBus.subscribe((text) => {
      if (!open) onOpenChange(true);
      setInput((prev) => (prev ? prev + " " + text : text));
    });
  }, [open, onOpenChange]);


  const sendMessage = async () => {
    if (disabled) {
      toast.error("This feature is only available for registered users.");
      return;
    }
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
    await sendToAI(newMessages);
  };

  const handleFileSelect = async (file: File) => {
    if (disabled) {
      toast.error("This feature is only available for registered users.");
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => setAttachedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [disabled]);

  const markDone = (key: string) => {
    setCompletedActions(prev => new Set(prev).add(key));
  };

  const handleAction = (action: ActionButton, allActions?: ActionButton[]) => {
    if (disabled) {
      toast.error("This feature is only available for registered users.");
      return;
    }
    const key = `${action.type}:${action.todoId || action.todoText || "all"}`;
    if (completedActions.has(key)) return;

    if (action.type === "DELETE" && action.todoId && onDeleteTodo) {
      onDeleteTodo(action.todoId);
      markDone(key);
    } else if (action.type === "RENAME" && action.todoId && action.newText && onRenameTodo) {
      onRenameTodo(action.todoId, action.newText);
      markDone(key);
    } else if (action.type === "TRANSFER" && action.todoId && action.targetDividerId && onTransferTodo) {
      onTransferTodo(action.todoId, action.targetDividerId);
      markDone(key);
    } else if (action.type === "ICON" && action.todoId && action.iconName && onUpdateIcon) {
      onUpdateIcon(action.todoId, action.iconName);
      markDone(key);
    } else if (action.type === "DESCRIBE" && action.todoId && action.description && onUpdateDescription) {
      onUpdateDescription(action.todoId, action.description);
      markDone(key);
    } else if (action.type === "SUGGEST" && action.todoText && onAddTodo) {
      const divider = dividers.find(d => d.name.toLowerCase().includes((action.dividerName || "").toLowerCase()));
      if (divider) {
        onAddTodo(action.todoText, divider.id, action.iconName || "Star");
        markDone(key);
      }
    } else if (action.type === "ADD_ALL" && allActions && onAddTodo) {
      allActions.filter(a => a.type === "SUGGEST").forEach(s => {
        const sKey = `SUGGEST:${s.todoText}`;
        if (!completedActions.has(sKey) && s.todoText) {
          const divider = dividers.find(d => d.name.toLowerCase().includes((s.dividerName || "").toLowerCase()));
          if (divider) onAddTodo(s.todoText, divider.id, s.iconName || "Star");
          markDone(sKey);
        }
      });
      markDone("ADD_ALL");
    }
  };

  const renderActionButton = (action: ActionButton, index: number, allActions: ActionButton[]) => {
    const key = `${action.type}:${action.todoId || action.todoText || "all"}`;
    const done = completedActions.has(key) || (action.type === "ADD_ALL" && completedActions.has("ADD_ALL"));

    const btnBase = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all mt-1";
    const doneStyle = "bg-muted text-muted-foreground";

    if (action.type === "DELETE") {
      return (
        <button key={index} onClick={() => handleAction(action)} disabled={done || disabled}
          className={`${btnBase} ${done ? doneStyle : disabled ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-destructive/15 text-destructive hover:bg-destructive/25"}`}>
          {done ? <Check className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
          {done ? "Deleted" : `Delete "${action.todoText}"`}
        </button>
      );
    }
    if (action.type === "RENAME") {
      return (
        <button key={index} onClick={() => handleAction(action)} disabled={done || disabled}
          className={`${btnBase} ${done ? doneStyle : disabled ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-accent/50 text-accent-foreground hover:bg-accent/70"}`}>
          {done ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
          {done ? "Renamed" : `Rename to "${action.newText}"`}
        </button>
      );
    }
    if (action.type === "TRANSFER") {
      return (
        <button key={index} onClick={() => handleAction(action)} disabled={done || disabled}
          className={`${btnBase} ${done ? doneStyle : disabled ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-accent/50 text-accent-foreground hover:bg-accent/70"}`}>
          {done ? <Check className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
          {done ? "Moved" : `Move "${action.todoText}" → ${action.sectionName}`}
        </button>
      );
    }
    if (action.type === "ICON") {
      return (
        <button key={index} onClick={() => handleAction(action)} disabled={done || disabled}
          className={`${btnBase} ${done ? doneStyle : disabled ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-accent/50 text-accent-foreground hover:bg-accent/70"}`}>
          {done ? <Check className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
          {done ? "Icon changed" : `Change icon to ${action.iconName}`}
        </button>
      );
    }
    if (action.type === "DESCRIBE") {
      return (
        <button key={index} onClick={() => handleAction(action)} disabled={done || disabled}
          className={`${btnBase} ${done ? doneStyle : disabled ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-accent/50 text-accent-foreground hover:bg-accent/70"}`}>
          {done ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
          {done ? "Description added" : `Add desc to "${action.todoText}"`}
        </button>
      );
    }
    if (action.type === "SUGGEST") {
      return (
        <button key={index} onClick={() => handleAction(action)} disabled={done || disabled}
          className={`${btnBase} ${done ? doneStyle : disabled ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary/15 text-primary hover:bg-primary/25"}`}>
          {done ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {done ? "Added" : `Add "${action.todoText}"`}
        </button>
      );
    }
    if (action.type === "ADD_ALL") {
      const suggestions = allActions.filter(a => a.type === "SUGGEST");
      const allDone = suggestions.every(s => completedActions.has(`SUGGEST:${s.todoText}`));
      return (
        <button key={index} onClick={() => handleAction(action, allActions)} disabled={allDone || disabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all mt-2 ${
            allDone ? doneStyle : disabled ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}>
          {allDone ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {allDone ? "All Added" : "Add All"}
        </button>
      );
    }
    return null;
  };

  const renderMessage = (msg: Message, i: number) => {
    const isUser = msg.role === "user";
    const { cleanText, actions } = msg.role === "assistant" ? parseActions(msg.content) : { cleanText: msg.content, actions: [] };

    return (
      <div key={i} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
         {!isUser && (
          <img src={critiqsLogo} alt="CRITIQS AI" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-1" />
        
        )}
        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
        }`}>
          {msg.image && <img src={msg.image} alt="Attached" className="w-32 h-32 object-cover rounded-lg mb-2" />}
          {isUser ? (
            <p>{cleanText}</p>
          ) : (
            <>
              {cleanText && (
                <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1">
                  <ReactMarkdown>{cleanText}</ReactMarkdown>
                </div>
              )}
              {actions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {actions.map((action, idx) => renderActionButton(action, idx, actions))}
                </div>
              )}
            </>
          )}
        </div>
        {isUser && (
          <div className="w-6 h-6 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center mt-1">
            <User className="w-3 h-3 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => onOpenChange(true)}
          aria-label="Open AI chat"
          className="glass-pill glass-pill-primary fixed bottom-6 right-6 z-50 w-14 h-14 !p-0 rounded-full hover:scale-110 transition-transform"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="glass-panel glass-border-glow fixed bottom-6 right-6 z-50 w-[440px] sm:w-[480px] lg:w-[540px] h-[640px] max-h-[85vh] max-w-[calc(100vw-2rem)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <img src={critiqsLogo} alt="CRITIQS AI" className="w-8 h-8 rounded-full object-cover" />
              <div>
                <p className="text-sm font-semibold text-foreground">CRITIQS AI</p>
                <p className="text-[10px] text-muted-foreground">{disabled ? "Sign up to unlock" : "Always here to help"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!disabled && userId && (
                <span
                  title={`${used.toLocaleString()} / ${limit.toLocaleString()} chars used this hour`}
                  className={`text-[10px] font-medium px-2 py-1 rounded-full border transition-colors ${
                    remaining <= 0
                      ? "bg-destructive/15 text-destructive border-destructive/30 animate-pulse"
                      : remaining < 2000
                      ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}
                >
                  {Math.max(0, remaining).toLocaleString()} left
                </span>
              )}
              <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
            {disabled && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 bg-secondary/20 rounded-lg p-4">
                <img src={critiqsLogo} alt="CRITIQS AI" className="w-10 h-10 rounded-full object-cover opacity-60" />
                <p className="text-sm font-medium text-foreground">Sign up to unlock AI Chat</p>
                <p className="text-xs text-muted-foreground">Create an account to get personalized AI suggestions for your habits and todos.</p>
              </div>
            )}
            {dragOver && !disabled && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center z-10">
                <p className="text-primary font-medium">Drop image here</p>
              </div>
            )}
            {messages.length === 0 && !disabled && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <img src={critiqsLogo} alt="CRITIQS AI" className="w-10 h-10 rounded-full object-cover opacity-60" />
                <p className="text-sm text-muted-foreground opacity-60">Hey! Ask me anything about fitness, nutrition, or manage your habits 💪</p>
                <div className="flex flex-col gap-2 w-full mt-2">
                  {[
                    { label: "✨ Suggest me 3 tasks", msg: "Suggest me 3 tasks please" },
                    { label: "🗑️ Remove my first todo", msg: "Remove my first todo" },
                    { label: "⚡ Get tasks done faster", msg: "How can I get my tasks done faster" },
                  ].map((q) => (
                    <button
                      key={q.msg}
                      onClick={() => {
                        if (disabled) { toast.error("This feature is only available for registered users."); return; }
                        const userMsg: Message = { role: "user", content: q.msg };
                        const newMessages = [...messages, userMsg];
                        setMessages(newMessages);
                        setInput("");
                        scrollToBottom();
                        sendToAI(newMessages);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/50 hover:border-primary/30 text-sm text-foreground transition-all"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => renderMessage(msg, i))}
            {isLoading && (
              <div className="flex gap-2">
                <img src={critiqsLogo} alt="CRITIQS AI" className="w-6 h-6 rounded-full object-cover" />
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {attachedImage && !disabled && (
            <div className="px-4 pb-1 flex items-center gap-2">
              <img src={attachedImage} alt="Attached" className="w-10 h-10 object-cover rounded-lg border border-border" />
              <button onClick={() => setAttachedImage(null)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center py-1 border-t border-border/50">AI can make mistakes. Please double check.</p>

          <div className="px-3 py-3 border-t border-border flex items-center gap-2">
            <button onClick={() => !disabled && fileInputRef.current?.click()} disabled={disabled} className="text-muted-foreground hover:text-primary transition-colors p-1 disabled:opacity-50">
              <Plus className="w-5 h-5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
            <textarea value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 140) + "px";
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={disabled ? "Sign up to chat..." : "Ask Anything…"}
              rows={1}
              className="flex-1 bg-secondary/50 border-none rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
              disabled={isLoading || disabled} />
            <button onClick={sendMessage} disabled={isLoading || (!input.trim() && !attachedImage) || disabled}
              className="text-primary hover:text-primary/80 transition-colors p-1 disabled:opacity-30">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;
