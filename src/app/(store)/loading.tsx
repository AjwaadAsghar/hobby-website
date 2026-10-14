export default function Loading() {
  return (
    <div className="container-store py-16" role="status" aria-label="Loading">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
      <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
