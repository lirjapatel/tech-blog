/** Average adult reading speed for technical prose, in words per minute. */
const WORDS_PER_MINUTE = 220

/** Estimates reading time from plain text. Always at least one minute. */
export const estimateReadingTime = (text: string): string => {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min read`
}

/** Strips Markdown syntax so word counts and search snippets read as prose. */
export const markdownToPlainText = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links keep their text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // heading markers
    .replace(/^\s{0,3}>\s?/gm, '') // blockquote markers
    .replace(/^\s*[-*+]\s+/gm, '') // list bullets
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
