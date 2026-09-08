import { NotFoundError } from "@server/services/errors";
import { object } from "@server/services/uploads";
import { UPLOAD_CACHE_CONTROL } from "@/lib/uploads";

export const dynamic = "force-dynamic";

function decodeKey(segments: string[]): string | null {
  try {
    return segments.map((segment) => decodeURIComponent(segment)).join("/");
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  const { key } = await params;
  const objectKey = decodeKey(key);
  if (objectKey === null) return new Response("Not found", { status: 404 });

  let found: R2ObjectBody;
  try {
    found = await object(objectKey);
  } catch (error) {
    if (error instanceof NotFoundError) return new Response("Not found", { status: 404 });
    throw error;
  }

  const etag = found.httpEtag;
  if (request.headers.get("If-None-Match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { "Cache-Control": UPLOAD_CACHE_CONTROL, ETag: etag },
    });
  }

  return new Response(found.body, {
    status: 200,
    headers: {
      "Content-Type": found.httpMetadata?.contentType ?? "application/octet-stream",
      "Content-Length": String(found.size),
      "Cache-Control": UPLOAD_CACHE_CONTROL,
      ETag: etag,
    },
  });
}
