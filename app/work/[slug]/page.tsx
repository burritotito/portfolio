import { getProjectsWithGallery } from '@/lib/get-projects';
import PortfolioGallery from '@/components/PortfolioGallery';
import LoadingScreen from '@/components/LoadingScreen';

export default async function WorkSlugPage(props: PageProps<'/work/[slug]'>) {
  const { slug } = await props.params;
  const projects = getProjectsWithGallery();

  return (
    <>
      <LoadingScreen coverImages={projects.map((project) => project.cover)} />
      <PortfolioGallery projects={projects} initialSlug={slug} />
    </>
  );
}
