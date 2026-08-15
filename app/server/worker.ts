import handler from "vinext/server/fetch-handler";

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    return handler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
