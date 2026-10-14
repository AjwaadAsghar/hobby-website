import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = {
  title: "Track my order",
  description: "Check the status of your order with your order number and phone number.",
};

export default async function TrackPage({ searchParams }: PageProps<"/track">) {
  const sp = await searchParams;
  const order = typeof sp.order === "string" ? sp.order.replace(/\D/g, "") : "";
  return (
    <div className="container-store max-w-5xl py-12">
      <h1 className="text-4xl font-bold sm:text-5xl">Track my order</h1>
      <p className="mt-3 mb-8 text-lg text-muted-foreground">Enter your order number and phone number to see where your order is.</p>
      <TrackForm defaultNumber={order} />
    </div>
  );
}
