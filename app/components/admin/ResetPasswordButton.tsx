'use client'

import { useActionState, useState } from 'react'
import { generateResetToken } from '@/lib/actions/auth'
import { KeyRound, Copy, Check } from 'lucide-react'

interface ResetPasswordButtonProps {
  userId: string
  userName: string
}

export function ResetPasswordButton({ userId, userName }: ResetPasswordButtonProps) {
  const [state, action, pending] = useActionState(generateResetToken, { error: null })
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text for manual copy
    }
  }

  return (
    <div>
      {!state?.resetUrl ? (
        <form action={action}>
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
            title={`Generate password reset link for ${userName}`}
          >
            <KeyRound size={12} />
            {pending ? 'Generating...' : 'Reset Password'}
          </button>
        </form>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-green-600 dark:text-green-400">
            Reset link generated (24hr expiry):
          </p>
          <div className="flex items-center gap-1">
            <code className="flex-1 rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 break-all select-all">
              {state.resetUrl}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(window.location.origin + state.resetUrl!)}
              className="shrink-0 rounded p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              title="Copy full URL"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      {state?.error && (
        <p className="text-xs text-red-500 mt-1">{state.error}</p>
      )}
    </div>
  )
}
