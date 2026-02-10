'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export default function Header() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-2 sm:h-16 sm:py-0 transition-colors">
      <div className="flex min-h-12 sm:h-full items-center justify-between">
        <Link href="/" className="group">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src="https://1000logos.net/wp-content/uploads/2020/01/Southern-Illinois-Salukis-Logo-1964.png"
              alt="Southern Illinois Salukis logo"
              className="h-12 w-12 object-contain grayscale sm:h-24 sm:w-24"
            />
            <h1 className="film-title max-w-[58vw] truncate text-lg tracking-wide text-zinc-900 dark:text-white sm:max-w-none sm:text-3xl">
              <span className="sm:hidden">Small Town Doc</span>
              <span className="hidden sm:inline">The Small Town Documentary Project</span>
            </h1>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Map
          </Link>
          <Link href="/about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            About
          </Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                Dashboard
              </Link>
              {session.user.role === 'ADMIN' && (
                <Link href="/admin" className="hover:text-amber-500 transition-colors">
                  Admin
                </Link>
              )}
              <span className="text-zinc-700 dark:text-zinc-300">
                {session.user.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Sign In
            </Link>
          )}
          <ThemeToggle />
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="sm:hidden mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 text-sm">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Map
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileOpen(false)}
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            About
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              {session.user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors"
                >
                  Admin
                </Link>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-700 dark:text-zinc-300">{session.user.name}</span>
                <button
                  onClick={() => { signOut({ callbackUrl: '/' }); setMobileOpen(false) }}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
