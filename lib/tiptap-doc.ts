import { z } from "zod";

export const MAX_CONTENT_CHARS = 400_000;
const MAX_NODES = 4_000;
const MAX_DEPTH = 24;
const MAX_TEXT_CHARS = 200_000;
const MAX_URL_CHARS = 2_048;

const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const MEDIA_PROTOCOLS = new Set(["http:", "https:"]);

function checkUrl(value: string, protocols: Set<string>): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return protocols.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

const linkUrl = z
  .string()
  .min(1)
  .max(MAX_URL_CHARS)
  .refine((value) => checkUrl(value, LINK_PROTOCOLS), "Links must be http, https or mailto.");

const mediaUrl = z
  .string()
  .min(1)
  .max(MAX_URL_CHARS)
  .refine((value) => checkUrl(value, MEDIA_PROTOCOLS), "Images must be http or https links.");

const shortText = z.string().max(500).nullable().optional();

const plainAttrs = z
  .record(z.string().max(64), z.union([z.string().max(500), z.number(), z.boolean(), z.null()]))
  .optional();

const simpleMark = <T extends string>(type: T) => z.object({ type: z.literal(type) }).strict();

const markSchema = z.discriminatedUnion("type", [
  simpleMark("bold"),
  simpleMark("italic"),
  simpleMark("underline"),
  simpleMark("strike"),
  simpleMark("code"),
  z
    .object({
      type: z.literal("link"),
      attrs: z
        .object({
          href: linkUrl,
          target: shortText,
          rel: shortText,
          class: shortText,
          title: shortText,
        })
        .strict(),
    })
    .strict(),
]);

export type TiptapMark = z.infer<typeof markSchema>;

const textNode = z
  .object({
    type: z.literal("text"),
    text: z.string().min(1).max(MAX_TEXT_CHARS),
    marks: z.array(markSchema).max(12).optional(),
  })
  .strict();

const hardBreakNode = z
  .object({ type: z.literal("hardBreak"), attrs: plainAttrs, marks: z.array(markSchema).max(12).optional() })
  .strict();

const inlineNode = z.discriminatedUnion("type", [textNode, hardBreakNode]);

const inlineContent = z.array(inlineNode).max(MAX_NODES).optional();

const headingNode = z
  .object({
    type: z.literal("heading"),
    attrs: z.object({ level: z.number().int().min(1).max(6) }).strict(),
    content: inlineContent,
  })
  .strict();

const paragraphNode = z
  .object({ type: z.literal("paragraph"), attrs: plainAttrs, content: inlineContent })
  .strict();

const codeBlockNode = z
  .object({
    type: z.literal("codeBlock"),
    attrs: z.object({ language: shortText }).strict().optional(),
    content: z.array(textNode).max(MAX_NODES).optional(),
  })
  .strict();

const horizontalRuleNode = z
  .object({ type: z.literal("horizontalRule"), attrs: plainAttrs })
  .strict();

const imageNode = z
  .object({
    type: z.literal("image"),
    attrs: z.object({ src: mediaUrl, alt: shortText, title: shortText }).strict(),
  })
  .strict();

const blockNode: z.ZodType<TiptapNode> = z.lazy(() =>
  z.discriminatedUnion("type", [
    paragraphNode,
    headingNode,
    codeBlockNode,
    horizontalRuleNode,
    imageNode,
    blockquoteNode,
    bulletListNode,
    orderedListNode,
  ]),
);

const blockContent = z.array(blockNode).max(MAX_NODES).optional();

const blockquoteNode = z
  .object({ type: z.literal("blockquote"), attrs: plainAttrs, content: blockContent })
  .strict();

const listItemNode = z
  .object({ type: z.literal("listItem"), attrs: plainAttrs, content: blockContent })
  .strict();

const listContent = z.array(listItemNode).max(MAX_NODES).optional();

const bulletListNode = z
  .object({ type: z.literal("bulletList"), attrs: plainAttrs, content: listContent })
  .strict();

