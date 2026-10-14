import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { defaultPages } from "@/config/default-pages";
import { PageHeader } from "@/components/admin/admin-shell";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { PageEditor } from "../page-editor";
import { resetPage } from "../actions";

export const metadata = { title: "Edit page" };

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[slug]">) {
  const { slug } = await params;
  const def = defaultPages[slug];
  if (!def) notFound();
  const page = await db.page.findUnique({ where: { slug } });
  return (
    <div className="max-w-4xl">
      <Link href="/admin/pages" className="mb-4 inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All pages
      </Link>
      <PageHeader
        title={`Edit: ${page?.title ?? def.title}`}
        actions={
          <form action={resetPage}>
            <input type="hidden" name="slug" value={slug} />
            <ConfirmSubmit message="Replace this page with the original starter text?" className="inline-flex h-11 items-center rounded-xl border-2 border-input bg-background px-4 font-semibold hover:bg-muted">
              Reset to starter text
            </ConfirmSubmit>
          </form>
        }
      />
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <PageEditor key={page?.updatedAt.toISOString() ?? slug} slug={slug} title={page?.title ?? def.title} content={page?.content ?? def.content} />
      </div>
    </div>
  );
}
