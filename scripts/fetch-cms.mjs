#!/usr/bin/env node
/**
 * Vendors the Decap CMS bundle into `public/admin/`.
 *
 * Why not just load it from a CDN? Two reasons:
 *   1. /admin keeps working if the CDN has a bad day.
 *   2. The version is pinned here rather than floating on a `@latest` tag.
 *
 * Why not commit the 4.9 MB file? It is a build artefact, not source. This
 * script runs on `predev` and `prebuild`, so it is always present when needed
 * and never bloats the repository.
 *
 * A failed download is a warning, not an error — a network hiccup should never
 * take down a deploy of the public site over an admin-only asset.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const VERSION = '3.15.1'
const SOURCE = `https://unpkg.com/decap-cms@${VERSION}/dist/decap-cms.js`
const TARGET = path.join(process.cwd(), 'public', 'admin', 'decap-cms.js')

const exists = async (file) => {
  try {
    const stat = await fs.stat(file)
    return stat.size > 0
  } catch {
    return false
  }
}

if (await exists(TARGET)) {
  console.log(`[cms] decap-cms.js already vendored — skipping download.`)
  process.exit(0)
}

console.log(`[cms] Fetching decap-cms@${VERSION}…`)

try {
  const response = await fetch(SOURCE)
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)

  await fs.mkdir(path.dirname(TARGET), { recursive: true })
  await fs.writeFile(TARGET, Buffer.from(await response.arrayBuffer()))

  const { size } = await fs.stat(TARGET)
  console.log(`[cms] Vendored decap-cms.js (${(size / 1024 / 1024).toFixed(2)} MB).`)
} catch (error) {
  console.warn(
    `[cms] Could not download Decap CMS: ${error.message}\n` +
      `[cms] The site will build fine; /admin will show a loading message until this succeeds.`,
  )
}
