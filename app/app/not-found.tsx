import Link from 'next/link'
import Header from '@/components/ui/Header'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Header />
      <main className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-6xl font-bold text-zinc-300 dark:text-zinc-700 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
          Page not found
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist. It may have been moved or the URL might be incorrect.
        </p>
        <div className="flex gap-4">
          <Link
            href="/"
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            Back to Map
          </Link>
          <Link
            href="/about"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            About
          </Link>
        </div>
      </main>
    </div>
  )
}
