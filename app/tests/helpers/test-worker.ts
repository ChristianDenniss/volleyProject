export default {
  fetch(): Response {
    return new Response("test worker", { status: 200 });
  },
} satisfies ExportedHandler<Env>;
