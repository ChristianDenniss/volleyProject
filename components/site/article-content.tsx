import { Fragment, type ReactNode } from "react";
import {
  parseTiptapDoc,
  type TiptapDoc,
  type TiptapListItem,
  type TiptapMark,
  type TiptapNode,
} from "@/lib/tiptap-doc";

const HEADING_CLASS: Record<number, string> = {
  1: "mb-4 mt-8 text-[2rem] font-bold leading-tight",
  2: "mb-3 mt-8 text-[1.6rem] font-bold leading-tight",
  3: "mb-3 mt-6 text-[1.3rem] font-bold leading-snug",
  4: "mb-2 mt-6 text-[1.15rem] font-bold",
  5: "mb-2 mt-4 text-[1.05rem] font-bold",
  6: "mb-2 mt-4 text-[1rem] font-bold uppercase tracking-wide",
};

function applyMarks(text: ReactNode, marks: TiptapMark[] | undefined): ReactNode {
  if (!marks?.length) return text;

  return marks.reduce<ReactNode>((node, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong className="font-bold">{node}</strong>;
      case "italic":
        return <em className="italic">{node}</em>;
      case "underline":
        return <u className="underline">{node}</u>;
      case "strike":
        return <s className="line-through">{node}</s>;
      case "code":
        return (
          <code className="rounded-xs bg-rvl-panel px-1.5 py-0.5 font-mono text-[0.88em]">
            {node}
          </code>
        );
      case "link":
        return (
          <a
            href={mark.attrs.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-rvl-accent underline underline-offset-2"
          >
            {node}
          </a>
        );
      default:
        return node;
    }
  }, text);
}

function renderNodes(nodes: TiptapNode[] | undefined): ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((node, index) => <Fragment key={index}>{renderNode(node)}</Fragment>);
}

function renderListItems(items: TiptapListItem[] | undefined): ReactNode {
  if (!items?.length) return null;

  return items.map((item, index) => (
    <li key={index} className="mb-2">
      {renderNodes(item.content)}
    </li>
  ));
}

function renderNode(node: TiptapNode): ReactNode {
  switch (node.type) {
    case "text":
      return applyMarks(node.text, node.marks);

    case "hardBreak":
      return <br />;

    case "paragraph":
      return <p className="mb-6">{renderNodes(node.content)}</p>;

    case "heading": {
      const level = Math.min(6, Math.max(1, node.attrs.level));
      const Tag = `h${level}` as "h1";
      return <Tag className={HEADING_CLASS[level]}>{renderNodes(node.content)}</Tag>;
    }

    case "blockquote":
      return (
        <blockquote className="mb-6 border-l-2 border-rvl-accent-soft pl-5 italic text-rvl-ink">
          {renderNodes(node.content)}
        </blockquote>
      );

    case "bulletList":
      return <ul className="mb-6 list-disc pl-6">{renderListItems(node.content)}</ul>;

    case "orderedList":
      return <ol className="mb-6 list-decimal pl-6">{renderListItems(node.content)}</ol>;

    case "codeBlock":
      return (
        <pre className="mb-6 overflow-x-auto rounded-xs border border-rvl-line bg-rvl-panel p-4 font-mono text-[0.88rem] text-rvl-ink">
          <code>{renderNodes(node.content)}</code>
        </pre>
      );

    case "horizontalRule":
      return <hr className="my-8 border-t border-rvl-line-strong" />;

    case "image":
      return (
        <img
          src={node.attrs.src}
          alt={node.attrs.alt ?? ""}
          title={node.attrs.title ?? undefined}
          className="mb-6 block w-full rounded object-cover"
        />
      );

    default:
      return null;
  }
}

function renderPlainText(content: string): ReactNode {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index} className="mb-6">
        {paragraph}
      </p>
    ));
}

export function ArticleContent({ content, className }: { content: string; className?: string }) {
  const doc: TiptapDoc | null = parseTiptapDoc(content);

  return (
    <div className={className}>{doc ? renderNodes(doc.content) : renderPlainText(content)}</div>
  );
}
