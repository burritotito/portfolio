'use client';

import { motion, type Variants } from 'motion/react';
import type { Project } from '@/data/projects';
import type { Mode, Rect } from './canvas-types';

type ProjectOverlayProps = {
  project: Project;
  mode: Mode;
  anchorRect: Rect;
  expandDown: boolean;
  expandRight: boolean;
  selectedMediaIndex: number;
  onFocusMedia: (index: number) => void;
};

const GAP = 24;

const descVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

function galleryItemVariants(expandRight: boolean): Variants {
  return {
    hidden: { opacity: 0, x: expandRight ? -24 : 24 },
    show: { opacity: 1, x: 0 },
  };
}

export default function ProjectOverlay({
  project,
  mode,
  anchorRect,
  expandDown,
  expandRight,
  selectedMediaIndex,
  onFocusMedia,
}: ProjectOverlayProps) {
  const images = project.images && project.images.length > 0 ? project.images : [project.cover];
  const supportingImages = images.slice(1);

  const descStyle: React.CSSProperties = expandDown
    ? { position: 'absolute', top: anchorRect.top + anchorRect.height + GAP, left: anchorRect.left }
    : {
        position: 'absolute',
        top: anchorRect.top - GAP,
        left: anchorRect.left,
        transform: 'translateY(-100%)',
      };

  if (mode === 'expanded') {
    const galleryStyle: React.CSSProperties = expandRight
      ? { position: 'absolute', top: anchorRect.top, left: anchorRect.left + anchorRect.width + GAP }
      : {
          position: 'absolute',
          top: anchorRect.top,
          left: anchorRect.left - GAP,
          transform: 'translateX(-100%)',
        };

    return (
      <>
        <motion.div
          variants={descVariants}
          initial="hidden"
          animate="show"
          exit="hidden"
          style={{ ...descStyle, maxWidth: 260 }}
          className="z-10"
        >
          <h1 className="text-sm font-medium">{project.title}</h1>
          {project.description && (
            <p className="mt-2 text-xs text-neutral-600 leading-relaxed">{project.description}</p>
          )}
        </motion.div>

        {supportingImages.length > 0 && (
          <div
            style={{ ...galleryStyle, flexDirection: expandRight ? 'row' : 'row-reverse' }}
            className="z-10 flex gap-2"
          >
            {supportingImages.map((src, i) => {
              const mediaIndex = i + 1;
              return (
                <motion.img
                  key={mediaIndex}
                  layoutId={`media-${project.slug}-${mediaIndex}`}
                  src={src}
                  alt={`${project.title} ${mediaIndex + 1}`}
                  variants={galleryItemVariants(expandRight)}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  transition={{ delay: i * 0.12, duration: 0.4, ease: 'easeOut' }}
                  onClick={() => onFocusMedia(mediaIndex)}
                  style={{ height: anchorRect.height, width: 'auto' }}
                  className="object-cover shrink-0 cursor-pointer"
                />
              );
            })}
          </div>
        )}
      </>
    );
  }

  // mode === 'focused'
  const otherIndexes = images.map((_, i) => i).filter((i) => i !== selectedMediaIndex);

  return (
    <motion.div
      style={{ ...descStyle, maxWidth: 520 }}
      className="z-10 flex flex-col gap-4"
      initial={false}
    >
      <div style={{ maxWidth: 320 }}>
        <h1 className="text-sm font-medium">{project.title}</h1>
        {project.description && (
          <p className="mt-2 text-xs text-neutral-600 leading-relaxed">{project.description}</p>
        )}
      </div>

      <div className={`flex items-start gap-3 ${expandRight ? '' : 'flex-row-reverse'}`}>
        <motion.img
          layoutId={`media-${project.slug}-${selectedMediaIndex}`}
          src={images[selectedMediaIndex]}
          alt={project.title}
          style={{ maxHeight: 'clamp(260px, 48vh, 480px)', width: 'auto' }}
          className="object-cover"
        />
        {otherIndexes.length > 0 && (
          <div className="flex flex-col gap-2">
            {otherIndexes.map((i) => (
              <motion.img
                key={i}
                layoutId={`media-${project.slug}-${i}`}
                src={images[i]}
                alt={`${project.title} ${i + 1}`}
                onClick={() => onFocusMedia(i)}
                style={{ maxHeight: 'clamp(50px, 9vh, 90px)', width: 'auto' }}
                className="object-cover cursor-pointer"
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}