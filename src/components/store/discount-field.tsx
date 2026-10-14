"use client";

import { useState } from "react";
import { cart } from "@/lib/cart/cart-store";
import type { ClientQuote } from "@/lib/cart/use-quote";

export function DiscountField({ code, quote }: { code: string; quote: ClientQuote | null }) {
  const [value, setValue] = useState(code);
  const d = quote?.discount;
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          cart.setDiscountCode(value);
        }}
      >
        <label htmlFor="discount-code" className="mb-2 block font-semibold">
          Discount code
        </label>
        <div className="flex gap-2">
          <input
            id="discount-code"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            autoComplete="off"
            aria-invalid={d ? !d.valid : undefined}
            aria-describedby="discount-msg"
            placeholder="e.g. WELCOME10"
            className="h-12 min-w-0 flex-1 rounded-xl border-2 border-input bg-background px-4 text-base uppercase placeholder:normal-case"
          />
          <button type="submit" className="h-12 rounded-xl bg-foreground px-5 font-semibold text-background hover:opacity-90">
            Apply
          </button>
        </div>
      </form>
      <div id="discount-msg" role="status" className="mt-2 min-h-6">
        {d && (
          <p className={d.valid ? "font-medium text-success" : "font-medium text-destructive"}>
            {d.message}{" "}
            <button
              type="button"
              onClick={() => {
                setValue("");
                cart.setDiscountCode("");
              }}
              className="underline underline-offset-4"
            >
              Remove code
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
