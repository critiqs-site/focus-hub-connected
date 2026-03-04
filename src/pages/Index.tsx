import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, CheckCircle2, Circle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import TodoItem from "@/components/TodoItem";
import TodoDivider from "@/components/TodoDivider";
import ComingSoon from "@/components/ComingSoon";
import AddTodoDialog from "@/components/AddTodoDialog";
import AddDividerDialog from "@/components/AddDividerDialog";
import NotesSection from "@/components/NotesSection";
import OnboardingDialog from "@/components/OnboardingDialog";
import UserProfileMenu from "@/components/UserProfileMenu";
import AnalyticsView from "@/components/AnalyticsView";
import ToolsView from "@/components/ToolsView";
import FloatingAIChat from "@/components/FloatingAIChat";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTodos } from "@/hooks/useTodos";
import { useNotes } from "@/hooks/useNotes";
import { format } from "date-fns";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const isGuest = !user && localStorage.getItem("guestMode") === "true";
  const { profile, needsOnboarding, completeOnboarding } = useProfile(user?.id);
  const [activeTab, setActiveTab] = useState("todos");
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showAddDivider, setShowAddDivider] = useState(false);
  const [selectedDividerId, setSelectedDividerId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<{ text: string; image?: string } | null>(null);

  const {
    todos, dividers, loading: todosLoading,
    handleToggleDay, handleEdit, handleDelete,
    handleUpdateIcon, handleTransferTodo,
    handleAddTodo, handleAddDivider, handleDeleteDivider,
    refetch: refetchTodos,
  } = useTodos(user?.id);

  const {
    notes, loading: notesLoading,
    handleAddNote, handleEditNote, handleDeleteNote,
  } = useNotes(user?.id);

  useEffect(() => {
    if (!authLoading && !user && !isGuest) navigate("/auth");
  }, [user, authLoading, navigate, isGuest]);

  const handleSignOut = async () => {
    localStorage.removeItem("guestMode");
    await signOut();
    navigate("/auth");
  };

  const handleAskAI = (image: string, message: string) => {
    setChatInitialMessage({ text: message, image });
    setChatOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isGuest) return null;

  const isLoading = todosLoading || notesLoading;
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Split todos into Remaining and Done for today
  const remainingTodos = todos.filter(t => !t.completions.includes(todayStr));
  const doneTodos = todos.filter(t => t.completions.includes(todayStr));

  const renderTodoSection = (sectionTodos: typeof todos, sectionDividers: typeof dividers) => {
    return sectionDividers.map((divider, index) => {
      const dividerTodos = sectionTodos.filter((t) => t.dividerId === divider.id);
      if (dividerTodos.length === 0) return null;
      return (
        <div key={divider.id} style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
          <TodoDivider divider={divider} onDelete={handleDeleteDivider} onAddTodo={(dividerId) => { setSelectedDividerId(dividerId); setShowAddTodo(true); }} />
          <div className="space-y-3">
            {dividerTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggleDay={handleToggleDay} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {!isGuest && (
        <OnboardingDialog
          open={needsOnboarding}
          userId={user!.id}
          onComplete={() => { completeOnboarding(); refetchTodos(); }}
        />
      )}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Header activeTab={activeTab} onTabChange={setActiveTab} />
          {isGuest && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">Guest</span>
              <button onClick={handleSignOut} className="text-xs text-primary hover:underline">Sign in</button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : activeTab === "todos" ? (
          <>
            {isGuest && (
              <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-sm text-muted-foreground text-center">
                Guest mode — data is saved locally only. <button onClick={() => navigate("/auth")} className="text-primary font-medium hover:underline">Sign up to sync</button>
              </div>
            )}

            {/* Remaining Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Circle className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Remaining</h2>
                <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                  {remainingTodos.length}
                </span>
              </div>
              <div className="space-y-4">
                {remainingTodos.length > 0 ? (
                  renderTodoSection(remainingTodos, dividers)
                ) : todos.length > 0 ? (
                  <p className="text-muted-foreground text-sm italic pl-8 mb-4">All done for today! 🎉</p>
                ) : null}
              </div>
            </div>

            {/* Done Section */}
            {doneTodos.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Done</h2>
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {doneTodos.length}
                  </span>
                </div>
                <div className="space-y-4 opacity-80">
                  {renderTodoSection(doneTodos, dividers)}
                </div>
              </div>
            )}

            {/* Divider management (always visible) */}
            <div className="space-y-4">
              {dividers.map((divider) => {
                const dividerTodos = todos.filter((t) => t.dividerId === divider.id);
                if (dividerTodos.length > 0) return null; // Already rendered above
                return (
                  <div key={divider.id}>
                    <TodoDivider divider={divider} onDelete={handleDeleteDivider} onAddTodo={(dividerId) => { setSelectedDividerId(dividerId); setShowAddTodo(true); }} />
                    <p className="text-muted-foreground text-sm italic pl-8 mb-4">No habits yet</p>
                  </div>
                );
              })}
              <button onClick={() => setShowAddDivider(true)} className="w-full glass-card border-dashed border-2 border-primary/30 hover:border-primary/60 p-4 flex items-center justify-center gap-2 transition-all duration-300 hover:bg-primary/5 cursor-pointer group mt-6">
                <Plus className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Add Section</span>
              </button>
            </div>
            <AddTodoDialog open={showAddTodo} onOpenChange={(open) => { setShowAddTodo(open); if (!open) setSelectedDividerId(null); }} onAdd={handleAddTodo} dividers={dividers} preselectedDividerId={selectedDividerId} />
            <AddDividerDialog open={showAddDivider} onOpenChange={setShowAddDivider} onAdd={handleAddDivider} />
          </>
        ) : activeTab === "analytics" ? (
          <AnalyticsView todos={todos} dividers={dividers} />
        ) : activeTab === "notes" ? (
          <NotesSection notes={notes} onAddNote={handleAddNote} onEditNote={handleEditNote} onDeleteNote={handleDeleteNote} />
        ) : activeTab === "tools" ? (
          <ToolsView onAskAI={handleAskAI} />
        ) : (
          <ComingSoon section={activeTab} />
        )}
      </div>

      {/* Profile menu - fixed bottom-left */}
      {!isGuest && (
        <UserProfileMenu email={user!.email || ""} name={profile?.name || undefined} onSignOut={handleSignOut} />
      )}

      <FloatingAIChat
        open={chatOpen}
        onOpenChange={setChatOpen}
        initialMessage={chatInitialMessage}
        onInitialMessageConsumed={() => setChatInitialMessage(null)}
        todos={todos}
        dividers={dividers}
        notes={notes}
        interests={profile?.interests || []}
        onAddTodo={handleAddTodo}
        onDeleteTodo={handleDelete}
        onRenameTodo={handleEdit}
        onTransferTodo={handleTransferTodo}
        onUpdateIcon={handleUpdateIcon}
      />
    </div>
  );
};

export default Index;
