import { CmsPage, cmsMetadata } from "@/components/store/cms-page";
import { ContactForm } from "./contact-form";

export function generateMetadata() {
  return cmsMetadata("contact");
}

export default function ContactPage() {
  return (
    <CmsPage slug="contact">
      <section className="mt-12 rounded-3xl border p-6 sm:p-8" aria-labelledby="contact-form-heading">
        <h2 id="contact-form-heading" className="text-2xl font-bold">
          Send us a message
        </h2>
        <p className="mt-2 mb-6 text-lg text-muted-foreground">We usually reply within a few hours during shop hours.</p>
        <ContactForm />
      </section>
    </CmsPage>
  );
}
