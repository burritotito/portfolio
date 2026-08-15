# Project Context (temporary — current task state)

This file tracks in-progress task state and open discrepancies between the confirmed design intent (durable rules now live in `CLAUDE.md`) and the actual repository. Unlike `CLAUDE.md`, this file is expected to go stale/be cleared once the current work lands — don't treat it as a permanent record.

Repo state below was verified 2026-08-15 by direct inspection (not assumed from prior chat history).

## Open discrepancies vs. confirmed design intent — verify before trusting either source

1. **Grid layout regression.** `CLAUDE.md`'s "Grid target spec" (centered 4-col frame, natural-aspect-ratio thumbnails, upper-left absolute numbers) is *not* what's in `app/page.tsx` today. Live code has:
   - `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` (responsive, not fixed 4-column)
   - `aspect-[3/4] w-40 bg-neutral-100 overflow-hidden` + `object-cover` on the thumbnail — this is the forced-crop/grey-box treatment that prior sessions say was explicitly reversed
   - Numbers in normal document flow above the image (`block ... mb-2`), not absolutely positioned at the cell's upper-left
   - No centered `min(68vw, 1280px)` frame wrapper
   This looks like either a rollback to an older snapshot or work that was never carried into `app/page.tsx`. Don't assume either direction — confirm with whoever owns the project before rebuilding the grid.

2. **Three-state interaction model is incomplete in the live route.** `app/page.tsx` only implements `overview` → `expanded`. There is no `focused` state (click a supporting image → hero via `layoutId`) wired up anywhere reachable from `/`. That logic exists only in the orphaned `components/GridTile.tsx` / `components/ProjectOverlay.tsx` / `components/canvas-types.ts`, which were likely a partial attempt at exactly this that never got merged into `app/page.tsx`.

3. **Geometry fix status unknown / partially different.** The previously-proposed fix (single shared frame reference for both measurement and positioning; split 8px image-gap / 24px description-gap) was only tested in a throwaway sandbox, never against this repo. Current `app/page.tsx` already uses two different values (`anchorRect ± 24` for panel offset, Tailwind `gap-2` = 8px between gallery images), but the key image never leaves the grid to join the supporting-image row, so the "one continuous key+supporting group with consistent gap" requirement isn't literally implemented the way `ProjectOverlay.tsx` (dead code) attempts it. **Needs visual verification in a running browser** — not yet done in this session.

4. **Lint is currently failing.** `npm run lint` → 1 error:
   ```
   app/page.tsx:36:5  react-hooks/set-state-in-effect
   setSelectedSlug(slugFromPath(window.location.pathname)) called synchronously in a useEffect body
   ```
   Plus 1 warning (`@next/next/no-img-element` at `app/page.tsx:124`, expected given the intentional move away from `next/image`, not necessarily worth fixing). `npx tsc --noEmit` is currently clean. The lint error is a real instance of the gotcha already documented in `CLAUDE.md`'s "Known gotchas" section (nested/effect-body setState).

## Primary current task — repository-wide numbered-image discovery

Supersedes the earlier manual-only `images` array workflow. Verified folder contents (2026-08-15):

| slug | files present |
|---|---|
| `champion-x-undercover` | `01.jpg`–`09.jpg` (9 files) — **no `images` array in data at all**, only `cover` |
| `12-buckle` | `01.jpg`–`06.jpg` (6 files) — has a manual `images` array but it's **stale**, only lists `01`–`03` |
| `grollz` | `01.jpg`, `02.jpg` — no `images` array |
| `bella-poarch` | `01.png` only |
| `euro` | `01.png` only |
| `mark-gong-alex-consani` | `01.jpeg` only (note the `.jpeg` extension, not `.jpg`) |
| `gabriel-grad`, `kaytranada`, `one-or-eight-mv-shoot`, `one-or-eight-x-kamiya`, `paranoia`, `ann-mukcyen-styling` | `01.<ext>` only, single image |
| all commented-out projects (`starbucks`, `uniqlo`, `mukcyen`, `tekkons`, `ziva`, `zeeger-website`, `slawn-x-yachty`, `sophie-book`, `wingstop`, `team-rocket`, `silk-road-music-video`, `project-crown`, `vogue-china-alex-consani`, `marshall-x-gliiico`) | folders exist and are empty |

Champion x Undercover is the clearest example of the gap (9 real images, 0 surfaced) but is not a special case — the mechanism must work generically.

Requirements (from handoff, unchanged):
- Derive gallery per `public/work/[slug]/` from files matching the numbered convention (`01.jpg`, `02.png`, ...); don't assume a fixed count.
- Sort matching files numerically; ignore non-matching filenames.
- Support the extensions actually in use: `.jpg`, `.png`, `.jpeg` (confirmed from the table above) — extension matching must stay exact.
- Must run at build-time/server-side (client components can't scan the filesystem) — needs a manifest or generation step compatible with this Next.js version's App Router conventions (check `node_modules/next/dist/docs/` per `AGENTS.md`/`CLAUDE.md` before choosing a mechanism).
- Preserve existing visible ordering, cover behavior, and commented-out entries unless a task explicitly requires touching them.

Open decisions to resolve before implementing (not yet answered by any source):
- Are numbering gaps allowed (`01.jpg`, `03.jpg`, no `02.jpg`)?
- Does `01` always become the cover/key image, or does the explicit `cover` field in `data/projects.ts` stay authoritative even if it points elsewhere?
- Does a generated manifest replace the `images` field, or populate it while keeping the current `Project` shape?

## Acceptance criteria (for whichever task is being worked — image discovery and/or geometry)

- Overview: substantial even whitespace both sides; exactly 4 columns; thumbnails ~55–90px, never cropped/boxed/stretched; numbers at upper-left, thumbnail centered in cell; filtering changes only opacity, never position/number/order.
- Expanded: clicked cover unchanged in position/size from grid; every other project (image + number) invisible; description/gallery direction correctly mirrors cover's quadrant; key + supporting images read as one continuous group with no visually larger gap anywhere in the chain; supporting images keep real proportions.
- Every project with valid numbered assets automatically shows all matching images in numeric order, through the same mechanism for every project (no Champion-only special case).
- Focused mode and pushState/back-forward routing unaffected by an image-discovery or overview/expanded-geometry pass.
- `npx tsc --noEmit`, `npm run build`, and `npm run lint` all clean. (Lint is not currently clean — see discrepancy #4 above; that predates and is independent of the image-discovery/geometry work but should be resolved too.)
