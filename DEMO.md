# Screen-share walkthrough

A 10–12 minute tour of this project, ordered so the most relevant things land first.
Not a script to read aloud — a running order, with the reasoning behind each stop.

## Before you start

Open three terminals in `tech-blog/` and one browser:

```bash
npm run cms        # terminal 1 — local CMS backend (:8081)
npm run dev        # terminal 2 — the site (:4321)
                   # terminal 3 — kept free for the test run
```

Browser tabs, left to right:

1. **The live site** — the deployed Netlify URL
2. `http://localhost:4321` — the local copy, for anything you need to edit live
3. `http://localhost:4321/admin/` — the CMS (log in is skipped locally)
4. `http://localhost:4321/editing` — the editor's guide
5. The GitHub repo
6. Your editor, with `src/lib/posts.ts` already open

Do a dry run of the publish step once beforehand. The only part that can surprise you is
the CMS backend not running.

**Open on the live URL, not localhost.** The posting asks for "a link to a real, live website" —
lead with the thing they asked for. Drop to localhost only at the CMS step, where the local
backend needs no accounts.

---

## 1. The site itself (90 seconds)

Start on the homepage. Keep it brief — they can see it looks good.

- Toggle **dark mode**. Mention the theme is applied by an inline script before first paint, so
  dark-mode readers never get a white flash.
- Hit **⌘K** and search for "astro". Type, arrow down, press Enter.
- Resize the window narrow to show the **mobile drawer**.

> "Everything you just saw — the drawer and the search dialog — is a native `<dialog>` element.
> Focus trapping, Escape to close, the background going inert: that's the platform, not a library.
> It's more accessible than what I'd write by hand and it costs nothing in bundle size."

---

## 2. The CMS — the part this role is actually about (3 minutes)

This is the centrepiece. The posting asks to "walk us through how someone non-technical could
update it," so make it concrete rather than described.

Switch to the `/admin` tab.

- Point out this is a real editing UI. No terminal, no Git, no code.
- Open an existing post. Show the rich text editor.
- **Create a new post.** Title, excerpt, a tag, a sentence of body. Save it as a draft.
- Switch to the `/editing` tab briefly — "and this is the guide I'd hand to a marketing team."
  Scroll the field reference table and open one FAQ item.
- Go back to `/admin`, move the post to **Ready**, and publish.
- Switch to the site tab, reload. **The post is live.**

> "That's the whole handoff. No developer, no deploy request, no ticket. In production this is
> Netlify Identity — an editor signs in with their email and never sees GitHub."

Then show what just happened on disk: a new `.md` file appeared in `src/content/blog/`.

> "The CMS is a git-based editor, so publishing is a commit. That means every change has an author
> and a timestamp, and anything can be rolled back."

**If they ask about Contentful:** open `src/lib/posts.ts` — see stop 3.

---

## 3. The architecture (2 minutes)

Editor tab, `src/lib/posts.ts`.

> "No page in this site imports a CMS client. They all ask this one module for content, and it
> decides where content comes from: Contentful if API credentials are set, Markdown otherwise.
> Both normalise to the same shape, so switching CMS is a config change, not a refactor."

Then `src/content/config.ts`:

> "And the content itself is type-checked. This Zod schema runs at build time — a missing title or
> a malformed date fails the build with a readable error instead of shipping a broken page. The
> fields in the CMS config mirror this exactly, so the editing UI and the type system describe the
> same content model."

Worth adding, because it is the honest engineering point:

> "The safety property matters more than the type safety: if an editor saves something invalid,
> the build stops and the *currently live site stays up*. The worst case is that their change
> doesn't appear yet — never that visitors see a broken page."

---

## 4. Testing (2 minutes)

Terminal 3:

```bash
npm run test:a11y
```

While it runs, open `tests/a11y.spec.ts`.

> "Every page gets scanned by axe-core in both light and dark mode, plus keyboard tests a scanner
> can't do — skip link, theme persistence, heading order."

Two things to volunteer here, because they show judgment rather than just tooling:

> "This suite found real bugs. The original palette failed WCAG AA contrast in about a dozen
> places — muted text at 3.7:1, and white-on-teal buttons at 3.74 where 4.5 is needed. I moved the
> primary to teal-700 and raised the muted text scale."

> "It also caught a subtle one: scans kept failing on text that looked fine. Elements fade in from
> `opacity: 0`, and axe was sampling mid-animation. I made the scans request reduced motion — which
> then exposed that our reduced-motion path left `animate-fade-up` elements permanently invisible,
> because the animation uses `fill-mode: both`. So the test fix surfaced a real accessibility bug."

---

## 5. Performance (90 seconds)

```bash
npm run build
```

Point at the output, then:

> "The homepage ships about 147 KB of JavaScript — the React runtime plus two islands, search and
> the newsletter form. Everything else is static HTML."

The story worth telling:

