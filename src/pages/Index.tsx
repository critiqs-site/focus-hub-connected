import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle2, Circle, Moon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Header from "@/components/Header";
import TodoItem from "@/components/TodoItem";
import TodoDivider from "@/components/TodoDivider";
import ComingSoon from "@/components/ComingSoon";
import AddTodoDialog from "@/components/AddTodoDialog";
import AddDividerDialog from "@/components/AddDividerDialog";
import EventsView from "@/components/EventsView";
import OnboardingDialog from "@/components/OnboardingDialog";
import UserProfileMenu from "@/components/UserProfileMenu";
import AnalyticsView from "@/components/AnalyticsView";
import ToolsView from "@/components/ToolsView";
import FloatingAIChat from "@/components/FloatingAIChat";
import CompletionBanner from "@/components/CompletionBanner";
import PremadeTodoChooser from "@/components/PremadeTodoChooser";
import JournalView from "@/components/JournalView";
import DailyReminders from "@/components/DailyReminders";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTodos } from "@/hooks/useTodos";
import { useEvents } from "@/hooks/useEvents";
import { useTheme } from "@/hooks/useTheme";
import { format } from "date-fns";
import { getFixedWeekDays, getSuggestedDays } from "@/lib/utils";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import logoIcon from "@/assets/logo-icon.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const isGuest = !user && localStorage.getItem("guestMode") === "true";
  const { profile, needsOnboarding, completeOnboarding } = useProfile(user?.id);
  const { themeId, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("todos");
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showAddDivider, setShowAddDivider] = useState(false);
  const [selectedDividerId, setSelectedDividerId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<{ text: string; image?: string } | null>(null);
  const [showChooser, setShowChooser] = useState(false);
  const [showFewer, setShowFewer] = useState(false);
  const [visibleCount, setVisibleCount] = useState(Infinity);

  const {
    todos, dividers, loading: todosLoading,
    handleToggleDay, handleEdit, handleDelete,
    handleUpdateIcon, handleUpdateDescription, handleTransferTodo,
    handleAddTodo, handleAddDivider, handleDeleteDivider, handleTogglePin,
    handleReorderTodos,
    refetch: refetchTodos,
  } = useTodos(user?.id);

  const { events, loading: eventsLoading, addEvent, addMultipleEvents, editEvent, deleteEvent, toggleComplete } = useEvents(user?.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Auto-guest mode for new visitors
  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      localStorage.setItem("guestMode", "true");
      const hasSeenChooser = localStorage.getItem("hasSeenChooser");
      if (!hasSeenChooser) {
        setShowChooser(true);
      }
      window.location.reload();
    }
  }, [user, authLoading, isGuest]);

  const handleChooserComplete = (name: string, habits: { text: string; icon: string }[]) => {
    localStorage.setItem("hasSeenChooser", "true");
    if (name) localStorage.setItem("guestName", name);
    setShowChooser(false);

    if (habits.length === 0) return;

    // Create a "My Habits" divider then add selected todos
    handleAddDivider("My Habits", "Star").then(() => {
      setTimeout(() => {
        const guestDividers = JSON.parse(localStorage.getItem("guest_dividers") || "[]");
        const divider = guestDividers.find((d: any) => d.name === "My Habits");
        if (divider) {
          habits.forEach(habit => {
            handleAddTodo(habit.text, divider.id, habit.icon);
          });
        }
      }, 100);
    });
  };

  const handleSignOut = async () => {
    localStorage.removeItem("guestMode");
    localStorage.removeItem("hasSeenChooser");
    localStorage.removeItem("guestName");
    await signOut();
    navigate("/auth");
  };

  const handleAskAI = (image: string, message: string) => {
    setChatInitialMessage({ text: message, image });
    setChatOpen(true);
  };

  // Unified loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="spin-ring">
            <img src={logoIcon} alt="CRITIQS" className="w-14 h-14 object-contain relative z-10" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading your habits...</p>
      </div>
    );
  }

  if (!user && !isGuest) return null;

  // Show premade chooser for first-time guests
  if (showChooser && isGuest) {
    return <PremadeTodoChooser onComplete={handleChooserComplete} />;
  }

  const isLoading = todosLoading || eventsLoading;
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Determine today's index within the fixed week for goal-based auto-skip
  const todayDayIndex = useMemo(() => {
    const today = new Date();
    const fixedDays = getFixedWeekDays(today);
    return fixedDays.findIndex(d => format(d, "yyyy-MM-dd") === todayStr);
  }, [todayStr]);

  // Separate todos into remaining, done, and rest-day
  const { remainingTodos, doneTodos, restDayTodos } = useMemo(() => {
    const remaining: typeof todos = [];
    const done: typeof todos = [];
    const restDay: typeof todos = [];

    for (const t of todos) {
      const isCompletedToday = t.completions.includes(todayStr);
      if (isCompletedToday) {
        done.push(t);
      } else if (t.goalDaysPerWeek < 7 && todayDayIndex >= 0) {
        const suggested = getSuggestedDays(t.goalDaysPerWeek);
        if (!suggested.includes(todayDayIndex)) {
          restDay.push(t);
        } else {
          remaining.push(t);
        }
      } else {
        remaining.push(t);
      }
    }

    const sortFn = (a: typeof todos[0], b: typeof todos[0]) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    };

    return {
      remainingTodos: remaining.sort(sortFn),
      doneTodos: done.sort(sortFn),
      restDayTodos: restDay.sort(sortFn),
    };
  }, [todos, todayStr, todayDayIndex]);

  const handleDragEnd = (event: DragEndEvent, sectionTodos: typeof todos) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sectionTodos.findIndex((t) => t.id === active.id);
    const newIndex = sectionTodos.findIndex((t) => t.id === over.id);
    const reordered = [...sectionTodos];
    const [movedItem] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedItem);
    handleReorderTodos(reordered.map(t => t.id));
  };

  const renderTodoSection = (sectionTodos: typeof todos, sectionDividers: typeof dividers) => {
    return sectionDividers.map((divider, index) => {
      const dividerTodos = sectionTodos.filter((t) => t.dividerId === divider.id).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return a.order - b.order;
      });
      if (dividerTodos.length === 0) return null;
      const pinnedCount = dividerTodos.filter((t) => t.pinned).length;
      return (
        <div key={divider.id} style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
          <TodoDivider divider={divider} onDelete={handleDeleteDivider} onAddTodo={(dividerId) => { setSelectedDividerId(dividerId); setShowAddTodo(true); }} />
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, dividerTodos)}>
            <SortableContext items={dividerTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {dividerTodos.map((todo, todoIdx) => (
                  <div key={todo.id} className="animate-todo-in" style={{ animationDelay: `${todoIdx * 80}ms` }}>
                    <TodoItem todo={todo} onToggleDay={handleToggleDay} onEdit={handleEdit} onDelete={handleDelete} onTogglePin={handleTogglePin} pinnedCount={pinnedCount} />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {!isGuest && (
        <OnboardingDialog open={needsOnboarding} userId={user!.id} onComplete={() => { completeOnboarding(); refetchTodos(); }} />
      )}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-orb top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/10" />
        <div className="ambient-orb bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/6" />
        <div className="ambient-orb top-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/20" />
      </div>

      <Navbar />

      <div className="relative z-10 max-w-6xl lg:max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
        <div className="flex items-center justify-between mb-4">
          <Header activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="spin-ring">
              <img src={logoIcon} alt="CRITIQS" className="w-12 h-12 object-contain relative z-10" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
          </div>
        ) : activeTab === "todos" ? (
          <>
            <CompletionBanner todos={todos} />
            {isGuest && (
              <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 text-sm text-muted-foreground text-center">
                Guest mode — data is saved locally only. <button onClick={() => navigate("/auth")} className="text-primary font-medium hover:underline">Sign up to sync</button>
              </div>
            )}
            <DailyReminders />
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Circle className="h-5 w-5 lg:h-6 lg:w-6 text-muted-foreground" />
                <h2 className="text-lg lg:text-xl font-semibold text-foreground">Remaining</h2>
                <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{remainingTodos.length}</span>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => { setShowFewer(false); setVisibleCount(Infinity); }}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${!showFewer ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setShowFewer(true); setVisibleCount(3); }}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${showFewer ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Show Fewer
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {remainingTodos.length > 0 ? (
                  <>
                    {renderTodoSection(showFewer ? remainingTodos.slice(0, visibleCount) : remainingTodos, dividers)}
                    {showFewer && visibleCount < remainingTodos.length && (
                      <button
                        onClick={() => setVisibleCount(prev => prev + 3)}
                        className="w-full py-2.5 rounded-xl text-sm text-primary hover:bg-primary/10 transition-all border border-primary/20 hover:border-primary/40"
                      >
                        Show more ({remainingTodos.length - visibleCount} remaining)
                      </button>
                    )}
                  </>
                ) : todos.length > 0 ? (
                  <p className="text-muted-foreground text-sm italic pl-8 mb-4">All done for today! 🎉</p>
                ) : null}
              </div>
            </div>
            {doneTodos.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <CheckCircle2 className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                  <h2 className="text-lg lg:text-xl font-semibold text-foreground">Done</h2>
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{doneTodos.length}</span>
                </div>
                <div className="space-y-4 opacity-80">{renderTodoSection(doneTodos, dividers)}</div>
              </div>
            )}
            <div className="space-y-4">
              {dividers.map((divider) => {
                const dividerTodos = todos.filter((t) => t.dividerId === divider.id);
                if (dividerTodos.length > 0) return null;
                return (
                  <div key={divider.id}>
                    <TodoDivider divider={divider} onDelete={handleDeleteDivider} onAddTodo={(dividerId) => { setSelectedDividerId(dividerId); setShowAddTodo(true); }} />
                    <p className="text-muted-foreground text-sm italic pl-8 mb-4">No habits yet</p>
                  </div>
                );
              })}
              <button onClick={() => setShowAddDivider(true)} className="w-full border-dashed border-2 border-primary/30 hover:border-primary/60 p-4 flex items-center justify-center gap-2 transition-all duration-300 hover:bg-primary/5 cursor-pointer group mt-6 rounded-2xl glass-card">
                <Plus className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Add Section</span>
              </button>
            </div>
            <AddTodoDialog open={showAddTodo} onOpenChange={(open) => { setShowAddTodo(open); if (!open) setSelectedDividerId(null); }} onAdd={handleAddTodo} dividers={dividers} preselectedDividerId={selectedDividerId} />
            <AddDividerDialog open={showAddDivider} onOpenChange={setShowAddDivider} onAdd={handleAddDivider} />
          </>
        ) : activeTab === "analytics" ? (
          <AnalyticsView todos={todos} />
        ) : activeTab === "events" ? (
          <EventsView events={events} onAddEvent={addEvent} onAddMultipleEvents={addMultipleEvents} onEditEvent={editEvent} onDeleteEvent={deleteEvent} onToggleComplete={toggleComplete} />
        ) : activeTab === "journal" ? (
          <JournalView userId={user?.id} />
        ) : activeTab === "tools" ? (
          <ToolsView onAskAI={handleAskAI} isGuest={isGuest} />
        ) : (
          <ComingSoon section={activeTab} />
        )}
      </div>

      {isGuest ? (
        <UserProfileMenu email="" onSignOut={handleSignOut} isGuest themeId={themeId} onSetTheme={setTheme} />
      ) : (
        <UserProfileMenu email={user!.email || ""} name={profile?.name || undefined} onSignOut={handleSignOut} themeId={themeId} onSetTheme={setTheme} />
      )}

      {!isGuest && (
        <FloatingAIChat
          open={chatOpen}
          onOpenChange={setChatOpen}
          initialMessage={chatInitialMessage}
          onInitialMessageConsumed={() => setChatInitialMessage(null)}
          todos={todos}
          dividers={dividers}
          interests={profile?.interests || []}
          onAddTodo={handleAddTodo}
          onDeleteTodo={handleDelete}
          onRenameTodo={handleEdit}
          onTransferTodo={handleTransferTodo}
          onUpdateIcon={handleUpdateIcon}
          onUpdateDescription={handleUpdateDescription}
        />
      )}
    </div>
  );
};

export default Index;
