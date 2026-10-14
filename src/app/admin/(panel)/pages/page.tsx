import Link from "next/link";
import { db } from "@/lib/db";
import { defaultPages } from "@/config/default-pages";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/admin/admin-shell";

export const metadata = { title: "Pages" };

export default async function PagesPage() {
  const pages = await db.page.findMany();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Pages" description="Information pages linked from the footer." />
      <ul className="divide-y rounded-2xl border bg-card shadow-sm">
        {Object.entries(defaultPages).map(([slug, def]) => {
          const p = pages.find((x) => x.slug === slug);
          return (
            <li key={slug} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{p?.title ?? def.title}</p>
                <p className="text-sm text-muted-foreground">
                  /{slug}
                  {p && ` · updated ${formatDate(p.updatedAt)}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/${slug}`} target="_blank" className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold hover:bg-muted">
                  View
                </Link>
                <Link href={`/admin/pages/${slug}`} className="inline-flex h-10 items-center rounded-lg border-2 border-input px-3 text-sm font-semibold hover:bg-muted">
                  Edit
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
