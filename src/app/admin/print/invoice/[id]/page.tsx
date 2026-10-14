import { PrintDocument } from "@/components/admin/print-document";

export const metadata = { title: "Invoice", robots: { index: false } };

export default async function InvoicePage({ params }: PageProps<"/admin/print/invoice/[id]">) {
  const { id } = await params;
  return <PrintDocument id={id} kind="invoice" />;
}
