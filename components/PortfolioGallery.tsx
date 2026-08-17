'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import type { Project } from '@/data/projects';
import Ruler from '@/components/Ruler';

export type ProjectWithGallery = Project & { gallery: string[]; posters: Record<string, string> };

function slugFromPath(path: string) {
  const match = path.match(/^\/work\/([^/]+)/);
  return match ? match[1] : null;
}

function isVideo(src: string) {
  return /\.mp4$/i.test(src);
}

function hasExtendedInfo(project: ProjectWithGallery) {
  return Boolean(project.longDescription?.length) || Boolean(project.credits?.length);
}

// A single stable-sized stage: outgoing/incoming media are absolutely
// positioned on top of each other and crossfaded, so switching between a
// portrait and a landscape image never changes the stage's own box (which
// would otherwise shift the carousel below it). Driven purely by `src`
// identity — no layoutId/shared-element link to the grid tile's cover
// anymore. That link used to let Motion FLIP-animate a scale/position
// transform between this element and the grid tile whenever one mounted as
// the other unmounted; on close, the grid's <section> flips from `hidden`
// to `grid` display at the same instant this panel starts its exit fade, so
// Motion would sometimes measure the tile's rect mid-layout-change and FLIP
// from a momentarily-wrong size — the visible "zoom" on returning to
// overview. Removed entirely rather than patched, per CLAUDE.md's own
// history of this being a repeatedly-flaky mechanism in this codebase; nothing
// links two different mounted locations anymore, so there's nothing to FLIP.
function MobileHeroStage({
  src,
  alt,
  poster,
  active,
}: {
  src: string;
  alt: string;
  poster?: string;
  active: boolean;
}) {
  const stageClassName =
    'absolute top-1/2 left-1/2 max-w-full max-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 rounded-[2px]';

  // While inactive (this stage sits behind the extended-info crossfade,
  // invisible via the wrapper's own opacity), render plainly with no
  // crossfade machinery at all. Without this: picking a different carousel
  // item while the info panel is open changes `src` here too, and
  // AnimatePresence would start a genuine exit/enter between old and new —
  // both mid-fade and invisible only because the OUTER wrapper happens to
  // be at opacity 0 right then. The moment that wrapper fades back in, it
  // would reveal whatever this inner crossfade was still mid-flight on,
  // blending old and new media together — the exact "don't reveal the old
  // cover" bug this guards against. Swapping to the animated branch only
  // once genuinely active means AnimatePresence cold-starts on whatever
  // `src` already is, with nothing left over to exit.
  if (!active) {
    return isVideo(src) ? (
      <video src={src} poster={poster} muted loop playsInline preload="metadata" className={stageClassName} />
    ) : (
      <img src={src} alt={alt} className={stageClassName} />
    );
  }

  return (
    <AnimatePresence initial={false}>
      {isVideo(src) ? (
        <motion.video
          key={src}
          src={src}
          poster={poster}
          controls
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={stageClassName}
        />
      ) : (
        <motion.img
          key={src}
          src={src}
          alt={alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={stageClassName}
        />
      )}
    </AnimatePresence>
  );
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6 } },
};

// A quicker, more restrained fade for small in-place UI (the discipline
// filter panel). fadeIn's 0.6s suits full overlay transitions but reads as
// sluggish for something menu-like.
const menuReveal: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.15 } },
};

// Children always animate in array order 0..N (Motion's default stagger
// direction). Which end that corresponds to visually — nearest vs. farthest
// from the cover — is a placement concern, handled by flex-row-reverse on
// the right-anchored gallery container, not by flipping stagger direction.
const galleryContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.15,
      delayChildren: 0.1,
      staggerChildren: 0.12,
    },
  },
};

const galleryItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

// Flat cap (not viewport-derived) for the scrollable extended-info
// sub-region in the desktop description box — generous enough that a
// single paragraph or a short credit list never needs to scroll, small
// enough that a long multi-paragraph + long-credit-list project reliably
// does. descriptionMaxHeight (viewport-derived, see below) is the real
// safety net for unusually short viewports; this is just the everyday size.
const EXTENDED_PANEL_MAX_HEIGHT = 260;

// Duration used by both the page-level (project<->overview) and the
// media<->text mobile transitions, kept as one constant so the CSS class
// (duration-[220ms]) and the JS fallback timers below can never drift out
// of sync with each other.
const MOBILE_TRANSITION_MS = 220;

const experience = [
  {
    company: 'Monopo Tokyo',
    roles: [
      {
        title: 'Designer & Art Direction Assistant',
        period: '2025',
        skills: 'graphic design, art direction, image research, set design',
      },
    ],
  },
  {
    company: 'Shokupan Inc.',
    roles: [
      {
        title: 'Art Direction Assistant',
        period: '2025',
        skills: 'art direction, image research, set design, graphic design',
      },
    ],
  },
  {
    company: '100%',
    roles: [
      {
        title: 'Art Direction & Design Assistant',
        period: '2024',
        skills: 'art direction, graphic design, treatment design, image research',
      },
    ],
  },
  {
    company: 'Boomerang FT',
    roles: [
      {
        title: 'Creative',
        period: '2022–2025',
        skills: 'art direction, (social) strategy, graphic design, concepting',
      },
    ],
  },
  {
    company: 'G-Rollz Amsterdam',
    roles: [
      {
        title: 'Brand/Content Strategist',
        period: '2022–2023',
        skills: 'brand strategy, social media, design, packaging, DTP, catalogs, branding',
      },
    ],
  },
];

const education = [{ school: 'Willem De Kooning Academie', program: 'Advertising & Beyond' }];

