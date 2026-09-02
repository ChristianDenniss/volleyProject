import { describe, expect, it } from "vitest";
import { articleContentSchema, parseTiptapDoc, plainTextToDoc } from "@/lib/tiptap-doc";

const doc = (...content: unknown[]) => JSON.stringify({ type: "doc", content });
const paragraph = (text: string, marks?: unknown[]) => ({
  type: "paragraph",
  content: [{ type: "text", text, ...(marks ? { marks } : {}) }],
});

describe("article content validation", () => {
  it("accepts a document built from the supported node set", () => {
    const input = doc(
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Report" }] },
      paragraph("Volley won.", [{ type: "bold" }]),
      paragraph("See it", [{ type: "link", attrs: { href: "https://example.com" } }]),
      { type: "image", attrs: { src: "https://example.com/photo.jpg", alt: "photo" } },
      { type: "horizontalRule" },
      {
        type: "bulletList",
        content: [{ type: "listItem", content: [paragraph("point")] }],
      },
    );

    expect(articleContentSchema.parse(input)).toBe(input);
  });

  it("rejects javascript: link hrefs", () => {
    const input = doc(paragraph("click", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]));
    expect(articleContentSchema.safeParse(input).success).toBe(false);
  });

  it("rejects data: image sources", () => {
    const input = doc({ type: "image", attrs: { src: "data:text/html;base64,PHN2Zz4=" } });
    expect(articleContentSchema.safeParse(input).success).toBe(false);
  });

  it("rejects unknown node types", () => {
    const input = doc({ type: "script", content: [{ type: "text", text: "alert(1)" }] });
    expect(articleContentSchema.safeParse(input).success).toBe(false);
  });

  it("rejects unknown attributes on whitelisted nodes", () => {
    const input = doc({
      type: "image",
      attrs: { src: "https://example.com/a.jpg", onerror: "alert(1)" },
    });
    expect(articleContentSchema.safeParse(input).success).toBe(false);
  });

  it("rejects raw HTML strings and plain text", () => {
    expect(articleContentSchema.safeParse("<img src=x onerror=alert(1)>").success).toBe(false);
    expect(articleContentSchema.safeParse("just some prose").success).toBe(false);
  });

  it("rejects a document nested past the depth limit", () => {
    let node: unknown = paragraph("deep");
    for (let index = 0; index < 40; index += 1) {
      node = { type: "blockquote", content: [node] };
    }
    expect(articleContentSchema.safeParse(doc(node)).success).toBe(false);
  });

  it("rejects an empty document", () => {
    expect(articleContentSchema.safeParse(doc(paragraph(" "))).success).toBe(false);
    expect(articleContentSchema.safeParse(doc()).success).toBe(false);
  });

  it("treats legacy plain text as not-a-document so rendering can fall back", () => {
    expect(parseTiptapDoc("first para\n\nsecond para")).toBeNull();
    expect(plainTextToDoc("first para\n\nsecond para").content).toHaveLength(2);
  });
});
