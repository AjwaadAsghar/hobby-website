import { CmsPage, cmsMetadata } from "@/components/store/cms-page";

export function generateMetadata() {
  return cmsMetadata("returns-policy");
}

export default function ReturnsPolicyPage() {
  return <CmsPage slug="returns-policy" />;
}
