"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider, type PublicStore } from "@/components/store-context";

export function Providers({ store, children }: { store: PublicStore; children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <StoreProvider value={store}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontSize: "1rem" } }} />
        </TooltipProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
