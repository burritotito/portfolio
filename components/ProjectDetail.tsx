'use client';

import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import Ruler from '@/components/Ruler';
import type { Project } from '@/data/projects';

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function ProjectDetail({
  project,
  onBack,
  embedded = false,
}: {
  project: Project;
  onBack?: () => void;
  embedded?: boolean;
}) {
  const images = project.images && project.images.length > 0 ? project.images : [project.cover];
  const [hero, ...rest] = images;

  const content = (
    <motion.div variants={container} initial="hidden" animate="show" className="px-6 pb-16">
      <motion.div variants={item} className="max-w-md">
        <h1 className="text-sm font-medium">{project.title}</h1>
        {project.description && (
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{project.description}</p>
        )}
      </motion.div>

      <div className="mt-12 flex flex-wrap gap-2">
        <motion.img
          layoutId={`project-${project.slug}`}
          src={hero}
          alt={project.title}
          className="h-64 w-auto object-cover"
        />
        {rest.map((src, i) => (
          <motion.img
            key={i}
            variants={item}
            src={src}
            alt={`${project.title} ${i + 2}`}
            className="h-64 w-auto object-cover"
          />
        ))}
      </div>
    </motion.div>
  );

  if (embedded) return content;

  return (
    <main className="min-h-screen bg-white text-black">
      <Ruler />
      <header className="flex flex-wrap items-baseline justify-between px-6 py-6 text-sm">
        <span className="font-medium">Your Name</span>
        {onBack ? (
          <button onClick={onBack} className="opacity-50 hover:opacity-100 transition-opacity">
            ← Overview
          </button>
        ) : (
          <Link href="/" className="opacity-50 hover:opacity-100 transition-opacity">
            ← Overview
          </Link>
        )}
        <span>Information</span>
      </header>
      {content}
    </main>
  );
}