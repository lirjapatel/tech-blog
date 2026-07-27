export const SITE = {
  title: 'Lirja Patel',
  tagline: 'Field notes on frontend, AI, and shipping fast, calm software.',
  description:
    'A frontend engineer writing about React, Astro, AI product design, performance, and cloud deployment — with the messy details left in.',
  // Update this to your production URL (used for RSS, sitemap, and canonical tags).
  url: 'https://lirja-tech-blog.netlify.app',
  author: 'Lirja Patel',
  role: 'Frontend Developer',
  email: 'patellirja@gmail.com',
  bio: 'I build interactive, content-driven web experiences — AI assistants, data dashboards, and fast static sites. I care about interfaces that feel calm, load instantly, and hold up under real data.',
  social: {
    github: 'https://github.com/lirjapatel',
    linkedin: 'https://www.linkedin.com/in/lirja-patel-7178b0276',
  },
} as const

export const NAV = [
  { label: 'Writing', href: '/#writing' },
  { label: 'Topics', href: '/#topics' },
  { label: 'About', href: '/about' },
] as const
