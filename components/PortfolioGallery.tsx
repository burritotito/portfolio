'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import type { Project } from '@/data/projects';
import Ruler from '@/components/Ruler';

export type ProjectWithGallery = Project & { gallery: string[] };

function slugFromPath(path: string) {
  const match = path.match(/^\/work\/([^/]+)/);
  return match ? match[1] : null;
}

function isVideo(src: string) {
  return /\.mp4$/i.test(src);
}

// A single stable-sized stage: outgoing/incoming media are absolutely
// positioned on top of each other and crossfaded, so switching between a
// portrait and a landscape image never changes the stage's own box (which
// would otherwise shift the carousel below it). Only `src` drives identity;
// `layoutId`, when supplied, additionally lets Motion morph this element's
// position/size from wherever an element with the same id last was (used
// for the grid-cover → hero transition on open).
function MobileHeroStage({ src, alt, layoutId }: { src: string; alt: string; layoutId?: string }) {
  const stageClassName =
    'absolute top-1/2 left-1/2 max-w-full max-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 rounded-[2px]';
  return (
    <AnimatePresence initial={false}>
      {isVideo(src) ? (
        <motion.video
          key={src}
          layoutId={layoutId}
          src={src}
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
          layoutId={layoutId}
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

const galleryContainer: Variants = {
  hidden: { opacity: 0 },
  show: (staggerForward: boolean) => ({
    opacity: 1,
    transition: {
      duration: 0.15,
      delayChildren: 0.1,
      staggerChildren: 0.12,
      // Array order 0..N always renders left→right, but when the carousel is
      // right-anchored it grows leftward from the cover, so item 0 ends up
      // visually farthest from it, not closest. Reversing stagger direction
      // (not the array/DOM order) makes the cascade always start from
      // whichever end is actually next to the cover — see `galleryStaggerForward`.
      staggerDirection: staggerForward ? 1 : -1,
    },
  }),
};

const galleryItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

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

  useEffect(() => {
    const onPopState = () => {
      setSelectedSlug(slugFromPath(window.location.pathname));
      setFocusedIndex(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // A project can now be selected from the very first render (via
  // initialSlug, landing directly on /work/[slug]) with no click event to
  // capture anchorRect from. Desktop's description/gallery/bigImage all
  // require it, so synthesize one from the matching grid tile's real
  // rendered position — useLayoutEffect so it's set before the first paint,
  // avoiding a flash of missing overlay content. Mobile doesn't read
  // anchorRect at all, so this is a no-op for it either way.
  useLayoutEffect(() => {
    if (!selectedSlug || anchorRect) return;
    const el = document.querySelector<HTMLImageElement>(`[data-project-slug="${selectedSlug}"] img`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    queueMicrotask(() => setAnchorRect(rect));
  }, [selectedSlug, anchorRect]);

  const openProject = useCallback((slug: string, el: HTMLElement) => {
    setAnchorRect(el.getBoundingClientRect());
    window.history.pushState(null, '', `/work/${slug}`);
    setSelectedSlug(slug);
    setFocusedIndex(null);
    setInfoOpen(false);
    setMenuOpen(false);
  }, []);

  const closeProject = useCallback(() => {
    window.history.pushState(null, '', '/');
    setSelectedSlug(null);
    setFocusedIndex(null);
  }, []);

  const goHome = useCallback(() => {
    if (selectedSlug) {
      window.history.pushState(null, '', '/');
      setSelectedSlug(null);
      setFocusedIndex(null);
    }
    setInfoOpen(false);
  }, [selectedSlug]);

  const focusMedia = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const toggleInfo = useCallback(() => {
    setInfoOpen((open) => !open);
    setMenuOpen(false);
    if (selectedSlug) {
      window.history.pushState(null, '', '/');
      setSelectedSlug(null);
      setFocusedIndex(null);
    }
  }, [selectedSlug]);

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
  // Non-reactive on resize, same as expandDown/expandRight above — this only
  // needs to be correct at the moment a project opens or a render happens to
  // occur, not live-tracked; the CSS lg: breakpoint (not this) is what
  // actually governs which layout renders.
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 1024;
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

  const supportingImages = selectedProject?.gallery ?? [];
  const allMedia = selectedProject ? [selectedProject.cover, ...selectedProject.gallery] : [];

  // Always animate from whichever end sits next to the key image (the user's
  // explicit preference, confirmed twice) — even though this means that for a
  // gallery with enough images to overflow the carousel, the first images to
  // animate can be scrolled out of view until you scroll to them. An earlier
  // version tried to detect that overflow case and animate from what's
  // visible instead, but the user decided they'd rather always prioritize
  // "from the key image" over "always start with what's on screen" — don't
  // reintroduce the overflow-detection complexity without being asked again.
  const galleryStaggerForward = expandRight;

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
              <nav className="flex gap-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActive(cat)}
                    className={`transition-opacity ${
                      active === cat ? 'opacity-100 underline' : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
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

      <section
        style={
          {
            '--rows': rows,
          } as CSSProperties
        }
        className={`${selectedProject ? 'hidden' : 'grid'} lg:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 sm:gap-x-16 gap-y-12 sm:gap-y-24 lg:gap-y-0 px-6 sm:px-12 py-10 sm:py-16 lg:mx-auto lg:w-[min(68vw,1280px)] lg:max-w-[calc(100vw-48px)] lg:[grid-template-rows:repeat(var(--rows),300px)]`}
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
                  const img = e.currentTarget.querySelector('img');
                  if (img) openProject(project.slug, img);
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
                  <motion.img
                    src={project.cover}
                    alt={project.title}
                    layoutId={isMobileViewport ? `mobile-cover-${project.slug}` : undefined}
                    className="h-auto w-auto max-w-[clamp(80px,24vw,115px)] max-h-[clamp(80px,24vw,115px)] rounded-[2px] transition-transform duration-300 group-hover:scale-[0.98] lg:max-w-[clamp(110px,10vw,180px)] lg:max-h-[clamp(110px,10vw,180px)]"
                  />
                </div>
              </motion.div>
            </a>
          );
        })}
      </section>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            key="mobile-project"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit="hidden"
            onClick={(e) => {
              e.stopPropagation();
              setFocusedIndex(null);
            }}
            style={{ paddingTop: headerHeight }}
            className="lg:hidden fixed inset-0 z-20 flex flex-col bg-background"
          >
            <div className="shrink-0 px-6 pt-2" onClick={(e) => e.stopPropagation()}>
              <h1 className="text-sm font-medium">{selectedProject.title}</h1>
              {selectedProject.description && (
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  {selectedProject.description}
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 px-6 py-2">
              <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
                <MobileHeroStage
                  src={allMedia[mobileHeroIndex]}
                  alt={selectedProject.title}
                  layoutId={
                    isMobileViewport && allMedia[mobileHeroIndex] === selectedProject.cover
                      ? `mobile-cover-${selectedProject.slug}`
                      : undefined
                  }
                />
                {focusedIndex !== null && (
                  <button
                    onClick={() => setFocusedIndex(null)}
                    aria-label="Close focused image"
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div
              className="shrink-0 pt-8 px-6"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            >
              <motion.div
                variants={galleryContainer}
                custom={true}
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
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onClick={() => setFocusedIndex(i)}
                      className="h-20 w-auto shrink-0 snap-start rounded-[2px] cursor-pointer object-cover"
                    />
                  ) : (
                    <motion.img
                      key={src}
                      variants={galleryItem}
                      src={src}
                      alt={`${selectedProject.title} ${i + 1}`}
                      onClick={() => setFocusedIndex(i)}
                      className="h-20 w-auto shrink-0 snap-start rounded-[2px] cursor-pointer object-cover"
                    />
                  )
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {selectedProject && anchorRect && (
          <motion.div
            key="description"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: Math.max(16, anchorRect.left),
              ...(expandDown
                ? { top: anchorRect.bottom + 24 }
                : { bottom: window.innerHeight - anchorRect.top + 24 }),
              maxWidth: 280,
            }}
            className="hidden lg:block z-20"
          >
            <h1 className="text-sm font-medium">{selectedProject.title}</h1>
            {selectedProject.description && (
              <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                {selectedProject.description}
              </p>
            )}
          </motion.div>
        )}

        {selectedProject && anchorRect && supportingImages.length > 0 && (
          <motion.div
            key="gallery"
            variants={galleryContainer}
            custom={galleryStaggerForward}
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
            className="hidden lg:flex z-20 gap-2 overflow-x-auto no-scrollbar"
          >
            {supportingImages.map((src, i) => {
              const mediaIndex = i + 1;
              if (isVideo(src)) {
                return (
                  <motion.video
                    key={src}
                    variants={galleryItem}
                    src={src}
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
