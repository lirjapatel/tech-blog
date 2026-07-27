import type { BlogPost } from '../types'

export const mockPosts: BlogPost[] = [
  {
    id: 'post-ai-assistant',
    title: 'Building an AI assistant recruiters actually use',
    slug: 'ai-portfolio-assistant',
    excerpt:
      'A portfolio chatbot is easy to build and easy to get wrong. Here is the architecture I landed on — grounded answers, a safe fallback, and a UI that respects the visitor.',
    tags: ['AI', 'React', 'Product'],
    publishedAt: '2026-06-18',
    readingTime: '8 min read',
    featured: true,
    cover: null,
    body: `
      <p>Most portfolio chatbots fail the same way: they hallucinate a job history, they stall on a spinner, or they beg for an API key that the visitor will never provide. I wanted the opposite — a small assistant that answers real questions about my work, stays honest about what it does not know, and degrades gracefully when the model is unavailable.</p>

      <h2>Start with the questions, not the model</h2>
      <p>Before writing a line of code I listed the ten questions a recruiter actually asks: <em>What have you shipped? Do you know React? Are you available? What is your strongest project?</em> That list became the assistant's job description. Everything else — model choice, streaming, styling — is downstream of answering those ten questions well.</p>
      <p>The lesson that saved me the most time: an assistant is only as good as the context you feed it. So I wrote a compact, hand-curated context document — a few hundred words of facts about my experience — and made that the single source of truth.</p>

      <h2>Ground every answer</h2>
      <p>The core pattern is retrieval without the ceremony. Instead of a vector database, I pass the curated context directly in the system prompt and instruct the model to answer <strong>only</strong> from it. If the answer is not in the context, the assistant says so.</p>
      <pre><code>const system = [
  'You are Lirja&apos;s portfolio assistant.',
  'Answer ONLY using the CONTEXT below.',
  'If the answer is not in the context, say you are not sure',
  'and point the visitor to the contact page.',
  '',
  'CONTEXT:',
  context,
].join('\\n')</code></pre>
      <p>This one instruction removes the most damaging failure mode. The model can still phrase things naturally, but it cannot invent a degree I never earned.</p>

      <blockquote>An assistant that admits uncertainty earns more trust than one that is confidently wrong.</blockquote>

      <h2>Design for the network you do not control</h2>
      <p>Two states matter more than the happy path: <strong>loading</strong> and <strong>failure</strong>. I stream tokens so the reply feels immediate, and I wrap the request in a timeout with a scripted fallback answer so a dead API never leaves the visitor staring at a spinner.</p>
      <ul>
        <li>Optimistic UI: the user&apos;s message appears instantly, before the request resolves.</li>
        <li>Streaming: partial text renders as it arrives, so perceived latency drops.</li>
        <li>Fallback: if the model call fails, a canned summary answers the top questions anyway.</li>
      </ul>

      <h2>Keep the interface calm</h2>
      <p>The widget is deliberately boring: a rounded panel, three suggested prompts, and a single input. No confetti, no avatars, no fake typing dots that outlast the response. Suggested prompts do double duty — they guide the visitor toward questions the context can actually answer, which quietly raises the hit rate.</p>

      <h2>What I would tell past me</h2>
      <p>Ship the smallest honest version first. The curated-context approach took an afternoon and outperformed a heavier RAG setup I built later, because the corpus was tiny and the questions were predictable. Reach for embeddings when the content grows past what fits comfortably in a prompt — not before.</p>
      <p>The finished assistant is a few components and one careful prompt. It will not pass a Turing test. It does something more useful: it answers the real questions, quickly, without lying.</p>
    `,
  },
  {
    id: 'post-threat-dashboard',
    title: 'Designing a threat dashboard that stays fast under real data',
    slug: 'threat-dashboard-design',
    excerpt:
      'Security data is loud, spiky, and never stops arriving. A dashboard that feels calm at 10 rows and dies at 10,000 is a prototype, not a product.',
    tags: ['Security', 'Data Viz', 'React'],
    publishedAt: '2026-05-29',
    readingTime: '7 min read',
    cover: null,
    body: `
      <p>The demo always looks great. Twenty tidy alerts, a clean chart, everything green. Then real telemetry shows up — thousands of events an hour, half of them noise — and the interface that felt calm starts to stutter. Designing a threat dashboard is mostly the work of staying fast and legible when the data refuses to cooperate.</p>

      <h2>Lead with the decision, not the data</h2>
      <p>Analysts do not open a dashboard to admire it; they open it to answer one question: <em>what needs my attention right now?</em> So the top of the screen is a small row of severity counts and a trend line, sized to be read from across a room. Everything below is progressive detail for when they decide to dig.</p>
      <ul>
        <li>Severity stats first, because they drive the next click.</li>
        <li>A trend line second, because direction matters more than any single number.</li>
        <li>The table last, because it is where investigation happens, not where it begins.</li>
      </ul>

      <h2>Virtualize the table before you need to</h2>
      <p>The single biggest performance win is rendering only the rows in view. A naive table paints every DOM node; a virtualized one paints a couple dozen and swaps them as you scroll. The difference between 12,000 nodes and 30 is the difference between a frozen tab and a smooth one.</p>
      <pre><code>// Only rows intersecting the viewport are mounted.
const virtual = useVirtualizer({
  count: rows.length,
  getScrollElement: () =&gt; parentRef.current,
  estimateSize: () =&gt; 44,
  overscan: 8,
})</code></pre>
      <p>Pair virtualization with stable keys and memoized row components, and the table stays responsive whether it holds 50 rows or 50,000.</p>

      <h2>Filters belong next to the data</h2>
      <p>When filters live in a distant sidebar, analysts lose the thread between what they changed and what moved. Keeping them directly above the table — severity, source, time window — turns filtering into a tight feedback loop instead of a context switch.</p>

      <blockquote>Every pixel of chrome competes with the data for attention. Spend it deliberately.</blockquote>

      <h2>Detail without navigation</h2>
      <p>Clicking an alert should not throw the analyst onto a new page and erase their place. A slide-over detail panel keeps the list visible, so they can triage a dozen events without ever losing context. Back-and-forth navigation is where investigations go to die.</p>

      <h2>Color is a signal, not decoration</h2>
      <p>Severity is the only thing allowed to use saturated color. Everything else stays quiet — muted borders, generous whitespace — so a red critical badge reads instantly. I also test the palette in a color-blind simulator; a dashboard that encodes urgency only in hue fails the people who need it most.</p>

      <h2>The result</h2>
      <p>A layout that scales from a laptop to a wide operations screen, holds tens of thousands of events without dropping frames, and puts the one number that matters where the eye lands first. Fast is a feature — especially when the stakes are security.</p>
    `,
  },
  {
    id: 'post-astro-islands',
    title: 'Astro islands: interactivity without shipping a framework',
    slug: 'astro-react-islands',
    excerpt:
      'Most pages are 95% static and 5% interactive. Astro lets you ship the 5% as hydrated React and send zero JavaScript for the rest.',
    tags: ['Astro', 'Performance', 'Architecture'],
    publishedAt: '2026-05-12',
    readingTime: '6 min read',
    cover: null,
    body: `
      <p>For years the default was to render an entire page with a client-side framework, ship the whole runtime, and hydrate everything — including the paragraphs that will never change. Astro flips the default. Pages are static HTML, and interactivity is opt-in, component by component. The parts that do not move send no JavaScript at all.</p>

      <h2>The mental model: islands in a sea of HTML</h2>
      <p>Think of a page as mostly-static content — the sea — with a few interactive widgets floating in it — the islands. A newsletter form, a search box, a theme toggle. Each island hydrates independently; the sea stays inert and instant.</p>
      <pre><code>&lt;!-- Static: rendered once, ships no JS --&gt;
&lt;PostList posts={posts} /&gt;

&lt;!-- Island: hydrates on load --&gt;
&lt;NewsletterSignup client:load /&gt;</code></pre>

      <h2>Choose a hydration strategy on purpose</h2>
      <p>The <code>client:*</code> directive is where the performance budget lives. Picking the right one per component is most of the craft.</p>
      <ul>
        <li><code>client:load</code> — hydrate immediately. For controls the visitor uses right away.</li>
        <li><code>client:idle</code> — wait for the main thread to breathe. For nice-to-haves.</li>
        <li><code>client:visible</code> — hydrate when it scrolls into view. Perfect for below-the-fold widgets.</li>
        <li><code>client:media</code> — hydrate only at certain breakpoints, like a mobile-only menu.</li>
      </ul>
      <p>A form the visitor might never scroll to does not need to hydrate on load. Moving it to <code>client:visible</code> is a free win on both Time to Interactive and total bytes.</p>

      <blockquote>The fastest JavaScript is the JavaScript you never send.</blockquote>

      <h2>Data fetching happens at build time</h2>
      <p>Because content is fetched while the site builds, the browser receives finished HTML — no loading spinners, no client-side round trip to a CMS. Pages arrive as pre-rendered documents that are already complete.</p>
      <pre><code>---
// runs at build time, on the server
const posts = await getAllPosts()
---
&lt;PostGrid posts={posts} /&gt;</code></pre>

      <h2>When islands are the wrong tool</h2>
      <p>Islands shine for content-led sites: blogs, docs, marketing, portfolios. If you are building something that is one giant stateful application — a spreadsheet, a design tool — a single-page app is still the better fit. Architecture should follow the shape of the product, not the other way around.</p>

      <h2>The payoff</h2>
      <p>Readers get pages that are interactive where it counts and instant everywhere else. The static core stays cheap to serve and easy to cache, while React shows up only in the few places that genuinely need it. That balance — flexible for you, fast for them — is the whole reason to reach for islands.</p>
    `,
  },
  {
    id: 'post-web-vitals',
    title: 'A Core Web Vitals playbook for content sites',
    slug: 'core-web-vitals-playbook',
    excerpt:
      'LCP, CLS, and INP are not mysterious. They map to three concrete questions about your page — and each has a short list of fixes that actually move the number.',
    tags: ['Performance', 'Frontend'],
    publishedAt: '2026-04-27',
    readingTime: '7 min read',
    cover: null,
    body: `
      <p>Core Web Vitals sound abstract until you translate them into plain questions. Largest Contentful Paint asks <em>how fast does the main thing show up?</em> Cumulative Layout Shift asks <em>does the page jump around while it loads?</em> Interaction to Next Paint asks <em>does it respond when I tap?</em> Fix the questions and the scores follow.</p>

      <h2>LCP: get the hero on screen fast</h2>
      <p>On a content site the largest element is usually a heading or a cover image. Two changes move this number the most:</p>
      <ul>
        <li><strong>Preconnect and preload</strong> the resources the hero depends on — fonts and the cover image — so the browser starts fetching them early.</li>
        <li><strong>Stop hiding text behind fonts.</strong> Use <code>font-display: swap</code> so words render immediately in a fallback and reflow when the webfont lands.</li>
      </ul>
      <pre><code>&lt;link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /&gt;
&lt;link rel="preload" as="image" href="/hero.avif" /&gt;</code></pre>

      <h2>CLS: reserve space for everything</h2>
      <p>Layout shift is almost always something arriving late and shoving the rest of the page down. The fix is boring and reliable: reserve the space up front.</p>
      <ul>
        <li>Always set <code>width</code> and <code>height</code> (or an <code>aspect-ratio</code>) on images and embeds.</li>
        <li>Give ads, banners, and async widgets a fixed min-height container.</li>
        <li>Prefer transforms over properties that reflow when you animate.</li>
      </ul>

      <blockquote>A page that jumps while you read is a page that lost your trust before the first paragraph.</blockquote>

      <h2>INP: keep the main thread free</h2>
      <p>Interaction latency is a main-thread problem. When a tap fires and the thread is busy parsing or running a long task, the response stalls. Ship less JavaScript, break up long tasks, and defer non-critical work.</p>
      <pre><code>// Yield so the browser can paint the response first.
button.addEventListener('click', async () =&gt; {
  applyVisualFeedback()
  await scheduler.yield?.()
  doExpensiveWork()
})</code></pre>

      <h2>Measure in the field, not just the lab</h2>
      <p>Lighthouse is a controlled lab test; your visitors are on real phones and flaky networks. Watch field data — the numbers real users generate — because that is what search engines rank and what people actually feel. A lab score of 100 that ignores a slow 4G reader is a score that lies.</p>

      <h2>The short version</h2>
      <p>Preload the hero, reserve space for anything that loads late, and stop blocking the main thread. Three habits, applied consistently, will carry a content site to green vitals without a heroic rewrite.</p>
    `,
  },
  {
    id: 'post-contentful-workflow',
    title: 'A calm Contentful workflow editors will not fight',
    slug: 'contentful-content-workflow',
    excerpt:
      'A headless CMS is only as good as its content model. Model it around how editors think, and publishing stops being a negotiation with your codebase.',
    tags: ['Contentful', 'CMS', 'DX'],
    publishedAt: '2026-04-08',
    readingTime: '6 min read',
    cover: null,
    body: `
      <p>The promise of a headless CMS is clean: editors publish content, developers own presentation, and neither blocks the other. The reality depends almost entirely on one thing you decide early — the content model. Get it right and publishing is effortless. Get it wrong and every new post becomes a support ticket.</p>

      <h2>Model the thing, not the page</h2>
      <p>The classic mistake is modeling content as pages full of loose fields — a title here, some raw HTML there. Model the underlying <em>thing</em> instead. A blog post has a title, a slug, an excerpt, a body, tags, and a date. Those fields are true no matter where the post is rendered.</p>
      <ul>
        <li><strong>Title</strong> — short text, required.</li>
        <li><strong>Slug</strong> — the URL segment, unique and validated.</li>
        <li><strong>Body</strong> — rich text, so editors format without touching markup.</li>
        <li><strong>Tags and date</strong> — structured metadata for sorting and filtering.</li>
      </ul>

      <h2>Rich text is data, not a string</h2>
      <p>Contentful stores rich text as a structured document, which means you render it deliberately instead of trusting a blob of HTML. That is a feature: you decide exactly how a heading or a code block looks, and editors cannot break the layout by pasting from a word processor.</p>
      <pre><code>import { documentToHtmlString }
  from '@contentful/rich-text-html-renderer'

const body = fields.body
  ? documentToHtmlString(fields.body)
  : '&lt;p&gt;' + fields.excerpt + '&lt;/p&gt;'</code></pre>

      <h2>Always have a fallback</h2>
      <p>Your site should build even when the CMS is unreachable or the credentials are missing. I keep a small set of local mock posts and fall back to them whenever the client cannot be created. Contributors can run the whole site with zero configuration, and a CMS outage never breaks the build.</p>

      <blockquote>A good content model is invisible. Editors just publish, and the right thing appears.</blockquote>

      <h2>Fetch at build, not at runtime</h2>
      <p>For a blog, content changes far less often than it is read. Fetching posts at build time turns every request into a static file — no runtime API calls, no per-visitor latency, no CMS bill that scales with traffic. When an editor publishes, a webhook rebuilds the site and the new post goes live minutes later.</p>

      <h2>The workflow, end to end</h2>
      <p>An editor writes in Contentful and hits publish. A webhook pings the host. The site rebuilds, fetching the latest entries and rendering them to static HTML. No developer is involved, nothing is redeployed by hand, and readers get a page that loads instantly. That is the calm workflow — everyone doing their job without stepping on each other.</p>
    `,
  },
  {
    id: 'post-deploy-playbook',
    title: 'From localhost to live: a deployment playbook for static sites',
    slug: 'static-site-deployment-playbook',
    excerpt:
      'Shipping a static site should be a five-minute job, not a weekend. Here is the checklist I run every time — build config, environment, cache, and the webhook that keeps it fresh.',
    tags: ['Deployment', 'Netlify', 'DevOps'],
    publishedAt: '2026-03-21',
    readingTime: '6 min read',
    cover: null,
    body: `
      <p>A static site is the easiest thing in the world to deploy and, somehow, still where people lose an afternoon. The trouble is never the hosting — it is the small stuff around it: an environment variable that only exists on your laptop, a cache that serves yesterday&apos;s build, a content update that never triggers a rebuild. Here is the checklist that turns deployment into a five-minute job.</p>

      <h2>1. Make the build reproducible</h2>
      <p>The build must run the same on a clean machine as it does on yours. Pin the Node version, commit the lockfile, and declare the build command and output directory in config the host reads automatically.</p>
      <pre><code>[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"</code></pre>

      <h2>2. Move secrets off your laptop</h2>
      <p>Anything in a <code>.env</code> file needs a home in the host&apos;s environment settings too. The build should degrade gracefully when a secret is missing — falling back to local content rather than crashing — so a forgotten variable is a warning, not a failed deploy.</p>

      <h2>3. Let the platform handle caching</h2>
      <p>Fingerprinted assets — files with a hash in the name — can be cached forever, because a change produces a new filename. HTML should be revalidated so readers always get the latest content. Most static hosts do the right thing by default; the trap is hand-rolling headers that fight them.</p>

      <blockquote>If a content change does not appear live within minutes, the pipeline is broken — no matter how green the build log looks.</blockquote>

      <h2>4. Close the loop with a webhook</h2>
      <p>The final piece is keeping the site fresh without touching code. Create a build hook on the host, then point your CMS at it so publishing an entry triggers a rebuild automatically.</p>
      <ul>
        <li>Generate a build hook URL in the host&apos;s deploy settings.</li>
        <li>Add a webhook in the CMS that fires on publish and unpublish.</li>
        <li>Publish a test post and watch the deploy kick off on its own.</li>
      </ul>

      <h2>5. Ship the boring extras</h2>
      <p>Before calling it done, add the small files that make a site feel finished: a sitemap and <code>robots.txt</code> for search engines, an RSS feed for readers, a custom 404, and sensible security headers. None of them are glamorous; all of them signal a site that was actually shipped, not just deployed.</p>

      <h2>Do it once, then repeat</h2>
      <p>The reason to write the playbook down is that the second site should take five minutes, not another afternoon. Reproducible build, secrets in the environment, caching left to the platform, a webhook to stay fresh, and the boring extras in place — run the list and go live with confidence.</p>
    `,
  },
]
