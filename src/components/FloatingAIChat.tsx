import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Plus, Loader2, Bot, User, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import type { Todo, Divider } from "@/types/todo";

type Message = { role: "user" | "assistant"; content: string; image?: string };

interface ActionButton {
  type: "DELETE" | "SUGGEST" | "ADD_ALL";
  todoId?: string;
  todoText?: string;
  dividerName?: string;
  iconName?: string;
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
}

function parseActions(text: string): { cleanText: string; actions: ActionButton[] } {
  const actionRegex = /\[ACTION:(DELETE|SUGGEST|ADD_ALL)(?::([^:\]]*?))?(?::([^:\]]*?))?(?::([^:\]]*?))?\]/g;
  const actions: ActionButton[] = [];
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    const type = match[1] as ActionButton["type"];
    if (type === "DELETE") {
      actions.push({ type, todoId: match[2], todoText: match[3] });
    } else if (type === "SUGGEST") {
      actions.push({ type, dividerName: match[2], todoText: match[3], iconName: match[4] });
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
  onAddTodo, onDeleteTodo,
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
      // Enrich todos with divider names for context
      const enrichedTodos = todos.map(t => ({
        id: t.id, text: t.text, icon: t.icon,
        dividerName: dividers.find(d => d.id === t.dividerId)?.name || "Unknown",
      }));

      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: allMessages.map(m => ({
            role: m.role, content: m.content,
            ...(m.image ? { image: m.image } : {}),
          })),
          context: { todos: enrichedTodos, dividers, notes, interests },
        },
      });

      if (error) throw error;

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

  // Handle initial message from physique rater
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

  const handleAction = (action: ActionButton, allSuggestions?: ActionButton[]) => {
    const key = `${action.type}:${action.todoId || action.todoText}`;
    if (completedActions.has(key)) return;

    if (action.type === "DELETE" && action.todoId && onDeleteTodo) {
      onDeleteTodo(action.todoId);
      setCompletedActions(prev => new Set(prev).add(key));
    } else if (action.type === "SUGGEST" && action.todoText && onAddTodo) {
      const divider = dividers.find(d => d.name.toLowerCase().includes((action.dividerName || "").toLowerCase()));
      if (divider) {
        onAddTodo(action.todoText, divider.id, action.iconName || "Star");
        setCompletedActions(prev => new Set(prev).add(key));
      }
    } else if (action.type === "ADD_ALL" && allSuggestions && onAddTodo) {
      allSuggestions.filter(a => a.type === "SUGGEST").forEach(s => {
        const sKey = `${s.type}:${s.todoText}`;
        if (!completedActions.has(sKey) && s.todoText) {
          const divider = dividers.find(d => d.name.toLowerCase().includes((s.dividerName || "").toLowerCase()));
          if (divider) onAddTodo(s.todoText, divider.id, s.iconName || "Star");
          setCompletedActions(prev => new Set(prev).add(sKey));
        }
      });
      setCompletedActions(prev => new Set(prev).add("ADD_ALL"));
    }
  };

  const renderActionButton = (action: ActionButton, index: number, allActions: ActionButton[]) => {
    const key = `${action.type}:${action.todoId || action.todoText}`;
    const done = completedActions.has(key) || (action.type === "ADD_ALL" && completedActions.has("ADD_ALL"));

    if (action.type === "DELETE") {
      return (
        <button
          key={index}
          onClick={() => handleAction(action)}
          disabled={done}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all mt-1 ${
            done ? "bg-muted text-muted-foreground" : "bg-destructive/15 text-destructive hover:bg-destructive/25"
          }`}
        >
          {done ? <Check className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
          {done ? "Deleted" : `Delete "${action.todoText}"`}
        </button>
      );
    }

    if (action.type === "SUGGEST") {
      return (
        <button
          key={index}
          onClick={() => handleAction(action)}
          disabled={done}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all mt-1 ${
            done ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary hover:bg-primary/25"
          }`}
        >
          {done ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {done ? "Added" : `Add "${action.todoText}"`}
        </button>
      );
    }

    if (action.type === "ADD_ALL") {
      const suggestions = allActions.filter(a => a.type === "SUGGEST");
      const allDone = suggestions.every(s => completedActions.has(`SUGGEST:${s.todoText}`));
      return (
        <button
          key={index}
          onClick={() => handleAction(action, allActions)}
          disabled={allDone}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all mt-2 ${
            allDone ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
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
        <button
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 transition-transform duration-200"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

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
            <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-primary transition-colors p-1">
              <Plus className="w-5 h-5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
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
