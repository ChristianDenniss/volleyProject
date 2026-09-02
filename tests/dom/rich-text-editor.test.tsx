import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RichTextEditor, emptyDocJson } from "@components/site/rich-text-editor";
import { articleContentSchema, parseTiptapDoc } from "@/lib/tiptap-doc";

const IMAGE_URL = "https://example.com/photo.jpg";

function Harness({ onValue }: { onValue: (value: string) => void }) {
  const [value, setValue] = useState(emptyDocJson());
  return (
    <RichTextEditor
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue(next);
      }}
    />
  );
}

async function mountEditor() {
  let latest = emptyDocJson();
  const user = userEvent.setup();
  render(<Harness onValue={(value) => (latest = value)} />);
  await waitFor(() => expect(screen.getByLabelText("Insert image by URL")).toBeDefined());
  return { user, current: () => latest };
}

async function insertImage(url: string) {
  const { user, current } = await mountEditor();

  await user.click(screen.getByLabelText("Insert image by URL"));
  const input = await screen.findByPlaceholderText("https://example.com/photo.jpg");
  await user.type(input, url);
  await user.click(screen.getByRole("button", { name: "Insert" }));

  return current;
}

describe("RichTextEditor image insertion", () => {
  it("inserts an image node carrying the pasted URL", async () => {
    const current = await insertImage(IMAGE_URL);

    await waitFor(() => {
      const doc = parseTiptapDoc(current());
      expect(doc).not.toBeNull();
      expect(JSON.stringify(doc)).toContain(IMAGE_URL);
    });

    const doc = parseTiptapDoc(current());
    const image = doc?.content?.find((node) => node.type === "image");
    expect(image).toBeDefined();
    expect(image?.type === "image" && image.attrs.src).toBe(IMAGE_URL);
  });

  it("renders the inserted image in the editable surface", async () => {
    await insertImage(IMAGE_URL);
    await waitFor(() => {
      const image = document.querySelector<HTMLImageElement>(".ProseMirror img");
      expect(image?.getAttribute("src")).toBe(IMAGE_URL);
    });
  });

  it("produces a document the server-side schema accepts", async () => {
    const current = await insertImage(IMAGE_URL);
    await waitFor(() => expect(JSON.stringify(parseTiptapDoc(current()))).toContain(IMAGE_URL));

    const result = articleContentSchema.safeParse(current());
    expect(result.success).toBe(true);
  });

  it("paints its chrome from theme tokens so dark mode follows", async () => {
    await mountEditor();

    const surface = document.querySelector<HTMLElement>(".ProseMirror");
    const toolbarButton = screen.getByLabelText("Insert image by URL");
    const shell = toolbarButton.closest("div")?.parentElement;

    expect(surface?.className).toContain("text-rvl-ink");
    expect(shell?.className).toContain("bg-rvl-ground");
    expect(shell?.className).toContain("border-rvl-line");
    expect(document.body.innerHTML).not.toMatch(/class="[^"]*\[#[0-9a-fA-F]{3,6}\]/);
  });

  it("closes the URL bar without inserting when cancelled", async () => {
    const { user, current } = await mountEditor();

    await user.click(screen.getByLabelText("Insert image by URL"));
    await user.type(await screen.findByPlaceholderText("https://example.com/photo.jpg"), IMAGE_URL);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByPlaceholderText("https://example.com/photo.jpg")).toBeNull();
    expect(current()).not.toContain(IMAGE_URL);
  });
});
