import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { WhatsAppButton } from "@/components/store/whatsapp-button";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { getSettings } from "@/lib/settings";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const s = await getSettings();
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton number={s.contact.whatsapp} storeName={s.branding.storeName} />
      <SmoothScroll />
    </>
  );
}
