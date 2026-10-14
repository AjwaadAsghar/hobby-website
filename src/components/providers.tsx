"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { StoreProvider, type PublicStore } from "@/components/store-context";

export function Providers({ store, children }: { store: PublicStore; children: React.ReactNode }) {
  // The admin keeps its own light/dark choice, separate from the storefront's.
  // Keying the provider remounts it when crossing between the two, so it
  // re-reads the right saved choice.
  const pathname = usePathname() ?? "/";
  const area = pathname.startsWith("/admin") ? "admin" : "store";
  return (
    <ThemeProvider
      key={area}
      attribute="class"
      defaultTheme={area === "admin" ? "light" : "dark"}
      enableSystem={false}
      storageKey={area === "admin" ? "admin-theme" : "theme"}
      // Invoices and packing slips always print light.
      forcedTheme={pathname.startsWith("/admin/print") ? "light" : undefined}
      disableTransitionOnChange
    >
      <StoreProvider value={store}>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontSize: "1rem" } }} />
        </TooltipProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
