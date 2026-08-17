import { getProjectsWithGallery } from '@/lib/get-projects';
import PortfolioGallery from '@/components/PortfolioGallery';
import LoadingScreen from '@/components/LoadingScreen';

export default function Page() {
  const projects = getProjectsWithGallery();

  return (
    <>
      <LoadingScreen coverImages={projects.map((project) => project.cover)} />
      <PortfolioGallery projects={projects} />
    </>
  );
}
