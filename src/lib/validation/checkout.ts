import { z } from "zod";

/** Shared by the checkout form (client) and the order API (server). Plain-English messages. */

export function phoneDigits(v: string) {
  return v.replace(/\D/g, "");
}

export const customerDetailsSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80, "That name is too long."),
  phone: z
    .string()
    .trim()
    .min(1, "Please enter your phone number so the courier can call you.")
    .refine((v) => {
      const d = phoneDigits(v);
      return d.length >= 10 && d.length <= 13;
    }, "Please enter a valid phone number, for example 0300 1234567."),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Please check your email address, for example name@example.com.")
    .optional()
    .default(""),
  address: z
    .string()
    .trim()
    .min(8, "Please enter your full address, including house number and street.")
    .max(300, "Please shorten the address a little."),
  city: z.string().trim().min(2, "Please enter your city.").max(60),
  notes: z.string().trim().max(500, "Please keep notes under 500 characters.").optional().default(""),
});

export type CustomerDetails = z.infer<typeof customerDetailsSchema>;

export const checkoutSchema = customerDetailsSchema.extend({
  paymentMethod: z.string().min(1, "Please choose how you would like to pay.").max(40),
  discountCode: z.string().trim().max(40).optional().default(""),
  saveAddress: z.boolean().optional().default(false),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1).max(40),
        variantId: z.string().min(1).max(40).nullable(),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(50),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Turns Zod issues into { field: message } for showing next to each field. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
