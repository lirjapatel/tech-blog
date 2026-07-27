/**
 * Deterministic cover art.
 *
 * Rather than asking editors to source an image for every post, each post
 * derives a gradient from its first tag. Known tags get a hand-picked pair;
 * anything new gets a stable hue from a string hash, so a brand-new tag still
 * looks intentional and never changes between builds.
 */

const PALETTES: Record<string, [string, string]> = {
  AI: ['#6366F1', '#8B5CF6'],
  React: ['#0EA5E9', '#22D3EE'],
  Product: ['#FB7185', '#F59E0B'],
  Security: ['#EF4444', '#F43F5E'],
  'Data Viz': ['#14B8A6', '#22C55E'],
  Astro: ['#8B5CF6', '#D946EF'],
  Performance: ['#F59E0B', '#F97316'],
  Frontend: ['#0D9488', '#06B6D4'],
  Contentful: ['#2563EB', '#0EA5E9'],
  CMS: ['#0EA5E9', '#6366F1'],
  DX: ['#10B981', '#14B8A6'],
  Deployment: ['#0D9488', '#10B981'],
  Netlify: ['#14B8A6', '#22D3EE'],
  DevOps: ['#64748B', '#0D9488'],
  Architecture: ['#7C3AED', '#6366F1'],
  Accessibility: ['#8B5CF6', '#0EA5E9'],
  Testing: ['#F43F5E', '#8B5CF6'],
}

const hueFrom = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) % 360
  return hash
}

export const coverGradient = (tags: string[] = []): { from: string; to: string; label: string } => {
  const label = tags[0] ?? 'Notes'
  const preset = PALETTES[label]
  if (preset) return { from: preset[0], to: preset[1], label }

  const hue = hueFrom(label)
  return {
    from: `hsl(${hue} 70% 55%)`,
    to: `hsl(${(hue + 42) % 360} 72% 48%)`,
    label,
  }
}
