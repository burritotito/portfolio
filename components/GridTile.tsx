'use client';

import { motion } from 'motion/react';
import type { Project } from '@/data/projects';
import type { Mode } from './canvas-types';

type GridTileProps = {
  project: Project;
  index: number;
  visible: boolean;
  mode: Mode;
  isSelected: boolean;
  onOpen: (slug: string) => void;
  onFocusCover: () => void;
  registerRef: (slug: string, el: HTMLDivElement | null) => void;
};

export default function GridTile({
  project,
  index,
  visible,
  mode,
  isSelected,
  onOpen,
  onFocusCover,
  registerRef,
}: GridTileProps) {
  const clickable = (mode === 'overview' && visible) || (mode === 'expanded' && isSelected);
  const isFocusedAway = mode === 'focused' && isSelected;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (mode === 'overview' && visible) {
      e.preventDefault();
      onOpen(project.slug);
    } else if (mode === 'expanded' && isSelected) {
      e.preventDefault();
      onFocusCover();
    } else {
      e.preventDefault();
    }
  };

  return (
    <a
      href={`/work/${project.slug}`}
      onClick={handleClick}
      className={`group block ${clickable ? '' : 'pointer-events-none'}`}
    >
      <motion.div animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 0.3 }}>
        <span className="block text-[10px] text-neutral-500 mb-2">
          {String(index + 1).padStart(2, '0')}.
        </span>
        <div
          ref={(el) => registerRef(project.slug, el)}
          className="overflow-hidden bg-neutral-100"
          style={{ width: 'clamp(70px, 6vw, 108px)', aspectRatio: '3 / 4' }}
        >
          {!isFocusedAway && (
            <motion.img
              layoutId={`media-${project.slug}-0`}
              src={project.cover}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[0.98]"
            />
          )}
        </div>
      </motion.div>
    </a>
  );
}