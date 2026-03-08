import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Plus, Loader2, Bot, User, Check, Trash2, Pencil, ArrowRight, ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Todo, Divider } from "@/types/todo";
import { supabase } from "@/integrations/supabase/client";

import { TODO_ICON_NAMES, DIVIDER_ICON_NAMES } from "@/lib/icons";

const SYSTEM_PROMPT = `You are CritiQs AI — a chill, smart fitness & wellness buddy.

RULES:
- Read the FULL conversation history before replying. Respond to what the user ACTUALLY said.
- Only give a greeting on the VERY FIRST message (when there's no prior conversation). After that, respond naturally to the user's message.
- Keep replies short: 2-4 sentences for chat, max 8 bullets for advice. 1-2 emojis.
- If user asks "who are you" or similar, introduce yourself as CritiQs AI, their habit & wellness buddy.

TODO ACTIONS (use only when relevant):
[ACTION:DELETE:todoId:todoText] [ACTION:RENAME:todoId:newText:oldText] [ACTION:TRANSFER:todoId:targetDividerId:todoText:sectionName] [ACTION:ICON:todoId:newIconName:todoText] [ACTION:DESCRIBE:todoId:description:todoText] [ACTION:SUGGEST:dividerName:todoText:iconName] [ACTION:ADD_ALL]

TASK ICONS (use these for todos/habits): ${TODO_ICON_NAMES.join(",")}
SECTION ICONS (use these for dividers/sections): ${DIVIDER_ICON_NAMES.join(",")}

- For [ACTION:ICON], ONLY use icons from TASK ICONS list above.
- For section-related operations, reference SECTION ICONS.
- When user says "replace X with a better icon" or "change icon for X", use [ACTION:ICON:todoId:newIconName:todoText].
- When user says "move X to Y section", use [ACTION:TRANSFER:todoId:targetDividerId:todoText:sectionName].
- When user says "add description to X" or "describe X", use [ACTION:DESCRIBE:todoId:short description:todoText]. Descriptions should be brief (5-15 words), practical, like "30 min at mid-day" or "Before breakfast, 10 reps".

TASK INSPIRATION (real human habits for suggestions):
- Go Outside at Mid-day, Watch Self Improvement Videos, Do One Skill (Content/Editing/Coding)
- Use Less Screen Time, Drink 2L Water, Read 10 Pages, Walk 10K Steps
- No Sugar Today, Journal for 5 Min, Cold Shower, Stretch 10 Min
- Practice Gratitude, Cook a Healthy Meal, Sleep Before 11 PM, No Social Media
- Learn Something New, Call a Friend, Clean Room, Meditate 10 Min

- Use EXACT IDs from context. Match names loosely. Text first, actions on new lines at end.`;

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
  notes?: any[];
  interests?: string[];
  onAddTodo?: (text: string, dividerId: string, icon: string) => void;
  onDeleteTodo?: (id: string) => void;
  onRenameTodo?: (id: string, text: string) => void;
  onTransferTodo?: (id: string, dividerId: string) => void;
  onUpdateIcon?: (id: string, icon: string) => void;
  onUpdateDescription?: (id: string, description: string | null) => void;
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
    } else if (type === "ADD_ALL") {
      actions.push({ type: "ADD_ALL" });
    }
  }

  const cleanText = text.replace(actionRegex, "").trim();
  return { cleanText, actions };
}

