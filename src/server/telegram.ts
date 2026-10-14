import "server-only";
import { integrations, logIntegration } from "@/server/integration-log";

export function tgEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Sends an HTML-formatted Telegram message. Skips quietly when not configured. Never throws. */
export async function sendTelegram(html: string): Promise<boolean> {
  if (!integrations.telegram()) {
    await logIntegration("telegram", "SKIPPED", "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set - message not sent.");
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: html.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || !data.ok) throw new Error(data.description ?? `HTTP ${res.status}`);
    await logIntegration("telegram", "OK", "Message sent");
    return true;
  } catch (err) {
    await logIntegration("telegram", "FAILED", `Telegram error: ${(err as Error).message}`);
    return false;
  }
}
