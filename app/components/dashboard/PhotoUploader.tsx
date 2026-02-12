'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Loader2 } from 'lucide-react'
import { formatBytes } from '@/lib/utils'

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
const MAX_FALLBACK_BYTES = 4.5 * 1024 * 1024
const MAX_DIMENSION = 6000

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

async function readErrorMessage(response: Response, fallback: string) {
  const bodyText = await response.text()
  if (!bodyText) return fallback

  try {
    const parsed = JSON.parse(bodyText) as { error?: string }
    if (parsed?.error) return parsed.error
  } catch {
    // Non-JSON response body (e.g. proxy/body-size error page).
  }

  return bodyText
}

function inferOutputType(inputType: string) {
  if (inputType === 'image/jpeg' || inputType === 'image/webp') return inputType
  return 'image/jpeg'
}

function renameForType(name: string, type: string) {
  const base = name.replace(/\.[^.]+$/, '')
  if (type === 'image/webp') return `${base}.webp`
  if (type === 'image/png') return `${base}.png`
  return `${base}.jpg`
}

function blobFromCanvas(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

async function resizeImageForLimit(
  file: File,
  maxBytes: number
): Promise<{ file: File; width: number; height: number; changed: boolean }> {
  const originalDims = await getImageDimensions(file)
  if (!originalDims.width || !originalDims.height) {
    return { file, width: 0, height: 0, changed: false }
  }

  const outputType = inferOutputType(file.type)
  const qualitySteps = outputType === 'image/webp' ? [0.9, 0.82, 0.74, 0.66, 0.58] : [0.9, 0.82, 0.74, 0.66, 0.58, 0.5]

  const imgUrl = URL.createObjectURL(file)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to read image'))
    img.src = imgUrl
  })

  let width = originalDims.width
  let height = originalDims.height
  if (Math.max(width, height) > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height)
    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    URL.revokeObjectURL(imgUrl)
    return { file, width: originalDims.width, height: originalDims.height, changed: false }
  }

  let candidateFile = file
  let changed = false

  for (let downscalePass = 0; downscalePass < 6; downscalePass++) {
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    for (const quality of qualitySteps) {
      const blob = await blobFromCanvas(canvas, outputType, quality)
      if (!blob) continue

      const renamed = renameForType(file.name, outputType)
      const nextFile = new File([blob], renamed, { type: outputType, lastModified: Date.now() })
      candidateFile = nextFile
      changed = changed || nextFile.size !== file.size || nextFile.type !== file.type || width !== originalDims.width || height !== originalDims.height

      if (nextFile.size <= maxBytes) {
        URL.revokeObjectURL(imgUrl)
        return { file: nextFile, width, height, changed }
      }
    }

    width = Math.max(1, Math.round(width * 0.85))
    height = Math.max(1, Math.round(height * 0.85))
  }

  URL.revokeObjectURL(imgUrl)
  return { file: candidateFile, width, height, changed }
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
        (f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/webp')
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
        let uploadFile = file
        let dims = await getImageDimensions(file)

        if (uploadFile.size > MAX_UPLOAD_BYTES) {
          setProgress(`Resizing ${file.name} for upload...`)
          const resized = await resizeImageForLimit(uploadFile, MAX_UPLOAD_BYTES)
          uploadFile = resized.file
          dims = { width: resized.width, height: resized.height }
        }

        try {
          // Sign, then upload directly to R2 from the browser to bypass server body limits.
          setProgress(`Preparing upload for ${uploadFile.name}...`)
          const signRes = await fetch('/api/upload/r2/sign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              filename: uploadFile.name,
              contentType: uploadFile.type,
              size: uploadFile.size,
            }),
          })
          if (!signRes.ok) {
            const message = await readErrorMessage(
              signRes,
              `Failed to prepare upload for ${file.name}`
            )
            throw new Error(message)
          }
          const signData = (await signRes.json()) as {
            uploadUrl: string
            method?: string
            headers?: Record<string, string>
            filename: string
            blobUrl: string
            pathname: string
          }

          setProgress(`Uploading ${uploadFile.name}...`)
          const putRes = await fetch(signData.uploadUrl, {
            method: signData.method || 'PUT',
            headers: signData.headers || { 'Content-Type': uploadFile.type },
            body: uploadFile,
          })
          if (!putRes.ok) {
            throw new Error(`Upload failed for ${uploadFile.name}`)
          }

          uploaded.push({
            filename: signData.filename,
            blobUrl: signData.blobUrl,
            pathname: signData.pathname,
            size: uploadFile.size,
            width: dims.width,
            height: dims.height,
          })
        } catch {
          // Fallback path for environments without direct upload/CORS.
          if (uploadFile.size > MAX_FALLBACK_BYTES) {
            setProgress(`Resizing ${uploadFile.name} for fallback upload...`)
            const fallbackSized = await resizeImageForLimit(uploadFile, MAX_FALLBACK_BYTES)
            uploadFile = fallbackSized.file
            dims = { width: fallbackSized.width, height: fallbackSized.height }
          }

          const form = new FormData()
          form.append('projectId', projectId)
          form.append('width', String(dims.width))
          form.append('height', String(dims.height))
          form.append('file', uploadFile)

          const uploadRes = await fetch('/api/upload/r2', {
            method: 'POST',
            body: form,
          })
          if (!uploadRes.ok) {
            const message = await readErrorMessage(uploadRes, `Upload failed for ${uploadFile.name}`)
            if (uploadFile.size > 5 * 1024 * 1024) {
              throw new Error(
                'Large upload failed. Enable R2 CORS for direct uploads (PUT from your app domain), then retry.'
              )
            }
            throw new Error(message)
          }
          const uploadData = (await uploadRes.json()) as {
            filename: string
            blobUrl: string
            pathname: string
            size: number
            width: number
            height: number
          }

          uploaded.push({
            filename: uploadData.filename,
            blobUrl: uploadData.blobUrl,
            pathname: uploadData.pathname,
            size: uploadFile.size || uploadData.size,
            width: dims.width || uploadData.width,
            height: dims.height || uploadData.height,
          })
        }
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
          JPEG, PNG, or WebP. Oversized files are auto-resized before upload.
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