// Keeps a horizontally-overflowing scroll strip aligned so `edgeChild` stays
// flush against the strip's trailing (end/right) edge while content is still
// settling — e.g. gallery images establishing their real intrinsic width as
// they load, which can grow scrollWidth well after mount. Uses
// scrollIntoView rather than computing a scrollLeft value directly: for a
// flex-row-reverse strip (the desktop right-anchored gallery), overflow is
// scrolled in the negative direction in at least some engines, so a
// `scrollWidth - clientWidth` style computation would assume the wrong sign.
// scrollIntoView lets the browser resolve the actual direction instead of
// this code guessing it. Re-runs on every child resize rather than measuring
// once, so it stays correct regardless of load order or item count; stops
// permanently the instant the user takes over scrolling by hand, so it never
// yanks the view out from under them. `resetKey` re-arms this for a
// freshly-mounted strip (e.g. a newly-opened project).
function usePinScrollEnd(active: boolean, resetKey: unknown, edgeChild: 'first' | 'last' = 'last') {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el) return;

    let userScrolled = false;
    const pin = () => {
      if (userScrolled) return;
      const target = edgeChild === 'first' ? el.firstElementChild : el.lastElementChild;
      target?.scrollIntoView({ block: 'nearest', inline: 'end' });
    };
    const stop = () => {
      userScrolled = true;
    };

    pin();
    // Observing `el` itself wouldn't catch images loading in: overflow-x-auto
    // means children overflow rather than resizing the container, so el's
    // own box never changes as scrollWidth grows. Each child's own box does
    // change, from ~0 to its natural size as it loads, so observe those.
    const ro = new ResizeObserver(pin);
    for (const child of el.children) ro.observe(child);
    el.addEventListener('pointerdown', stop, { once: true });
    el.addEventListener('wheel', stop, { once: true });

    return () => {
      ro.disconnect();
      el.removeEventListener('pointerdown', stop);
      el.removeEventListener('wheel', stop);
    };
  }, [active, resetKey, edgeChild]);

  return ref;
}

// Resets a horizontally-scrolling container's scroll position back to its
// natural left-to-right start (scrollLeft: 0) whenever resetKey changes —
// e.g. a freshly-opened project. Needed because the mobile project panel
// persists across a project change rather than remounting, which would
// otherwise leave a long carousel scrolled wherever the previous project's
// view left it. Unlike usePinScrollEnd (used only for the desktop gallery's
// directional reveal), this never re-runs on child resize — position 0
// doesn't drift as later content loads in, so a single reset per resetKey is
// enough — and is a plain scrollLeft assignment rather than scrollIntoView,
// since a normal LTR strip's start is unambiguously 0 with no row-reverse/
// RTL direction to resolve.
function useResetScrollLeft(resetKey: unknown) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = 0;
  }, [resetKey]);

  return ref;
}

// Tracks whether a given image URL is actually decoded and ready to paint —
// or already cached, the common case, since the same URL was very likely
// already requested by a grid thumbnail or carousel item — so the mobile
// media/description crossfade can hold off revealing the media layer until
// there's real pixel content rather than a blank frame popping in mid-fade.
// Uses HTMLImageElement.decode() (the same technique LoadingScreen.tsx
// already uses for its cover-image preload) rather than the older
// onload/.complete dance: decode() resolves once the browser has actually
// rasterized the image, not just downloaded its bytes, and uniformly
// handles the already-cached case without a separate synchronous check.
// useLayoutEffect (not useEffect) so an already-cached image resolves
// before paint, with no visible flash even for a project's very first cover
// on open. Pass null for "nothing to gate on" (e.g. a video with no
// generated poster) — resolves ready immediately rather than blocking
// forever on something this isn't trying to check.
function useImageReady(src: string | null) {
  const [ready, setReady] = useState(() => !src);

  useLayoutEffect(() => {
    if (!src) {
      // Deferred a tick rather than calling setState directly in the effect
      // body (react-hooks/set-state-in-effect) — a microtask queued from a
      // layout effect still flushes before the browser's next paint.
      queueMicrotask(() => setReady(true));
      return;
    }
    let cancelled = false;
    // Reset to "not ready" for the new src first — this hook instance
    // persists across src changes (it isn't remounted), so without this,
    // switching from an already-ready image to a not-yet-ready one would
    // leave `ready` stuck at its stale true value from the previous src
    // until the new decode() resolves, defeating the entire "wait for
    // media" gate this hook exists for. Queued (not called directly) for
    // the same react-hooks/set-state-in-effect reason as above; still
    // queued before decode() starts, so it's ordered ahead of decode()'s
    // own eventual .then/.catch in the microtask queue.
    queueMicrotask(() => {
      if (!cancelled) setReady(false);
    });
    const img = new Image();
    img.src = src;
    img
      .decode()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        // decode() rejects if src changes again before it resolves, or for
        // a genuinely broken image — either way, don't block forever.
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return ready;
}

type MobileView = 'overview' | 'project';

// Drives the mobile-only project<->overview transition as a real sequential
// state machine rather than two Motion crossfades layered on top of each
// other. The same project image exists at two very different sizes (a
// small grid thumbnail and a large detail image); overlapping those two
// complete layouts at partial opacity reads as the page zooming even with
// zero scale transforms involved, because human perception treats "same
// content, two sizes, both partially visible" as a resize. So instead:
// fade the CURRENT layout out, wait for that fade to actually finish
// (transitionend, with a short fallback timer for cases it can't fire —
// reduced motion collapses the transition to zero duration, so opacity
// never really "transitions"), swap which layout is rendered, paint the
// new one at opacity 0, then — a frame later, so that 0 state is genuinely
// painted first rather than collapsed into the same commit — fade it in.
// The two layouts are never both on screen at partial opacity together.
function useMobilePageTransition(initialView: MobileView) {
  const [view, setView] = useState<MobileView>(initialView);
  const [opaque, setOpaque] = useState(true);
  const [busy, setBusy] = useState(false);
  const stageRef = useRef<HTMLElement | null>(null);
  const subPhaseRef = useRef<'exiting' | 'entering' | null>(null);
  const pendingTargetRef = useRef<MobileView | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const clearFallback = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const beginEnter = useCallback(() => {
    subPhaseRef.current = 'entering';
    // Double rAF: a single frame can still land before the browser has
    // actually painted the freshly-mounted opacity-0 state in some engines,
    // which would collapse this into an instant jump instead of a fade.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOpaque(true);
        clearFallback();
        fallbackTimerRef.current = setTimeout(() => {
          subPhaseRef.current = null;
          setBusy(false);
        }, MOBILE_TRANSITION_MS + 200);
      });
    });
  }, [clearFallback]);

  const performSwap = useCallback(() => {
    clearFallback();
    const target = pendingTargetRef.current;
    pendingTargetRef.current = null;
    if (target === null) return;
    setView(target);
    setOpaque(false);
    beginEnter();
  }, [clearFallback, beginEnter]);

  const navigate = useCallback(
    (target: MobileView) => {
      // Busy or already-there: ignore rather than queue or cancel, so rapid
      // taps can never start two overlapping navigation transitions.
      if (busy || target === view) return;
      if (shouldReduceMotion) {
        setView(target);
        setOpaque(true);
        return;
      }
      setBusy(true);
      pendingTargetRef.current = target;
      subPhaseRef.current = 'exiting';
      setOpaque(false);
      clearFallback();
      fallbackTimerRef.current = setTimeout(performSwap, MOBILE_TRANSITION_MS + 200);
    },
    [busy, view, shouldReduceMotion, clearFallback, performSwap]
  );

  // Hard-reset with no transition at all — for when a different, already-
  // opaque overlay (the Information panel) is about to cover this whole
  // area anyway, so no fade is visible or needed; just get the underlying
  // view correct for whenever that overlay closes again, and clear any
  // in-flight state so a later navigate() can't act on stale timers.
  const hardSet = useCallback(
    (target: MobileView) => {
      clearFallback();
      subPhaseRef.current = null;
      pendingTargetRef.current = null;
      setBusy(false);
      setView(target);
      setOpaque(true);
    },
    [clearFallback]
  );

  // Exposed as a ref *callback* rather than the raw ref object — the
  // mutation of stageRef.current has to happen inside this hook (a plain
  // ref object handed back to the caller and mutated from outside it is
  // treated as reaching into the hook's internals).
  const setStage = useCallback((el: HTMLElement | null) => {
    stageRef.current = el;
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'opacity') return;
      if (subPhaseRef.current === 'exiting') {
        performSwap();
      } else if (subPhaseRef.current === 'entering') {
        subPhaseRef.current = null;
        clearFallback();
        setBusy(false);
      }
    };
    el.addEventListener('transitionend', onEnd);
    return () => el.removeEventListener('transitionend', onEnd);
  }, [view, performSwap, clearFallback]);

  useEffect(() => () => clearFallback(), [clearFallback]);

  return { view, opaque, busy, navigate, hardSet, setStage };
}

