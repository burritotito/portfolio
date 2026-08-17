import fs from 'node:fs';
import path from 'node:path';

const NUMBERED_IMAGE_PATTERN = /^(\d+)\.(jpe?g|png|mp4)$/i;

function discoverNumberedImages(slug: string): string[] {
  const dir = path.join(process.cwd(), 'public', 'work', slug);

  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return [];
  }

  return entries
    .map((name) => {
      const match = name.match(NUMBERED_IMAGE_PATTERN);
      return match ? { name, index: parseInt(match[1], 10) } : null;
    })
    .filter((entry): entry is { name: string; index: number } => entry !== null)
    .sort((a, b) => a.index - b.index)
    .map((entry) => `/work/${slug}/${entry.name}`);
}

// Rule: discovered numbered images − explicit cover = supporting images.
export function discoverSupportingImages(slug: string, cover: string): string[] {
  return discoverNumberedImages(slug).filter((src) => src !== cover);
}

// Videos have no built-in static thumbnail. A poster frame extracted once
// via `qlmanage -t` (macOS QuickLook) lands next to the source file as
// `<original filename>.png` — e.g. `010.mp4` -> `010.mp4.png`, which can't
// collide with NUMBERED_IMAGE_PATTERN since that regex requires the digits
// to be followed by exactly one extension, not two. Looked up by that
// convention and only surfaced when the file actually exists on disk, so a
// video added without a generated poster degrades gracefully instead of
// pointing at a 404.
export function discoverPosters(slug: string): Record<string, string> {
  const dir = path.join(process.cwd(), 'public', 'work', slug);
  const posters: Record<string, string> = {};

  for (const src of discoverNumberedImages(slug)) {
    if (!/\.mp4$/i.test(src)) continue;
    const name = path.basename(src);
    if (fs.existsSync(path.join(dir, `${name}.png`))) {
      posters[src] = `/work/${slug}/${name}.png`;
    }
  }

  return posters;
}
