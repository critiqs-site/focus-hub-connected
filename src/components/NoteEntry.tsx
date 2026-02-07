import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { MoodNote, MoodType } from "@/types/todo";
import { getMoodIcon, getMoodLabel } from "./MoodSelector";
import MoodSelector from "./MoodSelector";

interface NoteEntryProps {
  note: MoodNote;
  onEdit: (id: string, mood: MoodType, noteText: string) => void;
  onDelete: (id: string) => void;
}

const NoteEntry = ({ note, onEdit, onDelete }: NoteEntryProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editMood, setEditMood] = useState<MoodType>(note.mood);
  const [editNote, setEditNote] = useState(note.note);

  const handleSave = () => {
    onEdit(note.id, editMood, editNote);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditMood(note.mood);
    setEditNote(note.note);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="glass-card p-4 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            {format(new Date(note.date), 'EEEE, MMMM d')}
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/20">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 px-2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <MoodSelector selectedMood={editMood} onSelect={setEditMood} />
        <Textarea
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          placeholder="Add a note..."
          className="mt-3 bg-secondary/50 border-primary/30 focus:border-primary resize-none"
          rows={2}
        />
      </div>
    );
  }

  return (
    <div className="group glass-card p-4 transition-all duration-300 hover:border-primary/30 animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="text-3xl text-primary">{getMoodIcon(note.mood)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">
              {format(new Date(note.date), 'EEEE, MMMM d')}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-7 w-7 p-0 glass-button"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(note.id)}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <span className="text-xs text-primary font-medium">{getMoodLabel(note.mood)}</span>
          {note.note && (
            <p className="text-sm text-muted-foreground mt-2">{note.note}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteEntry;
