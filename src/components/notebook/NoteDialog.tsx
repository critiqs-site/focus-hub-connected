import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StickyNote, FileText } from "lucide-react";
import { Note } from "@/hooks/useNotebook";
import { format } from "date-fns";

export const NOTE_BODY_LIMIT = 500;

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onSave: (input: { id?: string; title: string; body: string }) => Promise<void>;
  onConvertToDoc?: (data: { title: string; body: string }) => void;
}

export const NoteDialog = ({ open, onOpenChange, note, onSave, onConvertToDoc }: NoteDialogProps) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    if (open) {
      setTitle(note?.title || "");
      setBody(note?.body || "");
      setEditing(!note); // new = edit, existing = view
    }
  }, [open, note]);

  const charCount = body.length;
  const overLimit = charCount >= NOTE_BODY_LIMIT;

  const handleSave = async () => {
    if (!title.trim() && !body.trim()) { onOpenChange(false); return; }
    await onSave({ id: note?.id, title: title.trim(), body });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              <StickyNote className="h-3 w-3" /> NOTE
            </span>
            {note && !editing && <span className="text-base font-semibold truncate">{note.title || "Untitled"}</span>}
          </DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="space-y-3">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              className="text-lg font-semibold"
              autoFocus
            />
            <Textarea
              placeholder="Body"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, NOTE_BODY_LIMIT))}
              rows={8}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-xs">
              <span className={overLimit ? "text-destructive font-medium" : "text-muted-foreground"}>
                {charCount}/{NOTE_BODY_LIMIT} characters
              </span>
              {overLimit && onConvertToDoc && (
                <button
                  onClick={() => { onConvertToDoc({ title, body }); onOpenChange(false); }}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <FileText className="h-3 w-3" /> Limit reached — create a Doc instead
                </button>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              {note && <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        ) : note ? (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>Created: {format(new Date(note.created_at), "PPp")}</div>
              <div>Last edited: {format(new Date(note.updated_at), "PPp")}</div>
              <div>Last visited: {format(new Date(note.last_visited_at), "PPp")}</div>
            </div>
            <div className="whitespace-pre-wrap break-words text-sm bg-secondary/30 rounded-xl p-4 min-h-[120px]">
              {note.body || <span className="text-muted-foreground italic">Empty note</span>}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => setEditing(true)}>Edit</Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default NoteDialog;