import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Doc } from "@/hooks/useNotebook";
import { format } from "date-fns";
import RichEditor from "./RichEditor";

interface DocDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: Doc | null;
  initial?: { title?: string; body?: string };
  onSave: (input: { id?: string; title: string; short_description: string; body: string }) => Promise<void>;
}

export const DocDialog = ({ open, onOpenChange, doc, initial, onSave }: DocDialogProps) => {
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    if (open) {
      setTitle(doc?.title || initial?.title || "");
      setShortDesc(doc?.short_description || "");
      setBody(doc?.body || (initial?.body ? `<p>${initial.body.replace(/\n/g, "</p><p>")}</p>` : ""));
      setEditing(!doc);
    }
  }, [open, doc, initial]);

  const handleSave = async () => {
    if (!title.trim() && !body.trim()) { onOpenChange(false); return; }
    await onSave({ id: doc?.id, title: title.trim(), short_description: shortDesc.trim(), body });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              <FileText className="h-3 w-3" /> DOC
            </span>
            {doc && !editing && <span className="text-base font-semibold truncate">{doc.title || "Untitled"}</span>}
          </DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="space-y-3">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              className="text-xl font-bold h-12"
              autoFocus
            />
            <Input
              placeholder="Short description"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value.slice(0, 250))}
              className="text-sm"
            />
            <RichEditor value={body} onChange={setBody} placeholder="Long description... type **bold**, *italic*, # heading, - list, ``` code" minHeight={400} />
            <div className="flex gap-2 justify-end pt-2">
              {doc && <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        ) : doc ? (
          <div className="space-y-3">
            {doc.short_description && (
              <p className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3">{doc.short_description}</p>
            )}
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>Created: {format(new Date(doc.created_at), "PPp")}</div>
              <div>Last edited: {format(new Date(doc.updated_at), "PPp")}</div>
              <div>Last visited: {format(new Date(doc.last_visited_at), "PPp")}</div>
            </div>
            <div
              className="tiptap-editor prose prose-invert max-w-none bg-secondary/20 rounded-xl p-4 min-h-[200px] text-sm"
              dangerouslySetInnerHTML={{ __html: doc.body || "<p class='text-muted-foreground italic'>Empty doc</p>" }}
            />
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

export default DocDialog;