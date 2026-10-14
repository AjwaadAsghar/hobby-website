import { notFound } from "next/navigation";
import { getCmsPage } from "@/server/pages";
import { formatDate } from "@/lib/format";

export async function CmsPage({ slug, children }: { slug: string; children?: React.ReactNode }) {
  const page = await getCmsPage(slug);
  if (!page) notFound();
  return (
    <div className="container-store max-w-4xl py-12">
      <h1 className="text-4xl font-bold sm:text-5xl">{page.title}</h1>
      <div className="prose-store mt-8 text-lg" dangerouslySetInnerHTML={{ __html: page.html }} />
      {children}
      {page.updatedAt && <p className="mt-12 text-muted-foreground">Last updated {formatDate(page.updatedAt)}</p>}
    </div>
  );
}

export async function cmsMetadata(slug: string) {
  const page = await getCmsPage(slug);
  return { title: page?.title ?? "Page", alternates: { canonical: `/${slug}` } };
}
