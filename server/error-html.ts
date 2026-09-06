import type { ErrorPresentation } from "@/lib/error-presentation";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderErrorHtml(
  presentation: ErrorPresentation,
  detail: string | null = null,
): string {
  const paragraphs = [presentation.body, presentation.hint].filter(Boolean).join(" ");
  const link = presentation.link
    ? `<a href="${escapeHtml(presentation.link.href)}" style="display:inline-flex;align-items:center;justify-content:center;gap:0.375rem;border-radius:0.5rem;background:#ffb020;color:#1a1208;padding:0.625rem 1rem;font-size:0.875rem;font-weight:500;text-decoration:none">${escapeHtml(presentation.link.label)}</a>`
    : "";
  const refresh =
    presentation.kind !== "not-found" &&
    presentation.kind !== "forbidden" &&
    presentation.kind !== "unauthorized"
      ? `<button type="button" onclick="location.reload()" style="display:inline-flex;align-items:center;justify-content:center;gap:0.375rem;border:1px solid #e5e0d8;border-radius:0.5rem;background:#ffffff;color:#1a1208;padding:0.625rem 1rem;font-size:0.875rem;font-weight:500;cursor:pointer">Refresh</button>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(presentation.title)} · Volleyball 4-2 League</title>
  <style>
    body { margin: 0; min-height: 100vh; background: #faf8f5; color: #1a1208; font-family: "Segoe UI", system-ui, sans-serif; }
  </style>
</head>
<body>
  <main style="display:flex;min-height:100vh;align-items:center;justify-content:center;padding:4rem 1.5rem">
    <div style="display:flex;width:100%;max-width:32rem;flex-direction:column;align-items:center;text-align:center">
      <img src="/rvlLogo.png" alt="Volleyball 4-2 League" width="112" height="112" style="margin-bottom:2.5rem;height:7rem;width:auto;transform:rotate(-6deg)" />
      <h1 style="margin:0;font-size:1.5rem;font-weight:600;letter-spacing:-0.015em;color:#1a1208">${escapeHtml(presentation.title)}</h1>
      <p style="margin:0.75rem 0 0;max-width:28rem;font-size:0.875rem;line-height:1.6;color:#5c554c">${escapeHtml(paragraphs)}</p>
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:0.75rem;margin-top:2rem">${link}${refresh}</div>
    </div>
  </main>
</body>
</html>`;
}

export function errorHtmlResponse(
  presentation: ErrorPresentation,
  detail: string | null,
  status = 500,
): Response {
  return new Response(renderErrorHtml(presentation, detail), {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function errorJsonResponse(presentation: ErrorPresentation, status = 500): Response {
  return Response.json(
    { error: { message: presentation.summary, kind: presentation.kind } },
    { status, headers: { "cache-control": "no-store" } },
  );
}
