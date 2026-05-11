import { useState, useMemo } from "react";
import { Plus, StickyNote, FileText, Pin, Lock, Unlock, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNotebook, Note, Doc, getUserPinHash } from "@/hooks/useNotebook";
import NoteDialog from "./notebook/NoteDialog";
import DocDialog from "./notebook/DocDialog";
import PinDialog from "./notebook/PinDialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface NotebookViewProps {
  userId: string | undefined;
  isGuest: boolean;
}

const NotebookView = ({ userId, isGuest }: NotebookViewProps) => {
  const navigate = useNavigate();
  const nb = useNotebook(userId);
  const [tab, setTab] = useState<"notes" | "docs">("notes");
  const [search, setSearch] = useState("");

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [docInitial, setDocInitial] = useState<{ title?: string; body?: string } | undefined>();

  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinAction, setPinAction] = useState<{ kind: "note" | "doc"; id: string; mode: "unlock" | "lock" } | null>(null);

  const sortedNotes = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = nb.notes.filter(n =>
      (n.title || "").toLowerCase().includes(q) || (n.body || "").toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [nb.notes, search]);

  const sortedDocs = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = nb.docs.filter(d =>
      (d.title || "").toLowerCase().includes(q) ||
      (d.short_description || "").toLowerCase().includes(q)
    );
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [nb.docs, search]);

  const openNote = async (n: Note) => {
    if (n.locked && !isGuest && userId) {
      setPinAction({ kind: "note", id: n.id, mode: "unlock" });
      setPinDialogOpen(true);
      return;
    }
    setActiveNote(n);
    setNoteDialogOpen(true);
    nb.visitNote(n.id);
  };

  const openDoc = async (d: Doc) => {
    if (d.locked && !isGuest && userId) {
      setPinAction({ kind: "doc", id: d.id, mode: "unlock" });
      setPinDialogOpen(true);
      return;
    }
    setActiveDoc(d);
    setDocInitial(undefined);
    setDocDialogOpen(true);
    nb.visitDoc(d.id);
  };

  const handleLockToggle = async (kind: "note" | "doc", id: string, currentlyLocked: boolean) => {
    if (isGuest || !userId) {
      toast.error("Lock requires registration", {
        action: { label: "Sign up", onClick: () => navigate("/auth") },
      });
      return;
    }
    if (currentlyLocked) {
      // Unlocking - verify PIN
      setPinAction({ kind, id, mode: "lock" });
      setPinDialogOpen(true);
    } else {
      // Locking - check if PIN exists, else setup
      const hash = await getUserPinHash(userId);
      if (!hash) {
        setPinAction({ kind, id, mode: "lock" });
        setPinDialogOpen(true);
        return;
      }
      if (kind === "note") await nb.toggleLockNote(id, true);
      else await nb.toggleLockDoc(id, true);
      toast.success("Locked");
    }
  };

  const handlePinSuccess = async () => {
    if (!pinAction) return;
    const { kind, id, mode } = pinAction;
    if (mode === "unlock") {
      // open the item
      if (kind === "note") {
        const n = nb.notes.find(x => x.id === id);
        if (n) { setActiveNote(n); setNoteDialogOpen(true); nb.visitNote(id); }
      } else {
        const d = nb.docs.find(x => x.id === id);
        if (d) { setActiveDoc(d); setDocInitial(undefined); setDocDialogOpen(true); nb.visitDoc(id); }
      }
    } else {
      // toggle lock state
      const item = kind === "note" ? nb.notes.find(x => x.id === id) : nb.docs.find(x => x.id === id);
      if (!item) return;
      const newLocked = !item.locked;
      if (kind === "note") await nb.toggleLockNote(id, newLocked);
      else await nb.toggleLockDoc(id, newLocked);
      toast.success(newLocked ? "Locked" : "Unlocked");
    }
    setPinAction(null);
  };

  const handleDelete = async (kind: "note" | "doc", id: string) => {
    if (!confirm(`Delete this ${kind}?`)) return;
    if (kind === "note") await nb.deleteNote(id);
    else await nb.deleteDoc(id);
    toast.success("Deleted");
  };

  return (
    <div className="space-y-4">
      {isGuest && (
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-sm text-muted-foreground text-center">
          Guest users cannot use the full version of this app.{" "}
          <button onClick={() => navigate("/auth")} className="text-primary font-medium underline hover:no-underline">
            Register now!
          </button>{" "}
          It's free. (Notes/Docs are saved locally only, lock feature unavailable.)
        </div>
      )}

      {/* Tab switcher + search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex gap-1.5 p-1 rounded-xl glass-card">
          <button
            onClick={() => setTab("notes")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "notes" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <StickyNote className="h-3.5 w-3.5" /> Notes
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/60">{nb.notes.length}</span>
          </button>
          <button
            onClick={() => setTab("docs")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "docs" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <FileText className="h-3.5 w-3.5" /> Docs
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/60">{nb.docs.length}</span>
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          onClick={() => {
            if (tab === "notes") { setActiveNote(null); setNoteDialogOpen(true); }
            else { setActiveDoc(null); setDocInitial(undefined); setDocDialogOpen(true); }
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm whitespace-nowrap transition-all"
        >
          <Plus className="h-4 w-4" />
          {tab === "notes" ? "Add Note" : "Make Doc"}
        </button>
      </div>

      {/* List */}
      {nb.loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : tab === "notes" ? (
        sortedNotes.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <StickyNote className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No notes yet. Click "Add Note" to start.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedNotes.map(n => (
              <div
                key={n.id}
                onClick={() => openNote(n)}
                className="group glass-card rounded-2xl p-4 cursor-pointer hover:border-primary/40 transition-all relative"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                    <StickyNote className="h-2.5 w-2.5" /> NOTE
                  </span>
                  {n.pinned && <Pin className="h-3 w-3 text-primary fill-primary" />}
                  {n.locked && <Lock className="h-3 w-3 text-primary" />}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); nb.togglePinNote(n.id, !n.pinned); }} title={n.pinned ? "Unpin" : "Pin"} className="p-1 rounded hover:bg-secondary">
                      <Pin className={`h-3 w-3 ${n.pinned ? "fill-primary text-primary" : ""}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleLockToggle("note", n.id, n.locked); }} title={n.locked ? "Unlock" : "Lock"} className="p-1 rounded hover:bg-secondary">
                      {n.locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete("note", n.id); }} title="Delete" className="p-1 rounded hover:bg-destructive/20 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1 truncate">{n.title || "Untitled"}</h3>
                {n.locked ? (
                  <p className="text-xs text-muted-foreground italic flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</p>
                ) : (
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap break-words">{n.body || "Empty"}</p>
                )}
                <p className="text-[10px] text-muted-foreground/70 mt-2">Edited {format(new Date(n.updated_at), "MMM d, p")}</p>
              </div>
            ))}
          </div>
        )
      ) : sortedDocs.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No docs yet. Click "Make Doc" to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedDocs.map(d => (
            <div
              key={d.id}
              onClick={() => openDoc(d)}
              className="group glass-card rounded-2xl p-4 cursor-pointer hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                  <FileText className="h-2.5 w-2.5" /> DOC
                </span>
                {d.pinned && <Pin className="h-3 w-3 text-primary fill-primary" />}
                {d.locked && <Lock className="h-3 w-3 text-primary" />}
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); nb.togglePinDoc(d.id, !d.pinned); }} title={d.pinned ? "Unpin" : "Pin"} className="p-1 rounded hover:bg-secondary">
                    <Pin className={`h-3 w-3 ${d.pinned ? "fill-primary text-primary" : ""}`} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleLockToggle("doc", d.id, d.locked); }} title={d.locked ? "Unlock" : "Lock"} className="p-1 rounded hover:bg-secondary">
                    {d.locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete("doc", d.id); }} title="Delete" className="p-1 rounded hover:bg-destructive/20 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-base mb-1 truncate">{d.title || "Untitled"}</h3>
              {d.locked ? (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</p>
              ) : (
                <p className="text-xs text-muted-foreground line-clamp-2 italic">{d.short_description || "No description"}</p>
              )}
              <p className="text-[10px] text-muted-foreground/70 mt-2">Edited {format(new Date(d.updated_at), "MMM d, p")}</p>
            </div>
          ))}
        </div>
      )}

      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        note={activeNote}
        onSave={async (input) => { await nb.saveNote(input); }}
        onConvertToDoc={(data) => {
          setActiveDoc(null);
          setDocInitial(data);
          setDocDialogOpen(true);
        }}
      />
      <DocDialog
        open={docDialogOpen}
        onOpenChange={setDocDialogOpen}
        doc={activeDoc}
        initial={docInitial}
        onSave={async (input) => { await nb.saveDoc(input); }}
      />
      {!isGuest && userId && pinAction && (
        <PinDialog
          open={pinDialogOpen}
          onOpenChange={(o) => { setPinDialogOpen(o); if (!o) setPinAction(null); }}
          userId={userId}
          mode="verify"
          onSuccess={handlePinSuccess}
        />
      )}
    </div>
  );
};

export default NotebookView;