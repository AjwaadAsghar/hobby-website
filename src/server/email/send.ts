import "server-only";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { getSettings, siteUrl } from "@/lib/settings";
import { readableOn, safeHex } from "@/lib/color";
import { integrations, logIntegration } from "@/server/integration-log";
import type { EmailBrand } from "@/emails/layout";

export async function getEmailBrand(): Promise<EmailBrand> {
  const s = await getSettings();
  const accent = safeHex(s.branding.accentColor);
  const base = siteUrl();
  const logo = s.branding.logoUrl;
  return {
    storeName: s.branding.storeName,
    accent,
    accentText: readableOn(accent),
    logoUrl: logo ? (logo.startsWith("http") ? logo : `${base}${logo}`) : "",
    siteUrl: base,
    phone: s.contact.phone,
    email: s.contact.email,
    whatsapp: s.contact.whatsapp,
  };
}

/**
 * Sends an email with Resend. Without RESEND_API_KEY the email is printed to
 * the terminal and saved in the EmailLog table (Admin → Integrations → Email
 * log) so nothing is lost. Never throws.
 */
export async function sendEmail(opts: { to: string; subject: string; react: React.ReactElement; replyTo?: string }): Promise<boolean> {
  let html = "";
  try {
    html = await render(opts.react);
  } catch (err) {
    await logIntegration("resend", "FAILED", `Could not build email "${opts.subject}": ${(err as Error).message}`);
    return false;
  }

  if (!integrations.resend()) {
    console.log(`\n[email] (no RESEND_API_KEY - logged only)\n  To: ${opts.to}\n  Subject: ${opts.subject}\n`);
    await db.emailLog.create({ data: { to: opts.to, subject: opts.subject, html, status: "LOGGED" } }).catch(() => {});
    await logIntegration("resend", "SKIPPED", `Not configured - email "${opts.subject}" to ${opts.to} saved to the email log.`);
    return true;
  }

  try {
    const s = await getSettings();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.EMAIL_FROM || "onboarding@resend.dev";
    const { error } = await resend.emails.send({
      from: `${s.branding.storeName.replace(/["<>]/g, "")} <${fromAddress}>`,
      to: opts.to,
      subject: opts.subject,
      html,
      replyTo: opts.replyTo ?? (s.contact.email || undefined),
    });
    if (error) throw new Error(error.message);
    await db.emailLog.create({ data: { to: opts.to, subject: opts.subject, html, status: "SENT" } }).catch(() => {});
    await logIntegration("resend", "OK", `Sent "${opts.subject}" to ${opts.to}`);
    return true;
  } catch (err) {
    const message = (err as Error).message;
    await db.emailLog.create({ data: { to: opts.to, subject: opts.subject, html, status: "FAILED", error: message } }).catch(() => {});
    await logIntegration("resend", "FAILED", `Could not send "${opts.subject}" to ${opts.to}: ${message}`);
    return false;
  }
}
