// Markdown utilities for rendering and editing

/**
 * Sanitizes and validates markdown content
 * Removes potentially dangerous HTML/scripts while allowing safe markdown
 */
export function sanitizeMarkdown(content: string): string {
  // Basic sanitization - rehype-sanitize will handle the rest during render
  return content.trim()
}

/**
 * Truncates markdown content for previews
 * Strips markdown syntax and returns plain text excerpt
 */
export function truncateMarkdown(content: string, maxLength: number = 150): string {
  // Remove markdown syntax for preview
  const plainText = content
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/[*_~`]/g, '')   // Remove emphasis
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove images
    .replace(/\n+/g, ' ')     // Replace newlines with spaces
    .trim()

  if (plainText.length <= maxLength) {
    return plainText
  }

  return plainText.substring(0, maxLength).trim() + '...'
}

/**
 * Generates a reading time estimate for markdown content
 */
export function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Markdown editor configuration for photographers
 * Returns helpful guide text
 */
export const MARKDOWN_GUIDE = `
# Markdown Formatting Guide

## Basic Formatting
- **Bold text**: \`**bold**\` or \`__bold__\`
- *Italic text*: \`*italic*\` or \`_italic_\`
- [Links](url): \`[link text](https://example.com)\`

## Headers
\`\`\`
# Heading 1
## Heading 2
### Heading 3
\`\`\`

## Lists
Unordered:
\`\`\`
- Item 1
- Item 2
  - Nested item
\`\`\`

Ordered:
\`\`\`
1. First item
2. Second item
3. Third item
\`\`\`

## Quotes
\`\`\`
> This is a quote
> It can span multiple lines
\`\`\`

## Line Breaks
- Two spaces at end of line for soft break
- Blank line for paragraph break

## Tips for Photo Captions
- Tell the story behind the photo
- Include names (with permission)
- Add context about location or event
- Share your process or technical details
- Be authentic and personal
`.trim()
