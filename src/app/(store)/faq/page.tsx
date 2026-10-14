import { CmsPage, cmsMetadata } from "@/components/store/cms-page";

export function generateMetadata() {
  return cmsMetadata("faq");
}

export default function FaqPage() {
  return <CmsPage slug="faq" />;
}
