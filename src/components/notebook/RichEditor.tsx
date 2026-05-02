import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { useEffect } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Link2, Undo, Redo,
} from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export const RichEditor = ({ value, onChange, placeholder = "Start writing...", minHeight = 300 }: RichEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Placeholder.configure({ placeholder }),
      Typography,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "tiptap-editor prose prose-invert max-w-none focus:outline-none px-4 py-3 text-sm",
        style: `min-height: ${minHeight}px;`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  const Btn = ({ active, onClick, label, children }: any) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={label}
      className={`p-1.5 rounded-md transition-colors ${active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-border rounded-xl bg-background/50 overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-secondary/30">
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} label="Bold (**text**)"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} label="Italic (*text*)"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} label="Underline"><UnderlineIcon className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} label="Strikethrough (~~text~~)"><Strikethrough className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} label="Inline code"><Code className="h-3.5 w-3.5" /></Btn>
        <span className="w-px h-5 bg-border mx-1" />
        <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} label="H1"><Heading1 className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} label="H2"><Heading2 className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} label="H3"><Heading3 className="h-3.5 w-3.5" /></Btn>
        <span className="w-px h-5 bg-border mx-1" />
        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} label="Bulleted list"><List className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} label="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} label="Quote"><Quote className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} label="Code block (```)">{`</>`}</Btn>
        <span className="w-px h-5 bg-border mx-1" />
        <Btn
          active={editor.isActive("link")}
          onClick={() => {
            const prev = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("Link URL", prev || "https://");
            if (url === null) return;
            if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
          label="Link"
        ><Link2 className="h-3.5 w-3.5" /></Btn>
        <span className="ml-auto" />
        <Btn onClick={() => editor.chain().focus().undo().run()} label="Undo"><Undo className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} label="Redo"><Redo className="h-3.5 w-3.5" /></Btn>
      </div>
      <EditorContent editor={editor} />
      <div className="px-3 py-1 text-[10px] text-muted-foreground border-t border-border bg-secondary/20">
        Tip: **bold** · *italic* · ~~strike~~ · `code` · # H1 · ## H2 · - list · &gt; quote · ``` code block
      </div>
    </div>
  );
};

export default RichEditor;