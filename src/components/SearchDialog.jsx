import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/**
 * Client-side search, shipped as a React island.
 *
 * The index is *not* embedded in the page — it is fetched from
 * `/search-index.json` the first time the dialog opens. Readers who never
 * search pay nothing for it, which keeps the static HTML small.
 *
 * Built on the native <dialog> element so focus trapping, Escape-to-close and
 * inert background content come from the platform rather than a custom
 * focus-trap implementation.
 */

const MAX_RESULTS = 8

/** Ranks a post against a query. Higher is better; 0 means "no match". */
const score = (post, query) => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return 0

  const title = post.title.toLowerCase()
  const tags = post.tags.join(' ').toLowerCase()
  const excerpt = post.excerpt.toLowerCase()
  const text = post.text.toLowerCase()

  let total = 0
  for (const term of terms) {
    let termScore = 0
    if (title.startsWith(term)) termScore += 12
    else if (title.includes(term)) termScore += 8
    if (tags.includes(term)) termScore += 5
    if (excerpt.includes(term)) termScore += 3
    if (text.includes(term)) termScore += 1

    // Every term must appear somewhere, so "astro islands" does not match a
    // post that only mentions Astro.
    if (termScore === 0) return 0
    total += termScore
  }
  return total
}

/** Splits text around a query match so the hit can be visually highlighted. */
const highlight = (text, query) => {
  const term = query.trim().split(/\s+/)[0]
  if (!term) return [text]
  const index = text.toLowerCase().indexOf(term.toLowerCase())
  if (index === -1) return [text]
  return [
    text.slice(0, index),
    <mark key="hit" className="rounded bg-primary/20 px-0.5 text-inherit">
      {text.slice(index, index + term.length)}
    </mark>,
    text.slice(index + term.length),
  ]
}

export default function SearchDialog() {
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState(null)
  const [loadState, setLoadState] = useState('idle')
  const [activeIndex, setActiveIndex] = useState(0)

  const loadIndex = useCallback(async () => {
    if (posts || loadState === 'loading') return
    setLoadState('loading')
    try {
      const response = await fetch('/search-index.json')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setPosts(await response.json())
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }, [posts, loadState])

  const openDialog = useCallback(() => {
    loadIndex()
    setOpen(true)
  }, [loadIndex])

  const closeDialog = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActiveIndex(0)
  }, [])

  // Sync React state with the native dialog's imperative API.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      inputRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Global triggers: the header button, ⌘K / Ctrl+K, and "/".
  useEffect(() => {
    const onTriggerClick = (event) => {
      if (event.target.closest('[data-search-open]')) {
        event.preventDefault()
        openDialog()
      }
    }

    const onKeyDown = (event) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      const target = event.target
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (isShortcut || (event.key === '/' && !isTyping)) {
        event.preventDefault()
        openDialog()
      }
    }

    document.addEventListener('click', onTriggerClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onTriggerClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openDialog])

  const results = useMemo(() => {
    if (!posts || !query.trim()) return []
    return posts
      .map((post) => ({ post, rank: score(post, query) }))
      .filter((entry) => entry.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, MAX_RESULTS)
      .map((entry) => entry.post)
  }, [posts, query])

  useEffect(() => setActiveIndex(0), [query])

  // Keep the highlighted option scrolled into view during keyboard navigation.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const onInputKeyDown = (event) => {
    if (results.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      window.location.href = `/blog/${results[activeIndex].slug}/`
    }
  }

  const hasQuery = query.trim().length > 0

  return (
    <dialog
      ref={dialogRef}
      className="search-dialog"
      aria-label="Search articles"
      onClose={closeDialog}
      onClick={(event) => {
        // Clicking the backdrop (the dialog element itself) closes it.
        if (event.target === dialogRef.current) closeDialog()
      }}
    >
      <div className="search-panel">
        <div className="flex items-center gap-3 border-b border-base-content/10 px-5 py-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-base-content/70" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-base outline-none placeholder:text-base-content/70"
            placeholder="Search articles…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-activedescendant={results.length > 0 ? `search-result-${activeIndex}` : undefined}
            aria-label="Search articles"
          />
          <button type="button" className="search-esc" onClick={closeDialog}>
            Esc
          </button>
        </div>

        <div className="max-h-[min(60vh,26rem)] overflow-y-auto p-2" ref={listRef}>
          {loadState === 'loading' && (
            <p className="px-4 py-8 text-center text-sm text-base-content/70">Loading index…</p>
          )}

          {loadState === 'error' && (
            <p className="px-4 py-8 text-center text-sm text-error">
              Search index failed to load. Try refreshing the page.
            </p>
          )}

          {loadState === 'ready' && !hasQuery && (
            <p className="px-4 py-8 text-center text-sm text-base-content/70">
              Type to search {posts?.length ?? 0} articles by title, tag, or content.
            </p>
          )}

          {loadState === 'ready' && hasQuery && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-base-content/70">
              No articles match “{query}”.
            </p>
          )}

          {results.length > 0 && (
            <ul id="search-results" role="listbox" aria-label="Search results">
              {results.map((post, index) => (
                <li key={post.slug} role="presentation">
                  <a
                    id={`search-result-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={index === activeIndex}
                    href={`/blog/${post.slug}/`}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`block rounded-xl px-4 py-3 transition-colors ${
                      index === activeIndex ? 'bg-primary/10' : ''
                    }`}
                  >
                    <p className="font-display text-base font-semibold leading-snug">
                      {highlight(post.title, query)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-base-content/75">{post.excerpt}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-base-content/70">
                      <span>{post.readingTime}</span>
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-base-content/5 px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-base-content/10 px-5 py-3 text-xs text-base-content/70">
          <span className="flex items-center gap-3">
            <span>
              <kbd className="search-kbd">↑</kbd> <kbd className="search-kbd">↓</kbd> navigate
            </span>
            <span>
              <kbd className="search-kbd">↵</kbd> open
            </span>
          </span>
          <span aria-live="polite">
            {hasQuery ? `${results.length} result${results.length === 1 ? '' : 's'}` : ''}
          </span>
        </div>
      </div>
    </dialog>
  )
}
