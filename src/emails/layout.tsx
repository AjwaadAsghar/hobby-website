import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";

export type EmailBrand = {
  storeName: string;
  accent: string;
  accentText: string;
  logoUrl: string;
  siteUrl: string;
  phone: string;
  email: string;
  whatsapp: string;
};

export function EmailLayout({ brand, preview, children }: { brand: EmailBrand; preview: string; children: React.ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "Arial, Helvetica, sans-serif", margin: 0, padding: "24px 0", color: "#18181b" }}>
        <Container style={{ maxWidth: 600, backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden" }}>
          <Section style={{ backgroundColor: "#18181b", padding: "20px 28px" }}>
            {brand.logoUrl ? (
              <Img src={brand.logoUrl} alt={brand.storeName} height="40" />
            ) : (
              <Text style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#ffffff" }}>
                <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, backgroundColor: brand.accent, marginRight: 8 }} />
                {brand.storeName}
              </Text>
            )}
          </Section>
          <Section style={{ padding: "28px" }}>{children}</Section>
          <Hr style={{ borderColor: "#e4e4e7", margin: 0 }} />
          <Section style={{ padding: "20px 28px" }}>
            <Text style={{ fontSize: 15, color: "#52525b", margin: "0 0 6px" }}>
              Questions? Reply to this email{brand.phone ? `, call ${brand.phone}` : ""}
              {brand.whatsapp ? (
                <>
                  {" "}
                  or <Link href={`https://wa.me/${brand.whatsapp.replace(/\D/g, "")}`} style={{ color: "#18181b", fontWeight: 700 }}>chat on WhatsApp</Link>
                </>
              ) : null}
              .
            </Text>
            <Text style={{ fontSize: 13, color: "#71717a", margin: 0 }}>
              <Link href={brand.siteUrl} style={{ color: "#71717a" }}>
                {brand.storeName}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const text = { fontSize: 16, lineHeight: "26px", margin: "0 0 14px", color: "#18181b" } as const;
export const heading = { fontSize: 26, lineHeight: "32px", fontWeight: 800, margin: "0 0 12px", color: "#18181b" } as const;

export function EmailButton({ href, label, brand }: { href: string; label: string; brand: EmailBrand }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        backgroundColor: brand.accent,
        color: brand.accentText,
        fontWeight: 700,
        fontSize: 17,
        padding: "14px 26px",
        borderRadius: 12,
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}
