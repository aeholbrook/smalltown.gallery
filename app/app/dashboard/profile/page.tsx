import { auth } from '@/lib/auth'
import { ChangePasswordForm } from '@/components/dashboard/ChangePasswordForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile — Small Town Documentary',
}

export default async function ProfilePage() {
  const session = await auth()

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        Profile
      </h1>
      <div className="max-w-lg space-y-6">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Account Info
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Name
              </p>
              <p className="text-zinc-900 dark:text-white">
                {session?.user?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Email
              </p>
              <p className="text-zinc-900 dark:text-white">
                {session?.user?.email || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Role
              </p>
              <p className="text-zinc-900 dark:text-white">
                {session?.user?.role || 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Change Password
          </h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
