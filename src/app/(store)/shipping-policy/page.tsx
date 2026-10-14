import { CmsPage, cmsMetadata } from "@/components/store/cms-page";

export function generateMetadata() {
  return cmsMetadata("shipping-policy");
}

export default function ShippingPolicyPage() {
  return <CmsPage slug="shipping-policy" />;
}