> "That number is a test, not a hope. When I added Preline for the FAQ accordion, importing the
> default entry point put 297 KB on *every page* — for one component on one page. The budget test
> caught it. Importing just the accordion module costs 6.5 KB, only on that page. Total JavaScript
> went from 446 KB to 153 KB."

Then show `dist/og/` and open one PNG:

> "Every post also gets a social card generated at build time with satori. No design tool in the
> loop, and the card can never drift out of sync with the title."

---

## 6. Deployment and the form (90 seconds)

Live site tab. Scroll to the newsletter form and subscribe with a real address, then show the
submission landing in **Netlify → Forms**.

> "There's no backend here and no API key in the browser. Netlify registers forms by scanning the
> built HTML — but this signup is a React island that renders in the browser, so the build step
> never sees it. The fix is a hidden static form in the page with matching field names; the island
> posts to that. It's a five-line trick that took reading the docs properly to find."

The judgment point, which is the part worth saying:

> "The form reports three outcomes separately — success, a server error, and the 404 you get on a
> local preview where Netlify's handler doesn't exist. The easy version shows success no matter
> what. I'd rather a visitor know their subscription failed than believe it worked."

Then, if there's interest in the deploy itself:

> "Canonical tags, RSS, the sitemap and the social cards all need the real domain — which Netlify
> only assigns after the first deploy. So it isn't hardcoded: the config reads Netlify's `URL`, and
> falls back to `DEPLOY_PRIME_URL` on preview builds. That means a pull-request preview points at
> itself instead of telling Google it's production."

---

## 7. AI in the workflow (60 seconds)

They will ask. `/about` has a section on it; either open it or just answer.

> "I used Claude Code throughout — scaffolding components, drafting tests, and reviewing markup for
> accessibility. The rule I hold to is that an agent can draft anything, but nothing ships that I
> can't explain line by line.
>
> Where it earned its keep was adversarial: asking it to attack my own test suite surfaced cases I
> wouldn't have written — what happens when the search index fails to load, what a reduced-motion
> user sees, what happens when the CMS returns nothing. Those are all tests in the repo now.
>
> And it's verified, not trusted. A model saying markup is accessible proves nothing; axe-core in
> CI does."

---

## Questions you should expect

**"How would a marketer add a new section, not just a post?"**
Honestly: that is a code change today. The content model covers posts. If they needed flexible
page composition I'd model it as a `page` content type with a blocks field — but I'd push back on
doing it before someone actually needs it, because a flexible block editor is where content models
usually go wrong.

**"Why Astro over Next.js?"**
This is a content site, not an app. Astro's default is zero JavaScript and interactivity is opt-in
per component, which is the right default here. If it were a dashboard I'd answer differently —
and I have one of those too, which is where I'd point for that kind of work.

**"What would you do next?"**
Three things, in order: real Lighthouse CI on pull requests so performance regressions are caught
before merge; visual regression snapshots, because the axe suite catches contrast but not layout;
and pagination on the archive, which is fine at 7 posts and won't be at 70.

**"What's the weakest part?"**
Two, honestly. The archive has no pagination — fine at 7 posts, wrong at 70. And the content model
only covers posts; a marketer who wanted a new landing page would still need me. I'd rather name
those than have you find them.

**"Did you write this or did the AI?"**
Both, and I can show you which parts. Pick any file and I'll walk you through why it's built that
way — that's the honest test of whether I understand it.

**"Tell me about a bug you had to debug."**
Have one ready. The best two from this project:

*The type-checker running out of memory.* `astro check` would hang and then die with a heap
overflow, on a six-post blog. The cause wasn't the site: `tsconfig.json` declared no `include`, so
TypeScript walked the whole project root and tried to parse the 5 MB CMS vendor bundle sitting in
`public/`. Scoping the program to authored source took it from a 45-second crash to 12 seconds.
The lesson is that the error pointed at memory and the cause was configuration.

*A test that passed for the wrong reason.* Three of my four newsletter tests passed; one failed
claiming a valid email was invalid. The island hydrates with `client:visible`, so the field is
interactive as plain HTML *before* React mounts — text typed into it is discarded when React
asserts its own empty state. The three that passed were winning a race, not testing anything. The
fix waits for Astro to drop the island's `ssr` marker. Worth telling because the failing test was
right and my other tests were the unreliable ones.

---

## If something breaks live

- **`/admin` shows "Loading the content editor…"** — the local backend isn't running.
  `npm run cms` in another terminal, then reload.
- **The live `/admin` won't sign you in** — Netlify Identity or Git Gateway isn't enabled. Don't
  debug it on the call; switch to the localhost tab, where the CMS needs no accounts at all.
- **A test fails** — good. Read the error out loud and talk through what it's telling you. Reading
  a failure calmly reads better than a green run.
- **The dev server is stale** — `npm run build && npm run preview` serves the real production
  output on the same port.
