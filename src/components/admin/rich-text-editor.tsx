"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Simple rich text editor (bold, headings, lists, links). Output is sanitised on the server. */
export function RichTextEditor({ value, onChange, label, id }: { value: string; onChange: (html: string) => void; label: string; id: string }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } })],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        "aria-label": label,
        "aria-multiline": "true",
        role: "textbox",
        class: "prose-store min-h-56 px-4 py-3 outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const btn = (active: boolean) =>
    cn("inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium hover:bg-muted", active && "bg-foreground text-background hover:bg-foreground");

  return (
    <div className="overflow-hidden rounded-xl border-2 border-input bg-background focus-within:border-foreground">
      <div role="toolbar" aria-label={`${label} formatting`} className="flex flex-wrap gap-1 border-b bg-muted/40 p-1.5">
        <button type="button" className={btn(!!editor?.isActive("bold"))} onClick={() => editor?.chain().focus().toggleBold().run()} aria-pressed={!!editor?.isActive("bold")} title="Bold">
          <Bold className="size-4" aria-hidden />
          <span className="sr-only">Bold</span>
        </button>
        <button type="button" className={btn(!!editor?.isActive("italic"))} onClick={() => editor?.chain().focus().toggleItalic().run()} aria-pressed={!!editor?.isActive("italic")} title="Italic">
          <Italic className="size-4" aria-hidden />
          <span className="sr-only">Italic</span>
        </button>
        <button type="button" className={btn(!!editor?.isActive("heading", { level: 2 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">
          <Heading2 className="size-4" aria-hidden />
          <span className="sr-only">Heading</span>
        </button>
        <button type="button" className={btn(!!editor?.isActive("heading", { level: 3 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="Sub-heading">
          <Heading3 className="size-4" aria-hidden />
          <span className="sr-only">Sub-heading</span>
        </button>
        <button type="button" className={btn(!!editor?.isActive("bulletList"))} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet list">
          <List className="size-4" aria-hidden />
          <span className="sr-only">Bullet list</span>
        </button>
        <button type="button" className={btn(!!editor?.isActive("orderedList"))} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <ListOrdered className="size-4" aria-hidden />
          <span className="sr-only">Numbered list</span>
        </button>
        <button type="button" className={btn(!!editor?.isActive("blockquote"))} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Quote">
          <Quote className="size-4" aria-hidden />
          <span className="sr-only">Quote</span>
        </button>
        <button
          type="button"
          className={btn(!!editor?.isActive("link"))}
          title="Link"
          onClick={() => {
            if (!editor) return;
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
              return;
            }
            const url = window.prompt("Link address (https://… or /page)");
            if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
        >
          <Link2 className="size-4" aria-hidden />
          <span className="sr-only">Link</span>
        </button>
        <span className="mx-1 w-px bg-border" aria-hidden />
        <button type="button" className={btn(false)} onClick={() => editor?.chain().focus().undo().run()} title="Undo">
          <Undo2 className="size-4" aria-hidden />
          <span className="sr-only">Undo</span>
        </button>
        <button type="button" className={btn(false)} onClick={() => editor?.chain().focus().redo().run()} title="Redo">
          <Redo2 className="size-4" aria-hidden />
          <span className="sr-only">Redo</span>
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
