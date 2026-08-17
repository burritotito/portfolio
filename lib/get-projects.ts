import { projects as baseProjects } from '@/data/projects';
import { discoverSupportingImages, discoverPosters } from '@/lib/discover-images';
import type { ProjectWithGallery } from '@/components/PortfolioGallery';

export function getProjectsWithGallery(): ProjectWithGallery[] {
  return baseProjects.map((project) => ({
    ...project,
    gallery: discoverSupportingImages(project.slug, project.cover),
    posters: discoverPosters(project.slug),
  }));
}
