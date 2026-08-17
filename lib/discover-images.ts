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
