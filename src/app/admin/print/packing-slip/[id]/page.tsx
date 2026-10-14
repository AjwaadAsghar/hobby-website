import { PrintDocument } from "@/components/admin/print-document";

export const metadata = { title: "Packing slip", robots: { index: false } };

export default async function PackingSlipPage({ params }: PageProps<"/admin/print/packing-slip/[id]">) {
  const { id } = await params;
  return <PrintDocument id={id} kind="packing-slip" />;
}
