import handler from "vinext/server/fetch-handler";
import { handleRecordsBatch, type RecordsJobMessage } from "./queue";

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    return handler.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<RecordsJobMessage>, env: Env): Promise<void> {
    await handleRecordsBatch(batch, env);
  },
} satisfies ExportedHandler<Env, RecordsJobMessage>;
