export async function enableMocking() {
  if (import.meta.env.VITE_USE_MSW !== "true") {
    return;
  }

  const { worker } = await import("./browser");

  return worker.start({
    onUnhandledRequest: "warn",
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
}
