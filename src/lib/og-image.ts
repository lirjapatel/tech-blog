import fs from 'node:fs/promises'
import path from 'node:path'
import satori from 'satori'
import sharp from 'sharp'
import { SITE } from '../consts'
import { coverGradient } from './cover-art'
import { formatDateLong } from './format'

/**
 * Build-time social card generation.
 *
 * Every post gets a 1200x630 PNG rendered with satori (HTML/CSS -> SVG) and
 * rasterised with sharp. No design tool, no manual export, and the card can
 * never drift out of sync with the post title.
 */

const WIDTH = 1200
const HEIGHT = 630

type FontWeight = 400 | 600 | 700

const fontFile = (weight: FontWeight) =>
  path.join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files', `inter-latin-${weight}-normal.woff`)

let fontCache: { name: string; data: Buffer; weight: FontWeight; style: 'normal' }[] | null = null

const loadFonts = async () => {
  if (fontCache) return fontCache
  const weights: FontWeight[] = [400, 600, 700]
  fontCache = await Promise.all(
    weights.map(async (weight) => ({
      name: 'Inter',
      data: await fs.readFile(fontFile(weight)),
      weight,
      style: 'normal' as const,
    })),
  )
  return fontCache
}

/** Minimal hyperscript so this stays a plain `.ts` file (no JSX pragma needed). */
const h = (type: string, style: Record<string, unknown>, children?: unknown): any => ({
  type,
  props: { style, children },
})

export type OgCardInput = {
  title: string
  tags?: string[]
  readingTime?: string
  publishedAt?: string
  eyebrow?: string
}

export const renderOgImage = async ({
  title,
  tags = [],
  readingTime,
  publishedAt,
  eyebrow,
}: OgCardInput): Promise<Buffer> => {
  const { from, to, label } = coverGradient(tags)

  const meta = [publishedAt ? formatDateLong(publishedAt) : null, readingTime]
    .filter(Boolean)
    .join('  ·  ')

  const markup = h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      padding: '64px 72px',
      backgroundColor: '#141110',
      backgroundImage: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      fontFamily: 'Inter',
    },
    [
      // Top row: tag pill
      h(
        'div',
        { display: 'flex', alignItems: 'center' },
        h(
          'div',
          {
            display: 'flex',
            padding: '10px 24px',
            borderRadius: '999px',
            backgroundColor: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.35)',
            color: '#ffffff',
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '0.04em',
          },
          (eyebrow ?? label).toUpperCase(),
        ),
      ),

      // Title
      h(
        'div',
        {
          display: 'flex',
          color: '#ffffff',
          fontSize: title.length > 68 ? 62 : 76,
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: '-0.03em',
          maxWidth: '95%',
          textShadow: '0 4px 30px rgba(0,0,0,0.25)',
        },
        title,
      ),

      // Bottom row: author + meta
      h(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.3)',
          paddingTop: 28,
        },
        [
          h('div', { display: 'flex', alignItems: 'center' }, [
            h(
              'div',
              {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.92)',
                color: from,
                fontSize: 30,
                fontWeight: 700,
                marginRight: 20,
              },
              SITE.author.charAt(0),
            ),
            h(
              'div',
              { display: 'flex', color: '#ffffff', fontSize: 30, fontWeight: 600 },
              SITE.author,
            ),
          ]),
          h(
            'div',
            { display: 'flex', color: 'rgba(255,255,255,0.85)', fontSize: 26, fontWeight: 400 },
            meta,
          ),
        ],
      ),
    ],
  )

  const svg = await satori(markup, { width: WIDTH, height: HEIGHT, fonts: await loadFonts() })
  return sharp(Buffer.from(svg)).png().toBuffer()
}
