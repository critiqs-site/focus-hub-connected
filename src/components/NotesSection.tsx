import { useState } from "react";
import { format, isAfter, isSameDay, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import MoodSelector, { getMoodSuggestion } from "./MoodSelector";
import NoteEntry from "./NoteEntry";
import YearlyCalendar from "./YearlyCalendar";
import type { MoodNote, MoodType } from "@/types/todo";

interface NotesSectionProps {
  notes: MoodNote[];
  onAddNote: (date: string, mood: MoodType, note: string) => void;
  onEditNote: (id: string, mood: MoodType, note: string) => void;
  onDeleteNote: (id: string) => void;
}

const NotesSection = ({ notes, onAddNote, onEditNote, onDeleteNote }: NotesSectionProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [noteText, setNoteText] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = new Date();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const isFutureDate = isAfter(selectedDate, today) && !isSameDay(selectedDate, today);
  const isPastDate = !isSameDay(selectedDate, today) && !isFutureDate;
  const isToday = isSameDay(selectedDate, today);

  const existingNote = notes.find(n => n.date === dateStr);

  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handlePrevDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
    setSelectedMood(null);
    setNoteText("");
  };

  const handleNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (!isAfter(nextDay, today) || isSameDay(nextDay, today)) {
      setSelectedDate(nextDay);
      setSelectedMood(null);
      setNoteText("");
    }
  };

  const handleSaveEntry = () => {
    if (!selectedMood || isFutureDate) return;

    onAddNote(dateStr, selectedMood, noteText);
    setSelectedMood(null);
    setNoteText("");
  };

  const canGoNext = !isAfter(addDays(selectedDate, 1), today) || isSameDay(addDays(selectedDate, 1), today);

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="glass-card p-4 animate-fade-in">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            className="h-9 w-9 rounded-full hover:bg-primary/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[200px] justify-center text-left font-medium",
                  "glass-card border-primary/30 hover:border-primary/50"
                )}
              >
                <Calendar className="mr-2 h-4 w-4 text-primary" />
                {format(selectedDate, 'EEEE, MMMM d')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 glass-card border-primary/20" align="center">
              <CalendarPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    setSelectedMood(null);
                    setNoteText("");
                  }
                  setCalendarOpen(false);
                }}
                disabled={(date) => isAfter(date, today) && !isSameDay(date, today)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            disabled={!canGoNext}
            className={cn(
              "h-9 w-9 rounded-full hover:bg-primary/20",
              !canGoNext && "opacity-40 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {isSameDay(selectedDate, today) && (
          <p className="text-center text-xs text-primary font-medium mt-2">Today</p>
        )}
      </div>

      {/* Mood Entry Form */}
      {isFutureDate ? (
        <div className="glass-card p-6 text-center animate-fade-in">
          <p className="text-muted-foreground">
            You cannot log mood for future dates
          </p>
        </div>
      ) : existingNote ? (
        <div className="glass-card p-6 animate-fade-in">
          <p className="text-sm text-muted-foreground text-center mb-4">
            {isToday ? "Today's entry" : "Entry for this day"}
          </p>
          <NoteEntry
            note={existingNote}
            onEdit={onEditNote}
            onDelete={onDeleteNote}
          />
        </div>
      ) : isPastDate ? (
        <div className="glass-card p-6 text-center animate-fade-in">
          <p className="text-muted-foreground">
            No entry for this day. You can only add notes for today.
          </p>
        </div>
      ) : (
        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <h3 className="text-center text-lg font-medium text-foreground">
            How are you feeling{isSameDay(selectedDate, today) ? " today" : ""}?
          </h3>

          <MoodSelector selectedMood={selectedMood} onSelect={setSelectedMood} />

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Add a note (optional)
            </label>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={selectedMood ? `${getMoodSuggestion(selectedMood)}...` : "What's on your mind?"}
              className="bg-secondary/50 border-primary/30 focus:border-primary resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSaveEntry}
            disabled={!selectedMood}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save Entry
          </Button>
        </div>
      )}

      {/* Past Entries */}
      {sortedNotes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            Past Entries
          </h3>
          {sortedNotes.map((note) => (
            <NoteEntry
              key={note.id}
              note={note}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
            />
          ))}
        </div>
      )}

      {sortedNotes.length === 0 && !existingNote && (
        <div className="text-center py-8 animate-fade-in">
          <p className="text-muted-foreground text-sm">
            No entries yet. Start by logging your mood!
          </p>
        </div>
      )}

      {/* Yearly Calendar */}
      <YearlyCalendar
        notes={notes}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setSelectedMood(null);
          setNoteText("");
        }}
      />
    </div>
  );
};

export default NotesSection;
