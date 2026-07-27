import { useId, useState } from 'react'

/**
 * Newsletter signup, submitted to Netlify Forms.
 *
 * There is no backend and no third-party API key in the browser: Netlify
 * intercepts a POST containing `form-name` and files the submission against the
 * static form declared in `index.astro`. That declaration has to exist in the
 * *built HTML* for Netlify's build step to find it, which is why a
 * client-rendered island cannot register a form on its own.
 *
 * Netlify's form handler only exists on a deployed site, so a local preview
 * server answers 404/405. That is reported as its own state rather than being
 * dressed up as either success or a real error.
 */

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FORM_NAME = 'newsletter'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const inputId = useId()
  const messageId = useId()

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!emailPattern.test(email)) {
      setStatus('invalid')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': FORM_NAME,
          email,
          // Honeypot: real people leave this empty, bots fill it in.
          'bot-field': '',
        }).toString(),
      })

      if (response.ok) {
        setStatus('success')
        setEmail('')
      } else if (response.status === 404 || response.status === 405) {
        setStatus('unavailable')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-5"
        role="status"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          className="mt-0.5 shrink-0 text-success"
          aria-hidden="true"
        >
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <p className="font-semibold text-base-content">You&apos;re on the list.</p>
          <p className="mt-1 text-sm text-base-content/75">
            New essays on frontend, AI, and performance — no noise.
          </p>
        </div>
      </div>
    )
  }

  const isLoading = status === 'loading'

  return (
    <form className="w-full" onSubmit={handleSubmit} noValidate>
      <label className="sr-only" htmlFor={inputId}>
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          className="input input-bordered w-full bg-base-100/70"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (status !== 'idle' && status !== 'loading') setStatus('idle')
          }}
          aria-invalid={status === 'invalid'}
          aria-describedby={status === 'idle' ? undefined : messageId}
          disabled={isLoading}
        />
        <button className="btn btn-primary shrink-0" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm" aria-hidden="true" />
              <span className="sr-only">Subscribing…</span>
            </>
          ) : (
            'Subscribe'
          )}
        </button>
      </div>

      {/*
        One live region for every outcome. Screen readers announce changes here
        without focus moving, so the result is never silent.
      */}
      <p id={messageId} role="status" className="mt-2 min-h-[1.25rem] text-xs font-medium">
        {status === 'invalid' && (
          <span className="text-error">Please enter a valid email address.</span>
        )}
        {status === 'error' && (
          <span className="text-error">
            Something went wrong. Please try again, or email me directly.
          </span>
        )}
        {status === 'unavailable' && (
          <span className="text-base-content/75">
            Subscriptions run through Netlify Forms, which only exists on the deployed site — not on
            this local preview.
          </span>
        )}
      </p>

      <p className="mt-2 text-xs text-base-content/75">Roughly monthly. Unsubscribe anytime.</p>
    </form>
  )
}
