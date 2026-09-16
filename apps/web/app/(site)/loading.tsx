export default function SiteLoading() {
  return (
    <div className="px-5 py-12 sm:px-8 sm:py-14 xl:px-14" aria-busy="true" aria-live="polite">
      <div className="h-3 w-28 animate-pulse rounded-sm bg-rvl-line" />
      <div className="mt-4 h-10 w-64 max-w-full animate-pulse rounded-sm bg-rvl-line" />
      <div className="mt-4 h-4 w-[min(100%,36rem)] animate-pulse rounded-sm bg-rvl-line" />
      <div className="mt-10 grid gap-3">
        <div className="h-14 animate-pulse rounded-sm bg-rvl-panel" />
        <div className="h-14 animate-pulse rounded-sm bg-rvl-panel" />
        <div className="h-14 animate-pulse rounded-sm bg-rvl-panel" />
      </div>
    </div>
  );
}
