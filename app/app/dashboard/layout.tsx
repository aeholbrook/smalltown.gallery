import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isPending = session.user.role === 'PENDING'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Header />
      {isPending ? (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-8">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
              Account Pending Approval
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Your account is awaiting administrator approval. You&apos;ll be able to
              access the dashboard once your account has been activated.
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row">
            <aside className="w-full lg:w-56 shrink-0">
              <DashboardNav />
            </aside>
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      )}
    </div>
  )
}
