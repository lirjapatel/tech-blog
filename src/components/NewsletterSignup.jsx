import { useState } from 'react'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!emailRegex.test(email)) {
      setStatus('error')
      return
    }
    setStatus('loading')
    // Demo island: swap this timeout for a POST to your list provider.
    setTimeout(() => {
      setStatus('success')
      setEmail('')
    }, 800)
  }

  if (status === 'success') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-success">
          <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="font-semibold text-base-content">You&apos;re on the list.</p>
          <p className="mt-1 text-sm text-base-content/70">
            New essays on frontend, AI, and performance — no noise.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form className="w-full" onSubmit={handleSubmit} aria-live="polite" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="input input-bordered w-full bg-base-100/70"
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (status === 'error') setStatus('idle')
          }}
          aria-invalid={status === 'error'}
          aria-label="Email address"
        />
        <button className="btn btn-primary shrink-0" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            'Subscribe'
          )}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-2 text-xs font-medium text-error">
          Please enter a valid email address.
        </p>
      )}
      <p className="mt-3 text-xs text-base-content/70">
        Roughly monthly. Unsubscribe anytime.
      </p>
    </form>
  )
}