const FloatingAIChat = ({
  open, onOpenChange, initialMessage, onInitialMessageConsumed,
  todos = [], dividers = [], notes = [], interests = [],
  onAddTodo, onDeleteTodo, onRenameTodo, onTransferTodo, onUpdateIcon,
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
          return `${t.id}|${t.text}|${sec}|${t.icon}`;
        });
        const divLines = dividers.map(d => `${d.id}|${d.name}|${d.icon}`);
        ctx += `\n[DATA]\nSections: ${divLines.join("; ")}\nTodos: ${todoLines.join("; ")}`;
      }
      if (interests.length) ctx += `\nInterests: ${interests.join(",")}`;
      if (notes.length) {
        ctx += `\nMoods: ${notes.slice(0, 3).map((n: any) => `${n.mood}`).join(",")}`;
      }
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
              dividerName: dividers.find(d => d.id === t.dividerId)?.name || "?",
              icon: t.icon,
            })),
            dividers: dividers.map(d => ({ id: d.id, name: d.name, icon: d.icon })),
            interests,
            notes: notes.slice(0, 5),
          },
        },
      });

      if (error) throw new Error("AI service error");

      const reply = data?.reply || "Sorry, something went wrong.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error("Chat error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [todos, dividers, notes, interests]);

  useEffect(() => {
    if (open && initialMessage && !initialSent.current) {
      initialSent.current = true;
      const userMsg: Message = { role: "user", content: initialMessage.text, image: initialMessage.image };
      setMessages(prev => [...prev, userMsg]);
      sendToAI([...messages, userMsg]);
      onInitialMessageConsumed?.();
    }
  }, [open, initialMessage]);

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
    await sendToAI(newMessages);
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
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

  const markDone = (key: string) => {
    setCompletedActions(prev => new Set(prev).add(key));
  };

  const handleAction = (action: ActionButton, allActions?: ActionButton[]) => {
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
        <button key={index} onClick={() => handleAction(action)} disabled={done}
          className={`${btnBase} ${done ? doneStyle : "bg-destructive/15 text-destructive hover:bg-destructive/25"}`}>
          {done ? <Check className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
          {done ? "Deleted" : `Delete "${action.todoText}"`}
        </button>
      );
    }
    if (action.type === "RENAME") {
      return (
        <button key={index} onClick={() => handleAction(action)} disabled={done}
          className={`${btnBase} ${done ? doneStyle : "bg-accent/50 text-accent-foreground hover:bg-accent/70"}`}>
          {done ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
          {done ? "Renamed" : `Rename to "${action.newText}"`}
        </button>
      );
    }
    if (action.type === "TRANSFER") {
      return (
        <button key={index} onClick={() => handleAction(action)} disabled={done}
          className={`${btnBase} ${done ? doneStyle : "bg-accent/50 text-accent-foreground hover:bg-accent/70"}`}>
          {done ? <Check className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
          {done ? "Moved" : `Move "${action.todoText}" → ${action.sectionName}`}
        </button>
      );
    }
    if (action.type === "ICON") {
      return (
        <button key={index} onClick={() => handleAction(action)} disabled={done}
          className={`${btnBase} ${done ? doneStyle : "bg-accent/50 text-accent-foreground hover:bg-accent/70"}`}>
          {done ? <Check className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
          {done ? "Icon changed" : `Change icon to ${action.iconName}`}
        </button>
      );
    }
    if (action.type === "SUGGEST") {
      return (
        <button key={index} onClick={() => handleAction(action)} disabled={done}
          className={`${btnBase} ${done ? doneStyle : "bg-primary/15 text-primary hover:bg-primary/25"}`}>
          {done ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {done ? "Added" : `Add "${action.todoText}"`}
        </button>
      );
    }
    if (action.type === "ADD_ALL") {
      const suggestions = allActions.filter(a => a.type === "SUGGEST");
      const allDone = suggestions.every(s => completedActions.has(`SUGGEST:${s.todoText}`));
      return (
        <button key={index} onClick={() => handleAction(action, allActions)} disabled={allDone}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all mt-2 ${
            allDone ? doneStyle : "bg-primary text-primary-foreground hover:bg-primary/90"
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
          <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1">
            <Bot className="w-3 h-3 text-primary" />
          </div>
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
                <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1">
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
        <button onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform duration-200">
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] max-h-[80vh] max-w-[calc(100vw-2rem)] flex flex-col bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 animate-scale-in overflow-hidden">
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

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
            {dragOver && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center z-10">
                <p className="text-primary font-medium">Drop image here</p>
              </div>
            )}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <Bot className="w-10 h-10 text-primary opacity-60" />
                <p className="text-sm text-muted-foreground opacity-60">Hey! Ask me anything about fitness, nutrition, or manage your habits 💪</p>
                <div className="flex flex-col gap-2 w-full mt-2">
                  {[
                    { label: "✨ Suggest me 3 tasks", msg: "Suggest me 3 tasks please" },
                    { label: "🗑️ Remove my first todo", msg: "Remove my first todo" },
                    { label: "⚡ Get tasks done faster", msg: "How can I get my tasks done faster" },
                  ].map((q) => (
                    <button
                      key={q.msg}
                      onClick={() => { setInput(q.msg); setTimeout(() => { const userMsg: Message = { role: "user", content: q.msg }; const newMessages = [...messages, userMsg]; setMessages(newMessages); setInput(""); sendToAI(newMessages); scrollToBottom(); }, 0); }}
                      className="w-full text-left px-3 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/50 hover:border-primary/30 text-sm text-foreground transition-all duration-200"
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
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {attachedImage && (
            <div className="px-4 pb-1 flex items-center gap-2">
              <img src={attachedImage} alt="Attached" className="w-10 h-10 object-cover rounded-lg border border-border" />
              <button onClick={() => setAttachedImage(null)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="px-3 py-3 border-t border-border flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-primary transition-colors p-1">
              <Plus className="w-5 h-5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask anything..."
              className="flex-1 bg-secondary/50 border-none rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              disabled={isLoading} />
            <button onClick={sendMessage} disabled={isLoading || (!input.trim() && !attachedImage)}
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