export default function PortfolioGallery({
  projects,
  initialSlug = null,
}: {
  projects: ProjectWithGallery[];
  initialSlug?: string | null;
}) {
  const categories = ['All', ...Array.from(new Set(projects.flatMap((p) => p.categories)))];
  const rows = Math.ceil(projects.length / 4);

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [active, setActive] = useState('All');
  // Derived from the route's own params (identical on server and client),
  // not window.location — reading window here would only match the server's
  // render for the "/" route and mismatch on "/work/[slug]", since the
  // server has no window to read from.
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  // Local to whichever project is currently selected, not persisted
  // per-project — reset any time the selection changes (openProject,
  // popstate) or the selected media changes (focusMedia), per "returning to
  // a project does not need to remember it was previously open."
  const [extendedOpen, setExtendedOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  // Captured at the moment a project opens, restored once the mobile
  // overview is genuinely showing again — see the useLayoutEffect below.
  const scrollYRef = useRef(0);

  // Drives the mobile project<->overview transition (see the hook's own
  // comment). Desktop's own selectedProject-driven rendering further down
  // is completely independent of this and untouched by it. Destructured
  // immediately into plain locals (rather than kept as one object accessed
  // via mobileNav.x throughout) since setStage internally touches a ref,
  // and the react-hooks/refs rule treats property reads off an object that
  // also carries a ref-touching function as ref access even for the
  // unrelated plain-state properties alongside it.
  const {
    view: mobileView,
    opaque: mobileOpaque,
    busy: mobileBusy,
    navigate: navigateMobile,
    hardSet: hardSetMobile,
    setStage: setMobileStage,
  } = useMobilePageTransition(initialSlug ? 'project' : 'overview');

  useEffect(() => {
    const onPopState = () => {
      const slug = slugFromPath(window.location.pathname);
      setSelectedSlug(slug);
      setFocusedIndex(null);
      setExtendedOpen(false);
      navigateMobile(slug ? 'project' : 'overview');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    // navigateMobile is a real dependency, not an oversight: it's a new
    // function identity every time the transition's own busy/view state
    // changes, and its OWN guard logic (`if (busy || target === view)
    // return`) closes over whatever busy/view were at the time THIS
    // effect last ran. With an empty dep array this listener would
    // permanently hold the very-first-render closure — on the browser
    // back button (popstate, as opposed to the in-app link, which always
    // calls the current-render's navigateMobile directly) it would call a
    // navigateMobile that still thinks view is its initial value, so its
    // target === view guard would silently no-op forever, leaving
    // mobileView stuck and the page blank. Re-subscribing here on every
    // navigateMobile change is cheap (one listener, swapped synchronously).
  }, [navigateMobile]);

  // A project can now be selected from the very first render (via
  // initialSlug, landing directly on /work/[slug]) with no click event to
  // capture anchorRect from. Desktop's description/gallery/bigImage all
  // require it, so synthesize one from the matching grid tile's real
  // rendered position — useLayoutEffect so it's set before the first paint,
  // avoiding a flash of missing overlay content. Mobile doesn't read
  // anchorRect at all, so this is a no-op for it either way.
  useLayoutEffect(() => {
    if (!selectedSlug || anchorRect) return;
    const el = document.querySelector(
      `[data-project-slug="${selectedSlug}"] img, [data-project-slug="${selectedSlug}"] video`
    );
    if (!el) return;
    const rect = el.getBoundingClientRect();
    queueMicrotask(() => setAnchorRect(rect));
  }, [selectedSlug, anchorRect]);

  // On mobile the grid goes display:none while the project page is showing
  // (desktop's lg:grid override means it never does), which collapses the
  // document's scrollable height — if the page was scrolled down, the
  // browser clamps window.scrollY back to 0 right then. Nothing then puts
  // it back on its own, so restore it explicitly once the overview is the
  // genuinely-rendered mobile view again (mobileView, not selectedSlug —
  // selectedSlug can flip to null well before the mobile swap actually
  // happens, while the grid is still hidden mid-exit-fade, which would
  // restore scroll onto a still-collapsed document and just get reclamped).
  useLayoutEffect(() => {
    if (mobileView === 'overview') {
      window.scrollTo(0, scrollYRef.current);
    }
  }, [mobileView]);

  const openProject = useCallback(
    (slug: string, el: Element) => {
      // window.location.pathname (unlike selectedSlug) updates synchronously
      // the instant pushState runs, so this guard actually catches rapid
      // repeat taps on the same tile — React's own state hasn't necessarily
      // re-rendered (and thus hasn't made !selectedProject false) between
      // them yet, so without this each one would independently call
      // openProject and push a redundant duplicate history entry, even
      // though the mobile transition itself already correctly ignores the
      // repeats via its own busy guard.
      if (window.location.pathname === `/work/${slug}`) return;
      scrollYRef.current = window.scrollY;
      setAnchorRect(el.getBoundingClientRect());
      window.history.pushState(null, '', `/work/${slug}`);
      setSelectedSlug(slug);
      setFocusedIndex(null);
      setInfoOpen(false);
      setMenuOpen(false);
      setFilterOpen(false);
      setExtendedOpen(false);
      navigateMobile('project');
    },
    [navigateMobile]
  );

  const closeProject = useCallback(() => {
    if (window.location.pathname === '/') return;
    window.history.pushState(null, '', '/');
    setSelectedSlug(null);
    setFocusedIndex(null);
    setExtendedOpen(false);
    navigateMobile('overview');
  }, [navigateMobile]);

  const goHome = useCallback(() => {
    if (selectedSlug && window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
      setSelectedSlug(null);
      setFocusedIndex(null);
      navigateMobile('overview');
    }
    setInfoOpen(false);
  }, [selectedSlug, navigateMobile]);

  const focusMedia = useCallback((index: number) => {
    setFocusedIndex(index);
    setExtendedOpen(false);
  }, []);

  const toggleInfo = useCallback(() => {
    setInfoOpen((open) => !open);
    setMenuOpen(false);
    setFilterOpen(false);
    if (selectedSlug) {
      window.history.pushState(null, '', '/');
      setSelectedSlug(null);
      setFocusedIndex(null);
      // The Information panel is its own full-viewport, opaque overlay with
      // its own existing crossfade (unchanged) — it already visually masks
      // the overview underneath exactly like the mobile project panel used
      // to, so the sequential fade-through-white this hook exists for isn't
      // needed here. hardSet just keeps mobileView correct for whenever
      // Information closes again, with no visible transition of its own.
      hardSetMobile('overview');
    }
  }, [selectedSlug, hardSetMobile]);

  useEffect(() => {
    if (!selectedSlug && !infoOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedSlug) closeProject();
      else setInfoOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedSlug, infoOpen, closeProject]);

  // Desktop discipline filter: closes on Escape or on any pointerdown
  // outside its own trigger+panel. A document-level listener (rather than
  // relying on the click bubbling up to <main>'s own close-on-click-outside
  // handler) is used deliberately — the header wraps its contents in its
  // own onClick stopPropagation, so a click on a header sibling (e.g. the
  // "Information" button) would never reach <main>'s handler.
  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFilterOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [filterOpen]);

  useEffect(() => {
    if (!selectedSlug && !infoOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedSlug, infoOpen]);

  const selectedProject = projects.find((p) => p.slug === selectedSlug) ?? null;

  const expandDown = anchorRect ? anchorRect.top < window.innerHeight / 2 : true;
  const expandRight = anchorRect ? anchorRect.left < window.innerWidth / 2 : true;
  const mobileHeroIndex = focusedIndex ?? 0;

  const bigImageMaxHeight = anchorRect
    ? Math.min(
        480,
        Math.max(
          120,
          expandDown
            ? window.innerHeight - anchorRect.bottom - 16 - 24
            : anchorRect.top - headerHeight - 16 - 24
        )
      )
    : 480;

  // Same anchor-relative math as bigImageMaxHeight, for the description box
  // that sits directly below/above the cover — see the box's own layout
  // comment further down for why it must stay anchor-relative and never be
  // computed from the gallery. Caps the box so it can never run past the
  // viewport edge; EXTENDED_PANEL_MAX_HEIGHT (a smaller flat constant) is
  // what actually governs day-to-day scrolling inside it.
  const descriptionMaxHeight = anchorRect
    ? Math.min(
        520,
        Math.max(
          160,
          expandDown
            ? window.innerHeight - anchorRect.bottom - 24 - 24
            : anchorRect.top - headerHeight - 24 - 24
        )
      )
    : 520;

  const supportingImages = selectedProject?.gallery ?? [];
  const allMedia = selectedProject ? [selectedProject.cover, ...selectedProject.gallery] : [];

  // Desktop gallery: when the cover is anchored on the right (!expandRight),
  // the strip is laid out flex-row-reverse (see below) so the first
  // supporting item sits flush against the cover instead of at the far end
  // of an overflowing row; pinned to that trailing edge as images load in.
  const desktopGalleryRef = usePinScrollEnd(!expandRight, selectedSlug, 'first');
  // Mobile carousel: always opens scrolled to the first (leftmost) item, in
  // the media's normal numeric order — deliberately overriding an earlier
  // version of this feature that opened scrolled to the tail end instead.
  const mobileCarouselRef = useResetScrollLeft(selectedSlug);

  const currentHeroSrc = allMedia[mobileHeroIndex];
  // For video, gate on the poster (a plain image) being ready, not the
  // video itself — video decode readiness is a different, heavier problem
  // this isn't trying to solve. No poster to check (a video without a
  // generated one) resolves ready immediately rather than blocking forever.
  const heroReadyCheckSrc =
    currentHeroSrc && isVideo(currentHeroSrc)
      ? (selectedProject?.posters[currentHeroSrc] ?? null)
      : (currentHeroSrc ?? null);
  const heroReady = useImageReady(heroReadyCheckSrc);
  // Gating mediaVisible on heroReady unconditionally would also gate
  // ordinary hero-to-hero browsing (info never opened at all): rapidly
  // tapping through carousel items on a slow connection could leave
  // heroReady false for a stretch with extendedOpen already false the
  // whole time, which would incorrectly reveal the text layer even though
  // the user never asked for it. So heroReady is only actually consulted
  // while "awaiting a reveal" — a state that turns on exactly when
  // extendedOpen transitions true->false (leaving the info panel) and
  // clears again once heroReady catches up — so ordinary browsing (where
  // extendedOpen was already false) is never gated by it at all.
  const prevExtendedOpenRef = useRef(extendedOpen);
  const [awaitingReveal, setAwaitingReveal] = useState(false);
  useLayoutEffect(() => {
    const justClosedInfo = prevExtendedOpenRef.current && !extendedOpen;
    prevExtendedOpenRef.current = extendedOpen;
    if (justClosedInfo) {
      queueMicrotask(() => setAwaitingReveal(true));
    }
  }, [extendedOpen]);
  useLayoutEffect(() => {
    if (heroReady) {
      queueMicrotask(() => setAwaitingReveal(false));
    }
  }, [heroReady]);
  // The single source of truth for the mobile media<->text crossfade: which
  // of the two layers should currently be the visible one.
  const mediaVisible = !extendedOpen && (!awaitingReveal || heroReady);

  // Mirrors mobilePageTransition's own "wait for the real transition to
  // finish, then finalize" approach for the media<->text crossfade: while
  // mid-crossfade both layers stay fully interactive/visible-to-hit-testing
  // (opacity + pointer-events only); only once the transition has genuinely
  // settled does the now-inactive layer additionally get `invisible`
  // (visibility:hidden), keeping it out of the accessibility tree and
  // compositing without ever unmounting it or flipping display:none mid-fade.
  const [crossfadeSettled, setCrossfadeSettled] = useState(true);
  const mediaLayerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Deferred a tick rather than calling setState directly in the effect
    // body (react-hooks/set-state-in-effect).
    queueMicrotask(() => setCrossfadeSettled(false));
    const el = mediaLayerRef.current;
    if (!el) return;
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'opacity') return;
      setCrossfadeSettled(true);
    };
    el.addEventListener('transitionend', onEnd);
    // Fallback for when transitionend can't fire (prefers-reduced-motion
    // collapses the transition to zero duration).
    const fallback = setTimeout(() => setCrossfadeSettled(true), MOBILE_TRANSITION_MS + 150);
    return () => {
      el.removeEventListener('transitionend', onEnd);
      clearTimeout(fallback);
    };
  }, [mediaVisible]);

  // Scrolls the mobile extended-info text panel back to its top every time
  // it opens, so a previous scroll position (from this project or a
  // different one) never carries over into a freshly-opened panel.
  const mobileInfoScrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (extendedOpen && mobileInfoScrollRef.current) {
      mobileInfoScrollRef.current.scrollTop = 0;
    }
  }, [extendedOpen]);

  return (
    <main
      className="min-h-screen overflow-x-hidden bg-background text-black"
      onClick={() => {
        if (selectedProject) closeProject();
        if (infoOpen) setInfoOpen(false);
      }}
    >
      <div ref={headerRef} className="sticky top-0 z-30 bg-transparent">
        <div className="hidden lg:block">
          <Ruler />
        </div>

        <header
          onClick={(e) => e.stopPropagation()}
          className="flex flex-wrap items-baseline justify-between px-6 sm:px-8 py-6 text-sm"
        >
          <button
            type="button"
            onClick={goHome}
            className="-m-2 p-2 font-medium opacity-100 transition-opacity hover:opacity-60 active:opacity-60"
          >
            Ezra Maätoke
          </button>

          <div className="hidden lg:flex lg:items-baseline lg:gap-6">
            {!selectedProject && !infoOpen ? (
              <div ref={filterRef} className="relative">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={filterOpen}
                  aria-controls="discipline-options"
                  onClick={() => setFilterOpen((open) => !open)}
                  className="-m-2 flex items-center gap-1.5 p-2 opacity-50 transition-opacity hover:opacity-100"
                >
                  {active}
                  <span aria-hidden="true" className="text-[10px]">
                    {filterOpen ? '⌃' : '⌄'}
                  </span>
                </button>
                <AnimatePresence>
                  {filterOpen && (
                    <motion.div
                      id="discipline-options"
                      role="listbox"
                      variants={menuReveal}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
                      className="absolute left-0 top-full mt-3 flex flex-col items-start gap-3 whitespace-nowrap"
                    >
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          role="option"
                          aria-selected={active === cat}
                          onClick={() => {
                            setActive(cat);
                            setFilterOpen(false);
                          }}
                          className={`-m-2 p-2 transition-opacity ${
                            active === cat ? 'opacity-100 underline' : 'opacity-50 hover:opacity-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={selectedProject ? closeProject : () => setInfoOpen(false)}
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                ← Overview
              </button>
            )}
            <button
              onClick={toggleInfo}
              className={`transition-opacity ${infoOpen ? 'opacity-100 underline' : 'opacity-50 hover:opacity-100'}`}
            >
              Information
            </button>
          </div>

          <div className="lg:hidden">
            {selectedProject || infoOpen ? (
              <button
                type="button"
                onClick={selectedProject ? closeProject : () => setInfoOpen(false)}
                className="-m-2 p-2 opacity-50 active:opacity-100"
              >
                ← Overview
              </button>
            ) : (
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu-panel"
                onClick={() => setMenuOpen((open) => !open)}
                className={`-m-2 p-2 ${menuOpen ? 'opacity-100 underline' : 'opacity-50 active:opacity-100'}`}
              >
                Menu
              </button>
            )}
          </div>
        </header>

        <AnimatePresence>
          {menuOpen && !selectedProject && !infoOpen && (
            <motion.div
              key="mobile-menu"
              id="mobile-menu-panel"
              variants={fadeIn}
              initial="hidden"
              animate="show"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
              className="lg:hidden px-6 pb-6 text-xs"
            >
              <nav className="flex flex-wrap gap-x-4 gap-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActive(cat);
                      setMenuOpen(false);
                    }}
                    className={`-m-2 p-2 ${active === cat ? 'opacity-100 underline' : 'opacity-50 active:opacity-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
              <button
                type="button"
                onClick={toggleInfo}
                className="-mx-2 -mb-2 mt-2 block px-2 py-2 opacity-50 active:opacity-100"
              >
                Information
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile overview: display driven by mobileView (never selectedSlug
          directly — see useMobilePageTransition), opacity by mobileOpaque.
          lg:grid + lg:opacity-100 unconditionally force desktop to its own
          always-visible behavior regardless of either. */}
      <section
        ref={mobileView === 'overview' ? setMobileStage : undefined}
        style={
          {
            '--rows': rows,
          } as CSSProperties
        }
        className={`${mobileView === 'project' ? 'hidden' : 'grid'} ${
          mobileOpaque ? 'opacity-100' : 'opacity-0'
        } lg:grid lg:opacity-100 transition-opacity duration-[220ms] ease-out motion-reduce:transition-none ${
          mobileBusy ? 'pointer-events-none lg:pointer-events-auto' : ''
        } grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 sm:gap-x-16 gap-y-12 sm:gap-y-24 lg:gap-y-0 px-6 sm:px-12 py-10 sm:py-16 lg:mx-auto lg:w-[min(68vw,1280px)] lg:max-w-[calc(100vw-48px)] lg:[grid-template-rows:repeat(var(--rows),300px)]`}
      >
        {projects.map((project, i) => {
          const matches = active === 'All' || project.categories.includes(active);
          const isSelected = project.slug === selectedSlug;
          const visible = matches && (!selectedProject || isSelected);

          return (
            <a
              key={project.id}
              href={`/work/${project.slug}`}
              data-project-slug={project.slug}
              onClick={(e) => {
                e.stopPropagation();
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                if (!selectedProject) {
                  const media = e.currentTarget.querySelector('img, video');
                  if (media) openProject(project.slug, media);
                } else if (isSelected) {
                  focusMedia(0);
                }
              }}
              className={`group block ${visible ? '' : 'pointer-events-none'}`}
            >
              <motion.div
                animate={{ opacity: visible ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="relative lg:h-full lg:w-full"
              >
                <span className="block text-[10px] text-neutral-500 mb-2 lg:absolute lg:left-0 lg:top-0 lg:mb-0">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <div className="flex justify-center lg:absolute lg:left-1/2 lg:top-[42px] lg:-translate-x-1/2">
                  {isVideo(project.cover) ? (
                    <motion.video
                      src={project.cover}
                      poster={project.posters[project.cover]}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="h-auto w-auto max-w-[clamp(80px,24vw,115px)] max-h-[clamp(80px,24vw,115px)] rounded-[2px] transition-transform duration-300 group-hover:scale-[0.98] lg:max-w-[clamp(110px,10vw,180px)] lg:max-h-[clamp(110px,10vw,180px)]"
                    />
                  ) : (
                    <motion.img
                      src={project.cover}
                      alt={project.title}
                      className="h-auto w-auto max-w-[clamp(80px,24vw,115px)] max-h-[clamp(80px,24vw,115px)] rounded-[2px] transition-transform duration-300 group-hover:scale-[0.98] lg:max-w-[clamp(110px,10vw,180px)] lg:max-h-[clamp(110px,10vw,180px)]"
                    />
                  )}
                </div>
              </motion.div>
            </a>
          );
        })}
      </section>

      {/* Mobile project page: mounted only while mobileView === 'project'
          (never both this and the overview at once), plain CSS opacity —
          not Motion/AnimatePresence — driven by mobileOpaque, so the
          transition state machine above can listen for its own real
          transitionend rather than guessing at a duration. */}
      {mobileView === 'project' && selectedProject && (
        <div
          ref={setMobileStage}
          onClick={(e) => {
            e.stopPropagation();
            setFocusedIndex(null);
          }}
          style={{ paddingTop: headerHeight }}
          className={`lg:hidden fixed inset-0 z-20 flex flex-col bg-background transition-opacity duration-[220ms] ease-out motion-reduce:transition-none ${
            mobileOpaque ? 'opacity-100' : 'opacity-0'
          } ${mobileBusy ? 'pointer-events-none' : ''}`}
        >
          <div className="shrink-0 px-6 pt-2" onClick={(e) => e.stopPropagation()}>
            <h1 className="text-sm font-medium">{selectedProject.title}</h1>
            {(selectedProject.year || selectedProject.role) && (
              <p className="mt-1 text-[11px] text-neutral-400">
                {[selectedProject.year, selectedProject.role].filter(Boolean).join(' · ')}
              </p>
            )}
            {selectedProject.description && (
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed">{selectedProject.description}</p>
            )}
            {hasExtendedInfo(selectedProject) && !extendedOpen && (
              <button
                type="button"
                onClick={() => setExtendedOpen(true)}
                aria-expanded={false}
                aria-label="Show more about this project"
                className="-m-2 mt-4 block p-2 text-neutral-400 active:text-neutral-700"
              >
                ⌄
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 px-6 pt-6 pb-2">
            <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
              {/* Both layers stay mounted the whole time and cross the
                  opposite way on opacity, in the same fixed frame (absolute
                  inset-0 within this shared relative parent) — never
                  sequential, never resized, never unmounted mid-fade. */}
              <div
                ref={mediaLayerRef}
                inert={!mediaVisible && crossfadeSettled ? true : undefined}
                aria-hidden={!mediaVisible}
                className={`absolute inset-0 transition-opacity duration-[220ms] ease-out motion-reduce:transition-none ${
                  mediaVisible ? 'opacity-100' : 'opacity-0'
                } ${!mediaVisible ? 'pointer-events-none' : ''} ${
                  !mediaVisible && crossfadeSettled ? 'invisible' : ''
                }`}
              >
                <MobileHeroStage
                  src={allMedia[mobileHeroIndex]}
                  alt={selectedProject.title}
                  poster={selectedProject.posters[allMedia[mobileHeroIndex]]}
                  active={mediaVisible}
                />
              </div>

              {hasExtendedInfo(selectedProject) && (
                <div
                  inert={mediaVisible && crossfadeSettled ? true : undefined}
                  aria-hidden={mediaVisible}
                  className={`absolute inset-0 flex flex-col bg-background transition-opacity duration-[220ms] ease-out motion-reduce:transition-none ${
                    !mediaVisible ? 'opacity-100' : 'opacity-0'
                  } ${mediaVisible ? 'pointer-events-none' : ''} ${
                    mediaVisible && crossfadeSettled ? 'invisible' : ''
                  }`}
                >
                  <div
                    ref={mobileInfoScrollRef}
                    className="min-h-0 flex-1 overflow-y-auto subtle-scrollbar pb-3 pr-1 text-xs text-neutral-600 leading-relaxed space-y-4"
                  >
                    {selectedProject.longDescription?.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {selectedProject.credits && selectedProject.credits.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-400">Credits</p>
                        <div className="space-y-1">
                          {selectedProject.credits.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExtendedOpen(false)}
                    aria-expanded={true}
                    aria-label="Show less about this project"
                    className="-m-2 mt-3 shrink-0 self-center p-2 text-neutral-400 active:text-neutral-700"
                  >
                    ⌃
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            className="shrink-0 pt-8 px-6"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
          >
            <motion.div
              ref={mobileCarouselRef}
              variants={galleryContainer}
              initial="hidden"
              animate="show"
              onClick={(e) => e.stopPropagation()}
              className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar"
            >
              {allMedia.map((src, i) =>
                isVideo(src) ? (
                  <motion.video
                    key={src}
                    variants={galleryItem}
                    src={src}
                    poster={selectedProject.posters[src]}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onClick={() => focusMedia(i)}
                    className="h-20 w-auto shrink-0 snap-start rounded-[2px] cursor-pointer object-cover"
                  />
                ) : (
                  <motion.img
                    key={src}
                    variants={galleryItem}
                    src={src}
                    alt={`${selectedProject.title} ${i + 1}`}
                    onClick={() => focusMedia(i)}
                    className="h-20 w-auto shrink-0 snap-start rounded-[2px] cursor-pointer object-cover"
                  />
                )
              )}
            </motion.div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedProject && anchorRect && (
          <motion.div
            key="description"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
            // Anchored purely off anchorRect (the key image's own measured
            // rect) — directly below it when the cover is in the top half,
            // directly above when it's in the bottom half, left edge
            // matched to the cover's left edge. Deliberately NOT computed
            // from the gallery strip's width/edges or from remaining
            // horizontal space: this box sits in its own row below/above
            // the cover, not beside it, and must stay put (same anchorRect,
            // same maxWidth) regardless of extendedOpen so opening/closing
            // extended info never moves or resizes the cover or the
            // supporting-image gallery next to it.
            style={{
              position: 'fixed',
              left: Math.max(16, anchorRect.left),
              ...(expandDown
                ? { top: anchorRect.bottom + 24 }
                : { bottom: window.innerHeight - anchorRect.top + 24 }),
              maxWidth: 280,
              maxHeight: descriptionMaxHeight,
            }}
            className="hidden lg:flex lg:flex-col z-20"
          >
            <div className="shrink-0">
              <h1 className="text-sm font-medium">{selectedProject.title}</h1>
              {(selectedProject.year || selectedProject.role) && (
                <p className="mt-1 text-[11px] text-neutral-400">
                  {[selectedProject.year, selectedProject.role].filter(Boolean).join(' · ')}
                </p>
              )}
              {selectedProject.description && (
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  {selectedProject.description}
                </p>
              )}
            </div>

            {hasExtendedInfo(selectedProject) && (
              <>
                <div
                  inert={!extendedOpen ? true : undefined}
                  aria-hidden={!extendedOpen}
                  style={{ maxHeight: extendedOpen ? EXTENDED_PANEL_MAX_HEIGHT : 0 }}
                  className={`shrink-0 overflow-y-auto subtle-scrollbar overflow-x-hidden transition-[max-height,opacity] duration-300 ease-out motion-reduce:transition-none ${
                    extendedOpen ? 'mt-3 opacity-100' : 'mt-0 opacity-0'
                  }`}
                >
                  <div className="space-y-4 pb-3 pr-1 text-xs text-neutral-600 leading-relaxed">
                    {selectedProject.longDescription?.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {selectedProject.credits && selectedProject.credits.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-400">Credits</p>
                        <div className="space-y-1">
                          {selectedProject.credits.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExtendedOpen((open) => !open)}
                  aria-expanded={extendedOpen}
                  aria-label={extendedOpen ? 'Show less about this project' : 'Show more about this project'}
                  className="-m-2 mt-3 shrink-0 self-start p-2 text-neutral-400 transition-colors hover:text-neutral-700"
                >
                  {extendedOpen ? '⌃' : '⌄'}
                </button>
              </>
            )}
          </motion.div>
        )}

        {selectedProject && anchorRect && supportingImages.length > 0 && (
          <motion.div
            key="gallery"
            ref={desktopGalleryRef}
            variants={galleryContainer}
            initial="hidden"
            animate="show"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: anchorRect.top,
              ...(expandRight
                ? { left: anchorRect.right + 8 }
                : { right: window.innerWidth - anchorRect.left + 8 }),
              maxWidth: expandRight
                ? window.innerWidth - anchorRect.right - 40
                : anchorRect.left - 40,
            }}
            className={`hidden lg:flex z-20 gap-2 overflow-x-auto no-scrollbar ${expandRight ? '' : 'flex-row-reverse'}`}
          >
            {supportingImages.map((src, i) => {
              const mediaIndex = i + 1;
              if (isVideo(src)) {
                return (
                  <motion.video
                    key={src}
                    variants={galleryItem}
                    src={src}
                    poster={selectedProject.posters[src]}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onClick={() => focusMedia(mediaIndex)}
                    style={{ height: anchorRect.height }}
                    className="w-auto object-cover shrink-0 cursor-pointer rounded-[2px]"
                  />
                );
              }
              return (
                <motion.img
                  key={src}
                  variants={galleryItem}
                  src={src}
                  alt={`${selectedProject.title} ${i + 2}`}
                  onClick={() => focusMedia(mediaIndex)}
                  style={{ height: anchorRect.height }}
                  className="w-auto object-cover shrink-0 cursor-pointer rounded-[2px]"
                />
              );
            })}
          </motion.div>
        )}

        {selectedProject && anchorRect && focusedIndex !== null && (
          <motion.div
            key="bigImage"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              ...(expandRight
                ? { left: anchorRect.right + 8, maxWidth: window.innerWidth - anchorRect.right - 40 }
                : { right: window.innerWidth - anchorRect.left + 8, maxWidth: anchorRect.left - 40 }),
              ...(expandDown
                ? { top: anchorRect.bottom + 16 }
                : { bottom: window.innerHeight - anchorRect.top + 16 }),
              maxHeight: bigImageMaxHeight,
            }}
            className="hidden lg:block z-20"
          >
            {isVideo(allMedia[focusedIndex]) ? (
              <motion.video
                key={allMedia[focusedIndex]}
                src={allMedia[focusedIndex]}
                poster={selectedProject.posters[allMedia[focusedIndex]]}
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                style={{ maxHeight: bigImageMaxHeight, width: 'auto' }}
                className="rounded-[2px]"
              />
            ) : (
              <motion.img
                key={allMedia[focusedIndex]}
                src={allMedia[focusedIndex]}
                alt={selectedProject.title}
                style={{ maxHeight: bigImageMaxHeight, width: 'auto' }}
                className="rounded-[2px]"
              />
            )}
          </motion.div>
        )}

        {infoOpen && (
          <motion.div
            key="info"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="fixed inset-0 z-20 bg-background overflow-y-auto"
          >
            <div className="px-8 sm:px-12 pt-24 sm:pt-32 pb-24">
              <div
                onClick={(e) => e.stopPropagation()}
                className="mx-auto w-full max-w-md font-mono text-xs text-neutral-700 leading-relaxed"
              >
                <p className="text-center text-sm text-black mb-20">Ezra Maätoke</p>

                <div className="space-y-16">
                  <section>
                    <p className="uppercase tracking-wider text-neutral-400 mb-4">Contact</p>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                        <span className="text-neutral-500">Email:</span>
                        <a
                          href="mailto:maatokeezra@gmail.com"
                          className="text-neutral-700 hover:text-black transition-colors"
                        >
                          maatokeezra@gmail.com
                        </a>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                        <span className="text-neutral-500">Instagram:</span>
                        <a
                          href="https://instagram.com/gevoelig"
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-700 hover:text-black transition-colors"
                        >
                          @gevoelig
                        </a>
                      </div>
                    </div>
                  </section>

                  <section>
                    <p className="uppercase tracking-wider text-neutral-400 mb-4">Education</p>
                    <div className="space-y-4">
                      {education.map((entry) => (
                        <div key={entry.school}>
                          <p className="text-black">{entry.school}</p>
                          <p className="text-neutral-500 mt-1">{entry.program}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="uppercase tracking-wider text-neutral-400 mb-4">Experience</p>
                    <div className="space-y-8">
                      {experience.map((entry) => (
                        <div key={entry.company}>
                          <p className="text-black">{entry.company}</p>
                          <div className="mt-2 space-y-4">
                            {entry.roles.map((role) => (
                              <div key={role.title}>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                                  <span className="text-neutral-600">{role.title}</span>
                                  <span className="text-neutral-500 sm:shrink-0">{role.period}</span>
                                </div>
                                <p className="text-neutral-500 mt-1">{role.skills}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
