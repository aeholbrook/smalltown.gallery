'use client'

import { useState } from 'react'
import { MarkdownRenderer } from './markdown-renderer'
import { MARKDOWN_GUIDE } from '@/lib/markdown'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  rows?: number
  className?: string
  showGuide?: boolean
}

/**
 * Markdown editor with live preview
 * Photographers can write in markdown with real-time preview
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content here... (Markdown supported)',
  label,
  rows = 10,
  className,
  showGuide = true,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <div className="flex gap-2">
            {showGuide && (
              <button
                type="button"
                onClick={() => setShowGuideModal(!showGuideModal)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Markdown Guide
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-blue-900">Markdown Quick Guide</h4>
            <button
              onClick={() => setShowGuideModal(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
          <div className="text-gray-700 space-y-2 text-xs">
            <p><strong>Bold:</strong> **text** or __text__</p>
            <p><strong>Italic:</strong> *text* or _text_</p>
            <p><strong>Link:</strong> [link text](https://example.com)</p>
            <p><strong>Heading:</strong> # Heading 1, ## Heading 2, ### Heading 3</p>
            <p><strong>List:</strong> Start line with - or 1. for bullet/numbered lists</p>
            <p><strong>Quote:</strong> Start line with &gt;</p>
          </div>
        </div>
      )}

      {showPreview ? (
        <div className="min-h-[200px] border border-gray-300 rounded-lg p-4 bg-white">
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-gray-400 italic">Nothing to preview yet...</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            'w-full px-4 py-3 border border-gray-300 rounded-lg',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'resize-y font-mono text-sm',
            'placeholder:text-gray-400'
          )}
        />
      )}

      {!showPreview && value && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{value.length} characters</span>
          <span>{value.split(/\s+/).length} words</span>
        </div>
      )}
    </div>
  )
}
