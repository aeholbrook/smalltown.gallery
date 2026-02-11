'use client'

import { useActionState, useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { updatePhotographerProfile } from '@/lib/actions/profile'

type ProfileEditorProps = {
  bio: string | null
  website: string | null
  location: string | null
  profilePhotoUrl: string | null
}

const INITIAL_STATE = { error: null, success: false }

export function ProfileEditorForm({
  bio,
  website,
  location,
  profilePhotoUrl,
}: ProfileEditorProps) {
  const [state, action, pending] = useActionState(updatePhotographerProfile, INITIAL_STATE)
  const [bioValue, setBioValue] = useState(bio || '')
  const [websiteValue, setWebsiteValue] = useState(website || '')
  const [locationValue, setLocationValue] = useState(location || '')
  const [photoUrl, setPhotoUrl] = useState(profilePhotoUrl || '')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  async function uploadProfilePhoto(file: File) {
    setUploadError(null)
    setUploadingPhoto(true)
    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/upload/profile-photo', {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload profile photo')
      }
      setPhotoUrl(data.profilePhotoUrl)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="bio" value={bioValue} />
      <input type="hidden" name="website" value={websiteValue} />
      <input type="hidden" name="location" value={locationValue} />
      <input type="hidden" name="profilePhotoUrl" value={photoUrl} />

      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && !pending && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          Profile updated.
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Profile Photo</p>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">No photo</div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              {uploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl('')}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <X size={16} />
                Remove
              </button>
            )}
          </div>
        </div>
        {uploadError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
        )}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadProfilePhoto(file)
            e.currentTarget.value = ''
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Location
          </label>
          <input
            type="text"
            value={locationValue}
            onChange={(e) => setLocationValue(e.target.value)}
            placeholder="City, State"
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Website
          </label>
          <input
            type="url"
            value={websiteValue}
            onChange={(e) => setWebsiteValue(e.target.value)}
            placeholder="https://your-site.com"
            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      <MarkdownEditor
        value={bioValue}
        onChange={setBioValue}
        rows={10}
        label="Photographer Bio"
        placeholder="Tell visitors about your background, process, and the work."
      />

      <button
        type="submit"
        disabled={pending || uploadingPhoto}
        className="rounded-md bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  )
}
