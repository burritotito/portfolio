'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { TOWER_ART } from './tower-art';

const SESSION_KEY = 'portfolio-loader-shown';
const MIN_DURATION_MS = 2000;
const FAILSAFE_MS = 6000;
const EXIT_DURATION_MS = 500;
const REDUCED_MOTION_HOLD_MS = 400;
const REDUCED_MOTION_FADE_MS = 300;

type TowerChar = {
  ch: string;
  row: number;
  col: number;
  revealAt: number;
  releaseDelay: number;
  vy0: number;
  vx: number;
  gravity: number;
};

type ParsedTower = { chars: TowerChar[]; rows: number; cols: number };

// Parses the raw art into a flat list of non-space characters with a
// bottom-to-top reveal threshold per character. Runs once at module load —
// the art is static, so there's nothing to recompute per-render.
function parseTowerArt(raw: string): ParsedTower {
  const lines = raw.split('\n');
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  lines.forEach((line, r) => {
    for (let c = 0; c < line.length; c++) {
      if (line[c] !== ' ') {
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }
  });

  const rows = maxRow - minRow + 1;
  const cols = maxCol - minCol + 1;

  const ordered: { ch: string; row: number; col: number }[] = [];
  lines.forEach((line, r) => {
    if (r < minRow || r > maxRow) return;
    const row = r - minRow;
    for (let c = minCol; c <= maxCol; c++) {
      const ch = line[c];
      if (!ch || ch === ' ') continue;
      ordered.push({ ch, row, col: c - minCol });
    }
  });

  // Strict bottom-row-first, then left-to-right within each row — no wave,
  // no diagonal, no randomness. This is the entire ordering rule; terminal
  // output doesn't sweep in curves.
  ordered.sort((a, b) => b.row - a.row || a.col - b.col);

  const chars: TowerChar[] = ordered.map((s, i) => ({
    ch: s.ch,
    row: s.row,
    col: s.col,
    revealAt: ordered.length <= 1 ? 0 : i / (ordered.length - 1),
    releaseDelay: 0,
    vy0: 0,
    vx: 0,
    gravity: 0,
  }));

  return { chars, rows, cols };
}

const TOWER = parseTowerArt(TOWER_ART);

// The canvas backing store covers the *entire* viewport (not just the
// tower's own fitted size) so the opaque background fill painted during
// construction has no gap around it — the art itself is then centered
// within that full canvas via offsetX/offsetY.
type CanvasSize = {
  viewportCssWidth: number;
  viewportCssHeight: number;
  artCssWidth: number;
  artCssHeight: number;
  offsetX: number;
  offsetY: number;
  dpr: number;
};

function sizeCanvas(canvas: HTMLCanvasElement, rows: number, cols: number): CanvasSize {
  const viewportCssWidth = window.innerWidth;
  const viewportCssHeight = window.innerHeight;
  const aspect = cols / rows;
  const maxArtWidth = viewportCssWidth * 0.92;
  const maxArtHeight = viewportCssHeight * 0.82;
  let artCssWidth = maxArtWidth;
  let artCssHeight = artCssWidth / aspect;
  if (artCssHeight > maxArtHeight) {
    artCssHeight = maxArtHeight;
    artCssWidth = artCssHeight * aspect;
  }
  const offsetX = (viewportCssWidth - artCssWidth) / 2;
  const offsetY = (viewportCssHeight - artCssHeight) / 2;

  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.style.width = `${viewportCssWidth}px`;
  canvas.style.height = `${viewportCssHeight}px`;
  canvas.width = Math.round(viewportCssWidth * dpr);
  canvas.height = Math.round(viewportCssHeight * dpr);
  return { viewportCssWidth, viewportCssHeight, artCssWidth, artCssHeight, offsetX, offsetY, dpr };
}

function prepContext(ctx: CanvasRenderingContext2D, size: CanvasSize, tower: ParsedTower, fontFamily: string) {
  ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
  ctx.clearRect(0, 0, size.viewportCssWidth, size.viewportCssHeight);
  const cellW = size.artCssWidth / tower.cols;
  const cellH = size.artCssHeight / tower.rows;
  ctx.font = `${cellW / 0.6}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  return { cellW, cellH };
}

function drawBuildFrame(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  tower: ParsedTower,
  progress: number,
  bgColor: string,
  fgColor: string,
  fontFamily: string
) {
  const { cellW, cellH } = prepContext(ctx, size, tower, fontFamily);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size.viewportCssWidth, size.viewportCssHeight);
  ctx.fillStyle = fgColor;

  // Hard binary reveal: a character is either not drawn at all, or drawn at
  // full opacity in one pass — no per-character fade, no partial alpha.
  for (const c of tower.chars) {
    if (c.revealAt > progress) continue;
    ctx.fillText(c.ch, size.offsetX + c.col * cellW + cellW / 2, size.offsetY + c.row * cellH + cellH / 2);
  }
}

function drawStaticTower(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  tower: ParsedTower,
  alpha: number,
  bgColor: string,
  fgColor: string,
  fontFamily: string
) {
  const { cellW, cellH } = prepContext(ctx, size, tower, fontFamily);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size.viewportCssWidth, size.viewportCssHeight);
  ctx.fillStyle = fgColor;
  for (const c of tower.chars) {
    ctx.fillText(c.ch, size.offsetX + c.col * cellW + cellW / 2, size.offsetY + c.row * cellH + cellH / 2);
  }
  ctx.globalAlpha = 1;
}

function initExitPhysics(tower: ParsedTower) {
  for (const c of tower.chars) {
    c.releaseDelay = Math.random() * 80;
    c.vy0 = 200 + Math.random() * 250;
    c.vx = (Math.random() - 0.5) * 260;
    c.gravity = 7000 + Math.random() * 3000;
  }
}

function drawExitFrame(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  tower: ParsedTower,
  exitElapsedMs: number,
  fgColor: string,
  fontFamily: string
) {
  const { cellW, cellH } = prepContext(ctx, size, tower, fontFamily);
  ctx.fillStyle = fgColor;
  ctx.globalAlpha = 1;
  for (const c of tower.chars) {
    const t = Math.max(0, exitElapsedMs - c.releaseDelay) / 1000;
    const x = size.offsetX + c.col * cellW + cellW / 2 + c.vx * t;
    const y = size.offsetY + c.row * cellH + cellH / 2 + c.vy0 * t + 0.5 * c.gravity * t * t;
    if (y > size.viewportCssHeight + cellH) continue;
    ctx.fillText(c.ch, x, y);
  }
}

export default function LoadingScreen({ coverImages }: { coverImages: string[] }) {
  const [shouldRender, setShouldRender] = useState(false);
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // useLayoutEffect (not useEffect) so this resolves before the browser
  // paints, not after — the initial render (server and first client pass
  // alike) can't know sessionStorage, so it always renders the covering
  // shell below rather than null; this effect's only job is to end that
  // shell state as fast as possible, either by skipping straight to `done`
  // (session already shown) or swapping the shell for the real animation.
  // The setState calls are still wrapped in queueMicrotask, same as before
  // (react-hooks/set-state-in-effect flags a direct call either way) — a
  // microtask queued from a layout effect still flushes before the browser's
  // next paint, so this costs nothing toward the "before first paint" goal.
  useLayoutEffect(() => {
    queueMicrotask(() => {
      try {
        if (sessionStorage.getItem(SESSION_KEY)) {
          setDone(true);
          return;
        }
      } catch {
        // sessionStorage unavailable (e.g. locked-down private browsing) —
        // fall through and just show the loader; worst case it shows every
        // visit in that browser instead of once per tab.
      }
      setShouldRender(true);
    });
  }, []);

  useEffect(() => {
    // Covers the pending (pre-resolution) shell too, not just the animated
    // phase — the shell is already blocking the portfolio from view, so
    // scroll should be locked for as long as anything is covering it.
    if (done) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [done]);

  useEffect(() => {
    if (!shouldRender) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset mutable per-character state from any previous run (relevant in
    // dev under StrictMode's mount→unmount→remount) — TOWER is a module-level
    // singleton shared across mounts, so nothing here may carry over.
    for (const c of TOWER.chars) {
      c.releaseDelay = 0;
      c.vy0 = 0;
      c.vx = 0;
      c.gravity = 0;
    }

    const rootStyle = getComputedStyle(document.documentElement);
    const bgColor = rootStyle.getPropertyValue('--background').trim() || '#fdfdfd';
    const fgColor = rootStyle.getPropertyValue('--foreground').trim() || '#171717';
    // Canvas text doesn't inherit CSS, so the resolved (hashed) next/font
    // family name is read off the canvas element's own computed style
    // instead of guessed at.
    canvas.classList.add('font-mono');
    const fontFamily = getComputedStyle(canvas).fontFamily || 'monospace';

    let size = sizeCanvas(canvas, TOWER.rows, TOWER.cols);
    const handleResize = () => {
      size = sizeCanvas(canvas, TOWER.rows, TOWER.cols);
    };
    window.addEventListener('resize', handleResize);

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let settledCount = 0;
    const total = coverImages.length;
    coverImages.forEach((src) => {
      const img = new Image();
      img.src = src;
      const markSettled = () => {
        settledCount += 1;
      };
      img.decode().then(markSettled, markSettled);
    });

    const startTime = performance.now();
    let phase: 'building' | 'exiting' | 'done' = 'building';
    let exitStartTime = 0;
    let displayedProgress = 0;
    let rafId = 0;

    const loop = () => {
      const now = performance.now();
      const elapsed = now - startTime;

      if (phase === 'building') {
        if (reduced) {
          displayedProgress = 1;
          drawStaticTower(ctx, size, TOWER, 1, bgColor, fgColor, fontFamily);
          if (elapsed >= REDUCED_MOTION_HOLD_MS) {
            phase = 'exiting';
            exitStartTime = now;
          }
        } else {
          let assetProgress = total === 0 ? 1 : settledCount / total;
          if (elapsed >= FAILSAFE_MS) assetProgress = 1;
          const timeProgress = Math.min(1, elapsed / MIN_DURATION_MS);
          const target = Math.min(assetProgress, timeProgress);

          // A more direct catch-up rate than a typical soft ease — this
          // should read as mechanical/typed rather than a smooth animated
          // sweep, while still not hard-jumping on every discrete tick of
          // assetProgress as individual images settle.
          const rate = elapsed >= FAILSAFE_MS ? 0.5 : 0.25;
          let next = displayedProgress + (target - displayedProgress) * rate;
          if (target - next < 0.001) next = target;
          next = Math.max(displayedProgress, Math.min(1, next));
          displayedProgress = next;

          drawBuildFrame(ctx, size, TOWER, displayedProgress, bgColor, fgColor, fontFamily);

          if (displayedProgress >= 1) {
            phase = 'exiting';
            exitStartTime = now;
            initExitPhysics(TOWER);
          }
        }
      } else if (phase === 'exiting') {
        const exitElapsed = now - exitStartTime;
        if (reduced) {
          const alpha = Math.max(0, 1 - exitElapsed / REDUCED_MOTION_FADE_MS);
          drawStaticTower(ctx, size, TOWER, alpha, bgColor, fgColor, fontFamily);
          if (exitElapsed >= REDUCED_MOTION_FADE_MS) phase = 'done';
        } else {
          drawExitFrame(ctx, size, TOWER, exitElapsed, fgColor, fontFamily);
          if (exitElapsed >= EXIT_DURATION_MS) phase = 'done';
        }
      }

      if (phase === 'done') {
        try {
          sessionStorage.setItem(SESSION_KEY, '1');
        } catch {
          // ignore — nothing to persist to, loader just runs again next time
        }
        setDone(true);
        return;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [shouldRender, coverImages]);

  if (done) return null;

  // Rendered on the server and on the very first client pass alike — before
  // the layout effect above has had a chance to resolve the once-per-session
  // check — so the portfolio underneath is never exposed while that's
  // pending. Once resolved, this either disappears entirely (done) or gets
  // replaced by the real canvas animation below (shouldRender).
  if (!shouldRender) {
    return <div className="fixed inset-0 z-50 bg-background" aria-hidden="true" />;
  }

  return (
    <div className="fixed inset-0 z-50">
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
