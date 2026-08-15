'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { projects } from '@/data/projects';
import Ruler from '@/components/Ruler';

const categories = ['All', ...Array.from(new Set(projects.flatMap((p) => p.categories)))];

function slugFromPath(path: string) {
  const match = path.match(/^\/work\/([^/]+)/);
  return match ? match[1] : null;
}

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

const galleryContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const galleryItem: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function Home() {
  const [active, setActive] = useState('All');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() =>
    typeof window !== 'undefined' ? slugFromPath(window.location.pathname) : null
  );
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const onPopState = () => setSelectedSlug(slugFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openProject = useCallback((slug: string, el: HTMLElement) => {
    setAnchorRect(el.getBoundingClientRect());
    window.history.pushState(null, '', `/work/${slug}`);
    setSelectedSlug(slug);
  }, []);

  const closeProject = useCallback(() => {
    window.history.pushState(null, '', '/');
    setSelectedSlug(null);
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeProject();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedSlug, closeProject]);

  const selectedProject = projects.find((p) => p.slug === selectedSlug) ?? null;

  const expandDown = anchorRect ? anchorRect.top < window.innerHeight / 2 : true;
  const expandRight = anchorRect ? anchorRect.left < window.innerWidth / 2 : true;

  const images = selectedProject
    ? selectedProject.images && selectedProject.images.length > 0
      ? selectedProject.images
      : [selectedProject.cover]
    : [];
  const restImages = images.slice(1);

  return (
    <main className="min-h-screen bg-white text-black">
      <Ruler />

      <header className="flex flex-wrap items-baseline justify-between px-8 py-6 text-sm">
        <span className="font-medium">Your Name</span>
        {!selectedProject ? (
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
          <button onClick={closeProject} className="opacity-50 hover:opacity-100 transition-opacity">
            ← Overview
          </button>
        )}
        <span>Information</span>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-16 gap-y-24 px-8 sm:px-12 py-16">
        {projects.map((project, i) => {
          const matches = active === 'All' || project.categories.includes(active);
          const isSelected = project.slug === selectedSlug;
          const visible = matches && (!selectedProject || isSelected);

          return (
            <a
              key={project.id}
              href={`/work/${project.slug}`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                if (!selectedProject) openProject(project.slug, e.currentTarget);
              }}
              className={`group block ${visible ? '' : 'pointer-events-none'}`}
            >
              <motion.div animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 0.3 }}>
                <span className="block text-[10px] text-neutral-500 mb-2">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <div className="aspect-[3/4] w-40 bg-neutral-100 overflow-hidden">
                  <img
                    src={project.cover}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[0.98]"
                  />
                </div>
              </motion.div>
            </a>
          );
        })}
      </section>

      <AnimatePresence>
        {selectedProject && anchorRect && (
          <>
            <motion.div
              key="description"
              variants={fadeIn}
              initial="hidden"
              animate="show"
              exit="hidden"
              style={{
                position: 'fixed',
                left: Math.max(16, anchorRect.left),
                ...(expandDown
                  ? { top: anchorRect.bottom + 24 }
                  : { bottom: window.innerHeight - anchorRect.top + 24 }),
                maxWidth: 280,
              }}
              className="z-20"
            >
              <h1 className="text-sm font-medium">{selectedProject.title}</h1>
              {selectedProject.description && (
                <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
                  {selectedProject.description}
                </p>
              )}
            </motion.div>

            {restImages.length > 0 && (
              <motion.div
                key="gallery"
                variants={galleryContainer}
                initial="hidden"
                animate="show"
                exit="hidden"
                style={{
                  position: 'fixed',
                  top: anchorRect.top,
                  ...(expandRight
                    ? { left: anchorRect.right + 24 }
                    : { right: window.innerWidth - anchorRect.left + 24 }),
                  maxWidth: expandRight
                    ? window.innerWidth - anchorRect.right - 40
                    : anchorRect.left - 40,
                }}
                className="z-20 flex gap-2 overflow-x-auto"
              >
                {restImages.map((src, i) => (
                  <motion.img
                    key={i}
                    variants={galleryItem}
                    src={src}
                    alt={`${selectedProject.title} ${i + 2}`}
                    style={{ height: anchorRect.height }}
                    className="w-auto object-cover shrink-0"
                  />
                ))}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </main>
  );
}