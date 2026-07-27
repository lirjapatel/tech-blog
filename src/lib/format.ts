/**
 * Date formatting helpers.
 *
 * Everything is formatted in UTC on purpose. Frontmatter dates like
 * `2026-06-18` parse as UTC midnight, so formatting them in the *build
 * machine's* local zone renders "June 17" anywhere west of Greenwich — the
 * published date would silently shift depending on who ran the build.
 */

const formatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' })

const LONG = formatter({ month: 'long', day: '2-digit', year: 'numeric' })
const SHORT = formatter({ month: 'short', day: '2-digit', year: 'numeric' })

/** e.g. "June 18, 2026" — used in article headers. */
export const formatDateLong = (value: string | Date): string => LONG.format(new Date(value))

/** e.g. "Jun 18, 2026" — used on cards and listings. */
export const formatDateShort = (value: string | Date): string => SHORT.format(new Date(value))

/** The `datetime` attribute value for a <time> element. */
export const toISODate = (value: string | Date): string => new Date(value).toISOString()

/** The year a post belongs to, in UTC, for archive grouping. */
export const getYear = (value: string | Date): number => new Date(value).getUTCFullYear()
