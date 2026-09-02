"use client";

import { useState } from "react";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseTiptapDoc, plainTextToDoc } from "@/lib/tiptap-doc";

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    link: {
      openOnClick: false,
      autolink: true,
      protocols: ["http", "https", "mailto"],
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    },
  }),
  Image.configure({ inline: false, allowBase64: false }),
];

const editorClass = [
  "min-h-[320px] w-full px-4 py-3 text-base leading-[1.7] text-rvl-ink outline-none",
  "[&_p]:mb-4",
  "[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-[1.6rem] [&_h2]:font-bold",
  "[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-[1.3rem] [&_h3]:font-bold",
  "[&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-[1.1rem] [&_h4]:font-bold",
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6",
  "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:mb-1",
  "[&_blockquote]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-rvl-accent-soft [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-rvl-ink",
  "[&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xs [&_pre]:border [&_pre]:border-rvl-line [&_pre]:bg-rvl-panel [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[0.88rem] [&_pre]:text-rvl-ink",
  "[&_code]:rounded-xs [&_code]:bg-rvl-panel [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.88em] [&_code]:text-rvl-ink",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
  "[&_hr]:my-6 [&_hr]:border-t [&_hr]:border-rvl-line-strong",
  "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xs",
  "[&_a]:text-rvl-accent [&_a]:underline [&_a]:underline-offset-2",
  "[&_.ProseMirror-selectednode]:outline [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-rvl-accent",
].join(" ");

function initialContent(value: string): JSONContent {
  const doc = parseTiptapDoc(value) ?? plainTextToDoc(value);
  return { type: "doc", content: (doc.content ?? []) as JSONContent[] };
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-8 cursor-pointer items-center justify-center rounded-xs border border-transparent text-rvl-ink-2 transition-colors duration-150",
        "hover:enabled:bg-rvl-panel disabled:cursor-not-allowed disabled:opacity-40",
        active && "border-rvl-accent-soft bg-rvl-accent-soft/40 text-rvl-accent",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-6 w-px self-center bg-rvl-line" />;
}

type Draft = { kind: "link" | "image"; value: string } | null;

function UrlBar({
  draft,
  setDraft,
  editor,
}: {
  draft: NonNullable<Draft>;
  setDraft: (next: Draft) => void;
  editor: Editor;
}) {
  const submit = () => {
    const url = draft.value.trim();
    if (url === "") {
      setDraft(null);
      return;
    }

    if (draft.kind === "link") {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setDraft(null);
  };

  return (
    <div className="flex items-center gap-2 border-b border-rvl-line bg-rvl-ground px-2 py-2">
      <input
        autoFocus
        type="url"
        placeholder={draft.kind === "link" ? "https://example.com" : "https://example.com/photo.jpg"}
        value={draft.value}
        onChange={(event) => setDraft({ kind: draft.kind, value: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
          if (event.key === "Escape") setDraft(null);
        }}
        className="w-full rounded-xs border border-rvl-line bg-rvl-ground px-2 py-1 text-sm text-rvl-ink focus:border-rvl-accent focus:outline-none"
      />
      <button
        type="button"
        onClick={submit}
        className="cursor-pointer rounded-xs bg-rvl-accent-bg px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-on-accent transition-opacity hover:opacity-85"
      >
        {draft.kind === "link" ? "Link" : "Insert"}
      </button>
      <button
        type="button"
        onClick={() => setDraft(null)}
        className="cursor-pointer rounded-xs border border-rvl-line px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-ink-2 transition-colors hover:bg-rvl-panel"
      >
        Cancel
      </button>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  className,
  label = "Article body",
}: {
  value: string;
  onChange: (json: string) => void;
  className?: string;
  // A contenteditable cannot be the target of a <label htmlFor>, so the only way
  // to give it an accessible name is to label the element itself.
  label?: string;
}) {
  const [draft, setDraft] = useState<Draft>(null);

  const editor = useEditor({
    extensions,
    content: initialContent(value),
    immediatelyRender: false,
    editorProps: { attributes: { class: editorClass, role: "textbox", "aria-label": label } },
    onUpdate: ({ editor: instance }) => onChange(JSON.stringify(instance.getJSON())),
  });

  if (!editor) {
    return (
      <div className={cn("min-h-[380px] border border-rvl-line bg-rvl-panel", className)} />
    );
  }

  return (
    <div className={cn("overflow-hidden border border-rvl-line bg-rvl-ground", className)}>
      <div className="flex flex-wrap gap-1 border-b border-rvl-line bg-rvl-panel p-2">
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Add link"
          active={editor.isActive("link")}
          onClick={() =>
            setDraft({ kind: "link", value: (editor.getAttributes("link")["href"] as string) ?? "" })
          }
        >
          <LinkIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Remove link"
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Insert image by URL" onClick={() => setDraft({ kind: "image", value: "" })}>
          <ImageIcon className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
      </div>

      {draft ? <UrlBar draft={draft} setDraft={setDraft} editor={editor} /> : null}

      <EditorContent editor={editor} />
    </div>
  );
}

export function emptyDocJson(): string {
  return JSON.stringify(plainTextToDoc(""));
}

export function isEmptyDoc(value: string): boolean {
  const doc = parseTiptapDoc(value);
  if (!doc) return value.trim() === "";
  const serialized = JSON.stringify(doc);
  return !serialized.includes('"text"') && !serialized.includes('"image"');
}
