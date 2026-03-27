export default function Loading() {
  return (
    <div className="page-shell py-12">
      <div className="panel space-y-4 p-6">
        <div className="h-4 w-32 animate-pulse rounded-full bg-secondary" />
        <div className="h-10 w-3/5 animate-pulse rounded-full bg-secondary" />
        <div className="h-24 animate-pulse rounded-[calc(var(--radius)-0.1rem)] bg-secondary/70" />
      </div>
    </div>
  );
}

