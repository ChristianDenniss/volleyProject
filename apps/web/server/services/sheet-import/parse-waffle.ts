function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    );
}

function cellText(inner: string): string {
  return decodeEntities(inner.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Expand a Sheets htmlview waffle `<table>` into a grid, honoring colspan. */
export function parseWaffleRows(html: string): string[][] {
  const rows: string[][] = [];

  for (const rowMatch of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const inner = rowMatch[1] ?? "";
    if (!/<td\b/i.test(inner)) continue;

    const cells: string[] = [];
    for (const td of inner.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)) {
      const colspan = Number.parseInt(td[1]?.match(/colspan="(\d+)"/i)?.[1] ?? "1", 10);
      const span = Number.isFinite(colspan) && colspan > 0 ? colspan : 1;
      cells.push(cellText(td[2] ?? ""));
      for (let extra = 1; extra < span; extra += 1) cells.push("");
    }

    if (cells.some((value) => value)) rows.push(cells);
  }

  return rows;
}

export function rowsToCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
          return value;
        })
        .join(","),
    )
    .join("\n");
}

export function waffleHtmlToCsv(html: string): string {
  return rowsToCsv(parseWaffleRows(html));
}

export function waffleHtmlToLines(html: string): string[] {
  const csv = waffleHtmlToCsv(html);
  return csv === "" ? [] : csv.split(/\r?\n/);
}
