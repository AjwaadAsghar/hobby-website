import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { NotFoundContent } from "@/components/store/not-found-content";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  );
}
