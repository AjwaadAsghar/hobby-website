import type { Metadata } from "next";
import { parseListingParams } from "@/server/catalog";
import { ProductListing } from "@/components/store/product-listing";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "RC cars, planes, drones, helicopters, boats, parts, batteries and radios.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const filters = parseListingParams(sp);
  return (
    <ProductListing
      filters={filters}
      searchParams={sp}
      basePath="/shop"
      title="All products"
      description="Everything in stock, from first-time flyers to full-power race machines."
      showCategoryFilter
    />
  );
}