const orderedListNode = z
  .object({ type: z.literal("orderedList"), attrs: plainAttrs, content: listContent })
  .strict();

type Attrs = Record<string, string | number | boolean | null | undefined>;

export type TiptapNode =
  | { type: "text"; text: string; marks?: TiptapMark[] }
  | { type: "hardBreak"; attrs?: Attrs; marks?: TiptapMark[] }
  | { type: "paragraph"; attrs?: Attrs; content?: TiptapNode[] }
  | { type: "heading"; attrs: { level: number }; content?: TiptapNode[] }
  | { type: "codeBlock"; attrs?: { language?: string | null }; content?: TiptapNode[] }
  | { type: "horizontalRule"; attrs?: Attrs }
  | { type: "image"; attrs: { src: string; alt?: string | null; title?: string | null } }
  | { type: "blockquote"; attrs?: Attrs; content?: TiptapNode[] }
  | { type: "bulletList"; attrs?: Attrs; content?: TiptapListItem[] }
  | { type: "orderedList"; attrs?: Attrs; content?: TiptapListItem[] };

export interface TiptapListItem {
  type: "listItem";
  attrs?: Attrs;
  content?: TiptapNode[];
}

export interface TiptapDoc {
  type: "doc";
  content?: TiptapNode[];
}

function walk(node: unknown, depth: number, budget: { nodes: number; chars: number }): boolean {
  if (depth > MAX_DEPTH) return false;
  if (typeof node !== "object" || node === null) return false;

  budget.nodes += 1;
  if (budget.nodes > MAX_NODES) return false;

  const record = node as { text?: unknown; content?: unknown };
  if (typeof record.text === "string") {
    budget.chars += record.text.length;
    if (budget.chars > MAX_TEXT_CHARS) return false;
  }

  if (Array.isArray(record.content)) {
    for (const child of record.content) {
      if (!walk(child, depth + 1, budget)) return false;
    }
  }

  return true;
}

export const tiptapDocSchema = z
  .object({ type: z.literal("doc"), content: blockContent })
  .strict()
  .refine(
    (doc) => walk(doc, 0, { nodes: 0, chars: 0 }),
    "The article is too large or too deeply nested.",
  );

export function parseTiptapDoc(value: string): TiptapDoc | null {
  if (value.length > MAX_CONTENT_CHARS) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) return null;

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    return null;
  }

  const result = tiptapDocSchema.safeParse(json);
  return result.success ? (result.data as TiptapDoc) : null;
}

export function docToPlainText(doc: TiptapDoc): string {
  const parts: string[] = [];

  const visit = (node: unknown) => {
    if (typeof node !== "object" || node === null) return;
    const record = node as { type?: string; text?: string; content?: unknown[] };
    if (record.type === "text" && record.text) parts.push(record.text);
    if (Array.isArray(record.content)) record.content.forEach(visit);
    if (record.type === "paragraph" || record.type === "heading") parts.push("\n\n");
  };

  visit(doc);
  return parts.join("").replace(/\n{3,}/g, "\n\n").trim();
}

export function plainTextToDoc(value: string): TiptapDoc {
  const paragraphs = value.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return {
    type: "doc",
    content: paragraphs.length
      ? paragraphs.map((block) => ({
          type: "paragraph" as const,
          content: [{ type: "text" as const, text: block }],
        }))
      : [{ type: "paragraph" as const }],
  };
}

export const articleContentSchema = z
  .string()
  .min(1)
  .max(MAX_CONTENT_CHARS)
  .transform((value, ctx) => {
    const doc = parseTiptapDoc(value);
    if (!doc) {
      ctx.addIssue({
        code: "custom",
        message: "Article content must be valid editor JSON using supported formatting only.",
      });
      return z.NEVER;
    }

    const text = docToPlainText(doc);
    if (text.length === 0 && !JSON.stringify(doc).includes('"image"')) {
      ctx.addIssue({ code: "custom", message: "The article body is empty." });
      return z.NEVER;
    }

    return JSON.stringify(doc);
  });
