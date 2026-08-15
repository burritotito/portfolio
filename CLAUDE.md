# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start dev server (localhost:3000)
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)

No test suite is configured.

## Next.js version note

This project pins `next@16.3.1`, which is newer than most training data and has breaking changes vs. the Next.js you may know. Per `AGENTS.md`, consult `node_modules/next/dist/docs/` before writing App Router code — e.g. `01-app/02-guides/view-transitions.md` and `01-app/02-guides/upgrading/version-16.md` are directly relevant here (the codebase uses `ViewTransition` from React and the `LayoutProps<"/">` generated type in `app/layout.tsx`).

## Architecture

This is a single-page portfolio/gallery site with one real route plus one orphaned route:

- **`app/page.tsx`** is the actual live implementation: a client component that renders a grid of project covers and, on click, an anchored detail overlay (description + supporting images positioned relative to the clicked tile's `DOMRect`, expanding down/right or up/left depending on which quadrant of the viewport the tile is in). Selecting a project pushes `/work/<slug>` via `window.history.pushState` and reads it back on `popstate` — there is no server-side routing for project detail views; everything happens client-side on `/`. It currently implements only two of the three confirmed interaction states (overview, expanded) — see "Confirmed interaction model" below.
- **`data/projects.ts`** is the single source of truth for content: an array of `Project` objects (`id`, `slug`, `title`, `categories`, `cover`, optional `description`/`images`). Category filter pills on the homepage are derived from this array (`Array.from(new Set(projects.flatMap(p => p.categories)))`). Many entries are commented out — that's the mechanism for hiding a project without deleting its data; `create-folders.sh` lists every project slug (including hidden ones) and creates its `public/work/<slug>/` image folder.
- **`app/work/[slug]/page.tsx`** exists as a route but its current contents are a near-duplicate of the homepage grid (it never reads `params`). It is not the detail view — don't assume this file renders project details; check `app/page.tsx`'s overlay logic instead. Its intended long-term role (direct-link/hard-refresh fallback vs. something else) is an open decision — do not delete or rebuild it without explicit approval.
- **`components/GridTile.tsx`, `components/ProjectOverlay.tsx`, `components/ProjectDetail.tsx`, `components/canvas-types.ts`** are **not imported by any route** — `app/page.tsx` reimplements grid+overlay logic inline instead. They're most likely unfinished work toward the `focused` interaction state (they contain the `Mode`/`Rect` types and the Motion `layoutId` shared-element-hero logic that the live route is missing), not a separate/rejected design. Treat as dead code unless a task specifically asks to wire them in; don't assume editing them affects the live site.
- **Images** live under `public/work/<slug>/` as flat numbered files (`01.jpg`, `02.png`, `01.jpeg`, ...) referenced directly by path in `data/projects.ts`; there's no image-processing pipeline or automatic discovery yet — only one project (`12-buckle`) has a manual `images` array, and it's currently stale (lists 3 of the 6 files actually in its folder). See `PROJECT_CONTEXT.md` for the in-progress repo-wide discovery task.
- Styling is Tailwind v4 (via `@tailwindcss/postcss`, `@theme inline` in `app/globals.css`) with a minimal light/dark palette; components use small hand-rolled Motion (`motion/react`) variants for fades/stagger rather than a shared animation utility.

## Design constraints (durable — confirmed decisions from prior sessions)

- **Stack:** Next.js App Router, Tailwind, and the existing `motion` package's established import pattern. Do not add `framer-motion` as a second dependency.
- **Aesthetic:** minimal, whitespace-driven, editorial — referencing high-end fashion/creative-studio portfolio sites (Renell Medrano's site was the specific reference for the ticked-ruler header and numbered index grid). Small, restrained thumbnails with generous surrounding space is the point; anything that makes images bigger or busier is moving away from the brief.
- **Ruler/header:** the ruler is a plain CSS `repeating-linear-gradient` tick bar (`components/Ruler.tsx`), not SVG. Header row is name / category-nav-or-back-link / "Information", full-width, outside the centered content frame. Must remain unchanged.
- **Grid target spec:** centered frame (`width: min(68vw, 1280px); max-width: calc(100vw - 48px)`), exactly 4 columns, explicit row-divided height (not shrink-to-fit), numbers absolutely positioned at each cell's upper-left, thumbnails centered in the cell at their **natural aspect ratio** (`clamp(55px, 5vw, 90px)`, no `object-cover`, no forced 3:4, no grey placeholder box). **The live grid in `app/page.tsx` does not currently match this spec** (it uses responsive 2/3/4 columns, forced `aspect-[3/4]` + `object-cover`, and in-flow numbers) — this is a known regression/gap, not the target. See `PROJECT_CONTEXT.md`.
- **Category filtering:** non-matching projects fade to `opacity: 0` with pointer-events disabled; they are never removed from the DOM/layout, and positions/numbers must never reflow on filter change. This part is already correctly implemented in `app/page.tsx`.
- **Confirmed interaction model** — overview → expanded (click a project) → focused (click the in-place cover, or a supporting image): in *expanded*, the clicked cover stays pixel-identical to its grid position/size, everything else fades out, description/gallery direction mirror based on which viewport quadrant the cover is in. In *focused*, the clicked image grows into a hero via a shared Motion `layoutId`; everything else becomes a small side gallery. This only works because all three states live in one persistent component tree — do not restructure this back across separate routes/pages. Closing steps back one level at a time; the header's "← Overview" link is the one exception that jumps straight to overview. `history.pushState` to `/work/[slug]` on open is for shareability/back-forward support, not a real route navigation for the click path.
- **No invented project descriptions/content.** Several projects intentionally have no description yet; don't fill them in speculatively. Edit `data/projects.ts` narrowly for a specific reason — don't reformat or reorder wholesale.

## Known gotchas

- **Extension mismatches are silent.** `.jpg` in `data/projects.ts` vs. an actual `.png`/`.jpeg` file produces a broken image with no build/type error. Always verify the real file extension.
- **Turbopack can lose track of new files.** Adding/moving files mid-session can produce false "module not found" errors even when the file is correct. Fix: restart the dev server, and in stubborn cases delete `.next` first — not a code bug.
- **Cascading TypeScript errors usually mean one structural issue near the first error**, not many separate bugs. Check the earliest reported location in the raw file directly before trusting the full error list.
- **`next/image`'s optimizer was unreliable in this environment** (persistent broken/blank thumbnails, never fully root-caused). Working fix where it's still used: `unoptimized` + explicit `width`/`height` (not `fill`). Most of the app has since moved to plain `<img>` tags specifically to avoid re-triggering this — don't reintroduce `next/image` broadly without cause.
- **A plain `<a href>`, even wrapped in `motion.a`, forces a full page reload** — Motion's wrapper doesn't grant client-side routing. Use `next/link`'s `<Link>`, or manual `pushState` + `preventDefault()`.
- **`react-hooks/refs` lint rule** flags reading `ref.current.getBoundingClientRect()` directly in a render body — do it inside an effect or event handler and store the result in state.
- **`react-hooks/set-state-in-effect` lint rule**, plus a related real bug: calling one `setState` nested inside a *different* `setState`'s functional-updater callback produced an actual React warning. Keep state updates as plain sequential calls, not nested inside another updater. (This rule is currently failing lint at `app/page.tsx:36` — see `PROJECT_CONTEXT.md`.)

## Rejected approaches — do not reintroduce

- Real page navigation (separate `/work/[slug]` route reached via normal link clicks) as the primary click-through experience — always felt like "a new page," the explicit thing being avoided from the start.
- React's native View Transitions API (`<ViewTransition name=...>`) for a shared-element morph across a route navigation — implemented correctly per docs, compiled cleanly, but never visibly animated, cause undiagnosed. Replaced by Motion's `layoutId` within a single component tree. Don't re-suggest View Transitions as "the fix" without knowing this was already tried.
- A full-screen overlay that grew the clicked image into a larger, repositioned box elsewhere on screen (`ExpandedProject.tsx`, since deleted) — the key image must stay exactly the same size/position it had in the grid.
- Filtering that removes non-matching projects from the rendered array — caused reflow/renumbering. Replaced with opacity/pointer-events toggling on a permanently-rendered full list.
- Computing thumbnail size by dividing available space by row/column count to force everything onto one screen — produced oversized, inelegant thumbnails. Whitespace should come from generously-sized cells, not images stretching to fill them.
- A single shared gap constant for both the description offset and the image-to-image gallery offset — produced a visibly inconsistent gap. Use separate constants (smaller for image-to-image, larger for the description).
