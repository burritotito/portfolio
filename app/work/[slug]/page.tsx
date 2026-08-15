'use client';

import { useState, ViewTransition } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { projects } from '@/data/projects';
import Ruler from '@/components/Ruler';

const categories = ['All', ...Array.from(new Set(projects.flatMap((p) => p.categories)))];

export default function Home() {
  const [active, setActive] = useState('All');

  return (
    <main className="min-h-screen bg-white text-black">
      <Ruler />

      <header className="flex flex-wrap items-baseline justify-between px-6 py-6 text-sm">
        <span className="font-medium">Your Name</span>
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
        <span>Information</span>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-10 gap-y-20 px-6 py-16">
        {projects.map((project, i) => {
          const matches = active === 'All' || project.categories.includes(active);
          return (
            <Link
              key={project.id}
              href={`/work/${project.slug}`}
              className={`group block ${matches ? '' : 'pointer-events-none'}`}
            >
              <motion.div animate={{ opacity: matches ? 1 : 0 }} transition={{ duration: 0.3 }}>
                <span className="block text-xs text-neutral-500 mb-3">
                  {String(i + 1).padStart(2, '0')}.
                </span>
                <ViewTransition name={`project-${project.slug}`}>
                  <Image
                    src={project.cover}
                    alt={project.title}
                    width={160}
                    height={213}
                    unoptimized
                    className="w-40 h-auto bg-neutral-100 object-cover transition-transform duration-300 group-hover:scale-[0.98]"
                  />
                </ViewTransition>
                <span className="block mt-2 text-xs text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {project.title}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}