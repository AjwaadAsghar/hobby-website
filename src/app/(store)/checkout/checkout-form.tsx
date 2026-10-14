"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Banknote, Check, Copy, Landmark, Loader2, Lock, Smartphone, Upload } from "lucide-react";
import { cart, useCart } from "@/lib/cart/cart-store";
import { useQuote } from "@/lib/cart/use-quote";
import { useMoney } from "@/components/store-context";
import { CheckoutSteps } from "@/components/store/checkout-steps";
import { ProductImage } from "@/components/store/product-image";
import { DiscountField } from "@/components/store/discount-field";
import { customerDetailsSchema, fieldErrors, type CustomerDetails } from "@/lib/validation/checkout";
import type { PaymentPublicInfo } from "@/lib/payments/types";
import { cn } from "@/lib/utils";

type SavedAddress = { id: string; label: string; name: string; phone: string; address: string; city: string };

const DETAILS_KEY = "checkout-details-v1";
const methodIcons: Record<string, typeof Banknote> = { cod: Banknote, bank: Landmark, jazzcash: Smartphone, easypaisa: Smartphone };

function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-lg font-semibold">
        {label} {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mb-2 text-[0.95rem] text-muted-foreground">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 font-medium text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err?: string) =>
  cn(
    "w-full rounded-xl border-2 bg-background px-4 text-base outline-none focus:border-foreground",
    err ? "border-destructive" : "border-input",
  );

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border-2 border-input px-3 text-sm font-semibold hover:bg-muted"
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function CheckoutForm({
  methods,
  cities,
  signedIn,
  customer,
  addresses,
}: {
  methods: PaymentPublicInfo[];
  cities: string[];
  signedIn: boolean;
  customer: { name: string; email: string; phone: string } | null;
  addresses: SavedAddress[];
}) {
  const router = useRouter();
  const money = useMoney();
  const { lines, discountCode } = useCart();
  const [step, setStep] = useState<"details" | "payment">("details");
  const [details, setDetails] = useState<CustomerDetails>({ name: "", phone: "", email: "", address: "", city: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [method, setMethod] = useState(methods[0]?.id ?? "");
  const [proof, setProof] = useState<File | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<{ message: string; problems?: string[] } | null>(null);
  const [cityForQuote, setCityForQuote] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { quote, loading } = useQuote(lines, discountCode, cityForQuote);

  // Prefill from last visit, saved address or account.
  useEffect(() => {
    let initial: Partial<CustomerDetails> = {};
    try {
      initial = JSON.parse(localStorage.getItem(DETAILS_KEY) ?? "{}");
    } catch {}
    const a = addresses[0];
    const merged = {
      name: initial.name || a?.name || customer?.name || "",
      phone: initial.phone || a?.phone || customer?.phone || "",
      email: initial.email || customer?.email || "",
      address: initial.address || a?.address || "",
      city: initial.city || a?.city || "",
      notes: "",
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetails(merged);
    setCityForQuote(merged.city);
  }, [addresses, customer]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const set = (k: keyof CustomerDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDetails((d) => ({ ...d, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: "" }));
  };

  function goToPayment(e: React.FormEvent) {
    e.preventDefault();
    const res = customerDetailsSchema.safeParse(details);
    if (!res.success) {
      const errs = fieldErrors(res.error);
      setErrors(errs);
      const first = Object.keys(errs)[0];
      document.getElementById(`co-${first}`)?.focus();
      return;
    }
    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify({ ...res.data, notes: "" }));
    } catch {}
    setDetails(res.data);
    setCityForQuote(res.data.city);
    setStep("payment");
    window.scrollTo({ top: 0 });
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!method) {
      setFormError({ message: "Please choose how you would like to pay." });
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          paymentMethod: method,
          discountCode: quote?.discount?.valid ? discountCode : "",
          saveAddress: signedIn && saveAddress,
          lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        number?: number;
        token?: string;
        redirectUrl?: string | null;
        error?: string;
        fieldErrors?: Record<string, string>;
        problems?: string[];
      };
      if (!res.ok || !data.ok) {
        if (data.fieldErrors && Object.keys(data.fieldErrors).some((k) => k in details)) {
          setErrors(data.fieldErrors);
          setStep("details");
        }
        setFormError({ message: data.error ?? "Something went wrong. Please try again.", problems: data.problems });
        setSubmitting(false);
        return;
      }
      if (proof) {
        const fd = new FormData();
        fd.set("number", String(data.number));
        fd.set("token", data.token!);
        fd.set("file", proof);
        await fetch("/api/orders/proof", { method: "POST", body: fd }).catch(() => null);
      }
      cart.clear();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      router.push(`/order/confirmation?n=${data.number}&t=${encodeURIComponent(data.token!)}`);
    } catch {
      setFormError({ message: "We could not reach the server. Please check your internet connection and try again." });
      setSubmitting(false);
    }
  }

  if (!lines.length && !submitting) {
    return (
      <div className="container-store py-16 text-center">
        <CheckoutSteps current={2} />
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-lg text-muted-foreground">Add something to your cart before checking out.</p>
        <Link href="/shop" className="mt-6 inline-flex h-14 items-center rounded-xl bg-brand px-8 text-lg font-semibold text-brand-foreground">
          Go to the shop
        </Link>
      </div>
    );
  }

  const selected = methods.find((m) => m.id === method);
  const discount = quote?.discount?.valid ? quote.discount.amount : 0;

  return (
    <div className="container-store py-10">
      <CheckoutSteps current={step === "details" ? 2 : 3} />
      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          {formError && (
            <div role="alert" className="mb-6 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5">
              <p className="flex items-center gap-2 text-lg font-semibold text-destructive">
                <AlertTriangle className="size-5" aria-hidden /> {formError.message}
              </p>
              {formError.problems && formError.problems.length > 0 && (
                <>
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    {formError.problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <Link href="/cart" className="mt-3 inline-block font-semibold underline underline-offset-4">
                    Review my cart
                  </Link>
                </>
              )}
            </div>
          )}

          {step === "details" ? (
            <form onSubmit={goToPayment} noValidate className="space-y-6">
              <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none sm:text-4xl">
                Your details
              </h1>
              <p className="text-lg text-muted-foreground">
                No account needed.{" "}
                {!signedIn && (
                  <>
                    Already have one?{" "}
                    <Link href="/account/login?next=/checkout" className="font-semibold text-foreground underline underline-offset-4">
                      Sign in
                    </Link>
                  </>
                )}
              </p>

              {Object.values(errors).some(Boolean) && (
                <div role="alert" className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4 font-medium text-destructive">
                  Please fix the {Object.values(errors).filter(Boolean).length === 1 ? "problem" : "problems"} highlighted below.
                </div>
              )}

              {addresses.length > 0 && (
                <fieldset>
                  <legend className="mb-2 text-lg font-semibold">Use a saved address</legend>
                  <div className="flex flex-wrap gap-2">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setDetails((d) => ({ ...d, name: a.name, phone: a.phone, address: a.address, city: a.city }));
                          setErrors({});
                        }}
                        className="rounded-xl border-2 border-input px-4 py-2 text-left hover:border-foreground"
                      >
                        <span className="block font-semibold">{a.label}</span>
                        <span className="block text-sm text-muted-foreground">
                          {a.address}, {a.city}
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <Field id="co-name" label="Full name" error={errors.name}>
                <input
                  id="co-name"
                  value={details.name}
                  onChange={set("name")}
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "co-name-error" : undefined}
                  className={cn(inputCls(errors.name), "h-13")}
                />
              </Field>
              <Field id="co-phone" label="Phone number" hint="The courier will call this number. Example: 0300 1234567" error={errors.phone}>
                <input
                  id="co-phone"
                  type="tel"
                  inputMode="tel"
                  value={details.phone}
                  onChange={set("phone")}
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  aria-describedby={`co-phone-hint${errors.phone ? " co-phone-error" : ""}`}
                  className={cn(inputCls(errors.phone), "h-13")}
                />
              </Field>
              <Field id="co-email" label="Email" optional hint="We will send your order confirmation here." error={errors.email}>
                <input
                  id="co-email"
                  type="email"
                  inputMode="email"
                  value={details.email}
                  onChange={set("email")}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={`co-email-hint${errors.email ? " co-email-error" : ""}`}
                  className={cn(inputCls(errors.email), "h-13")}
                />
              </Field>
              <Field id="co-address" label="Full address" hint="House number, street, area and any landmark." error={errors.address}>
                <textarea
                  id="co-address"
                  rows={3}
                  value={details.address}
                  onChange={set("address")}
                  autoComplete="street-address"
                  aria-invalid={!!errors.address}
                  aria-describedby={`co-address-hint${errors.address ? " co-address-error" : ""}`}
                  className={cn(inputCls(errors.address), "py-3")}
                />
              </Field>
              <Field id="co-city" label="City" error={errors.city}>
                <input
                  id="co-city"
                  list="city-list"
                  value={details.city}
                  onChange={set("city")}
                  onBlur={() => setCityForQuote(details.city)}
                  autoComplete="address-level2"
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? "co-city-error" : undefined}
                  className={cn(inputCls(errors.city), "h-13")}
                />
                <datalist id="city-list">
                  {cities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field id="co-notes" label="Notes for us" optional hint="For example: please call before delivery." error={errors.notes}>
                <textarea id="co-notes" rows={2} value={details.notes} onChange={set("notes")} aria-describedby="co-notes-hint" className={cn(inputCls(errors.notes), "py-3")} />
              </Field>
              {signedIn && (
                <label className="flex items-center gap-3 text-lg">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="size-5 accent-[var(--brand)]" />
                  Save this address to my account
                </label>
              )}
              <button type="submit" className="h-14 w-full rounded-xl bg-brand text-lg font-semibold text-brand-foreground shadow-sm hover:brightness-110 sm:w-auto sm:px-10">
                Continue to payment
              </button>
            </form>
          ) : (
            <form onSubmit={placeOrder} className="space-y-6">
              <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none sm:text-4xl">
                How would you like to pay?
              </h1>
              <div className="rounded-2xl border bg-muted/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p>
                    <strong>Delivering to:</strong> {details.name}, {details.phone}
                    <br />
                    {details.address}, {details.city}
                  </p>
                  <button type="button" onClick={() => setStep("details")} className="font-semibold underline underline-offset-4">
                    Change
                  </button>
                </div>
              </div>

              {methods.length === 0 ? (
                <p role="alert" className="text-lg font-medium text-destructive">
                  Online ordering is paused right now. Please contact us on WhatsApp to order.
                </p>
              ) : (
                <fieldset>
                  <legend className="sr-only">Payment method</legend>
                  <div className="space-y-3">
                    {methods.map((m) => {
                      const Icon = methodIcons[m.id] ?? Banknote;
                      const active = method === m.id;
                      return (
                        <label
                          key={m.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition",
                            active ? "border-foreground bg-muted/50" : "border-input hover:border-foreground/50",
                          )}
                        >
                          <input type="radio" name="payment" value={m.id} checked={active} onChange={() => setMethod(m.id)} className="mt-1.5 size-5 accent-[var(--brand)]" />
                          <Icon className="mt-0.5 size-7 shrink-0" aria-hidden />
                          <span>
                            <span className="block text-lg font-semibold">{m.label}</span>
                            <span className="block text-muted-foreground">{m.description}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {selected && (
                <div className="rounded-2xl border-2 border-dashed p-5">
                  <p className="text-lg">{selected.instructions}</p>
                  {selected.details.length > 0 && (
                    <dl className="mt-4 space-y-2">
                      {selected.details.map((d) => (
                        <div key={d.label} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-4 py-3">
                          <div>
                            <dt className="text-sm text-muted-foreground">{d.label}</dt>
                            <dd className="text-lg font-semibold tracking-wide">{d.value}</dd>
                          </div>
                          <CopyButton value={d.value} />
                        </div>
                      ))}
                      {quote && (
                        <div className="rounded-xl bg-brand-soft px-4 py-3">
                          <dt className="text-sm">Amount to send</dt>
                          <dd className="text-xl font-bold">{money(quote.total)}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                  {selected.kind === "manual_proof" && (
                    <div className="mt-5">
                      <label htmlFor="proof" className="block text-lg font-semibold">
                        Upload payment screenshot <span className="font-normal text-muted-foreground">(you can also do this later)</span>
                      </label>
                      <p className="mb-2 text-muted-foreground">A photo or screenshot of the receipt from your banking app.</p>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-input px-4 py-3 hover:bg-muted">
                        <Upload className="size-5 shrink-0" aria-hidden />
                        <span className="font-medium">{proof ? proof.name : "Choose a screenshot"}</span>
                        <input
                          id="proof"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => setProof(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || loading || !quote || methods.length === 0}
                className="flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-brand text-xl font-bold text-brand-foreground shadow-sm hover:brightness-110 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Lock className="size-5" aria-hidden />}
                {submitting ? "Placing your order…" : quote ? `Place order · ${money(quote.total)}` : "Place order"}
              </button>
              <button type="button" onClick={() => setStep("details")} className="h-12 font-semibold underline underline-offset-4">
                ← Back to your details
              </button>
            </form>
          )}
        </div>

        <aside aria-label="Order summary" className="h-fit space-y-4 rounded-3xl border bg-muted/40 p-6 lg:sticky lg:top-40">
          <h2 className="text-2xl font-bold">Order summary</h2>
          <ul className="divide-y">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-3 py-3">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <ProductImage src={l.image} alt="" sizes="64px" />
                  <span className="absolute -top-0 -right-0 flex h-6 min-w-6 items-center justify-center rounded-bl-lg bg-foreground px-1 text-sm font-bold text-background">
                    {l.qty}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-medium">{l.title}</span>
                  {l.variantName && <span className="block text-sm text-muted-foreground">{l.variantName}</span>}
                </span>
                <span className="font-semibold">{money(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <DiscountField code={discountCode} quote={quote} />
          <dl className="space-y-2 text-lg">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-semibold">{quote ? money(quote.subtotal) : "…"}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success">
                <dt>Discount</dt>
                <dd className="font-semibold">−{money(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd className="font-semibold">
                {quote?.shipping ? (quote.shipping.free ? "Free" : money(quote.shipping.amount)) : <span className="font-normal text-muted-foreground">Enter your city</span>}
              </dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-xl">
              <dt className="font-bold">Total</dt>
              <dd className="font-bold">{quote ? money(quote.total) : "…"}</dd>
            </div>
          </dl>
          {quote?.shipping && <p className="text-[0.95rem] text-muted-foreground">Delivery zone: {quote.shipping.zone}</p>}
        </aside>
      </div>
    </div>
  );
}
