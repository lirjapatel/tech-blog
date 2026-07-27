export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  tags: string[]
  publishedAt: string
  readingTime: string
  cover?: string | null
  featured?: boolean
}
