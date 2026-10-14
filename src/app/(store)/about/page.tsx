import { CmsPage, cmsMetadata } from "@/components/store/cms-page";

export function generateMetadata() {
  return cmsMetadata("about");
}

export default function AboutPage() {
  return <CmsPage slug="about" />;
}
