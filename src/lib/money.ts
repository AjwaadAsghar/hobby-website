/** All money is stored as integer minor units (paisa / cents). */

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, locale: string, fraction: number) {
  const key = `${currency}|${locale}|${fraction}`;
  let f = formatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: fraction,
        maximumFractionDigits: fraction,
      });
    } catch {
      f = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: fraction,
        maximumFractionDigits: fraction,
      });
    }
    formatters.set(key, f);
  }
  return f;
}

export type MoneyFormat = { currency: string; locale: string };

/** Formats minor units; whole amounts drop the decimals (Rs 4,500 not Rs 4,500.00). */
export function formatMoney(minor: number, fmt: MoneyFormat): string {
  const major = minor / 100;
  const fraction = Number.isInteger(major) ? 0 : 2;
  return getFormatter(fmt.currency, fmt.locale, fraction).format(major);
}

export function toMinor(major: number | string): number {
  const n = typeof major === "string" ? Number(major.replace(/,/g, "")) : major;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function toMajor(minor: number | null | undefined): number {
  return (minor ?? 0) / 100;
}
