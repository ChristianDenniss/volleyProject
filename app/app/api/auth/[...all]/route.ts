import { getAuth } from "@server/auth";

function handler(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

export const GET = handler;
export const POST = handler;
