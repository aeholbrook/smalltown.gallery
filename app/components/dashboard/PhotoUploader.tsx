'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Loader2 } from 'lucide-react'
import { formatBytes } from '@/lib/utils'

function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export function PhotoUploader({ projectId }: { projectId: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState('')

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter(
      (f) =>
        (f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/webp') &&
        f.size <= 20 * 1024 * 1024
    )
    setFiles((prev) => [...prev, ...valid])
    setError(null)
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    setError(null)

    try {
      const uploaded: Array<{
        filename: string
        blobUrl: string
        pathname: string
        size: number
        width: number
        height: number
      }> = []

      for (const file of files) {
        setProgress(`Reading ${file.name}...`)
        const dims = await getImageDimensions(file)

        setProgress(`Uploading ${file.name}...`)
        const form = new FormData()
        form.append('projectId', projectId)
        form.append('width', String(dims.width))
        form.append('height', String(dims.height))
        form.append('file', file)

        const uploadRes = await fetch('/api/upload/r2', {
          method: 'POST',
          body: form,
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || `Upload failed for ${file.name}`)
        }

        uploaded.push({
          filename: uploadData.filename,
          blobUrl: uploadData.blobUrl,
          pathname: uploadData.pathname,
          size: uploadData.size,
          width: uploadData.width,
          height: uploadData.height,
        })
      }

      setProgress(`Saving ${uploaded.length} photo${uploaded.length > 1 ? 's' : ''}...`)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          photos: uploaded,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upload failed')
      } else {
        setFiles([])
        setProgress('')
        router.refresh()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed. Please try again.'
      setError(message)
    } finally {
      setUploading(false)
      setProgress('')
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
        Upload Photos
      </h2>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400 mb-4">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
        }`}
      >
        <Upload
          size={32}
          className="mx-auto text-zinc-400 dark:text-zinc-500 mb-2"
        />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Drag and drop photos here, or click to browse
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          JPEG, PNG, or WebP, max 20MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-md bg-zinc-50 dark:bg-zinc-800 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                onClick={() => removeFile(i)}
                disabled={uploading}
                className="ml-2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {progress}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload {files.length} photo{files.length > 1 ? 's' : ''}
                </>
              )}
            </button>
            {!uploading && (
              <button
                onClick={() => setFiles([])}
                className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
