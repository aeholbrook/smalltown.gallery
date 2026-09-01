export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-8 h-10 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-10 columns-2 gap-2 sm:columns-3 md:columns-4 lg:columns-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="mb-2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
              style={{ height: `${140 + ((i * 53) % 120)}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
