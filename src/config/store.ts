/**
 * Store defaults.
 *
 * This is the ONLY place the default store name and branding live. Everything
 * here is copied into the database (Settings table) by the seed script and is
 * used as a fallback when a setting is missing. At runtime always read branding
 * through `getSettings()` (src/lib/settings.ts) so admin changes apply instantly.
 */

export type SocialLinks = {
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  x: string;
};

export type Testimonial = {
  name: string;
  location: string;
  text: string;
  rating: number;
};

export type HomeBanner = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
};

export type BankAccount = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
};

export type WalletAccount = {
  accountTitle: string;
  accountNumber: string;
};

export type StoreSettings = {
  branding: {
    storeName: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
    accentColor: string;
  };
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    social: SocialLinks;
  };
  commerce: {
    currency: string;
    locale: string;
    /** Minor units. 0 disables free shipping. */
    freeShippingThreshold: number;
    lowStockDefault: number;
  };
  payments: {
    cod: { enabled: boolean; instructions: string };
    bank: { enabled: boolean; instructions: string; account: BankAccount };
    jazzcash: { enabled: boolean; instructions: string; account: WalletAccount };
    easypaisa: { enabled: boolean; instructions: string; account: WalletAccount };
  };
  notifications: {
    ownerEmail: string;
    newOrder: { telegram: boolean; email: boolean; push: boolean };
    lowStock: { telegram: boolean; email: boolean; push: boolean };
    paymentProof: { telegram: boolean; email: boolean; push: boolean };
    customerEmails: {
      confirmation: boolean;
      statusUpdates: boolean;
    };
  };
  homepage: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaLabel: string;
    heroCtaHref: string;
    banners: HomeBanner[];
    /** Product ids hand-picked for the "Featured" row. Empty = products marked featured. */
    featuredProductIds: string[];
    testimonials: Testimonial[];
    trustBadges: { title: string; text: string }[];
  };
};

export const storeDefaults: StoreSettings = {
  branding: {
    storeName: "Hobby Shobby",
    tagline: "Genuine RC parts, batteries and electronics",
    logoUrl: "",
    faviconUrl: "",
    accentColor: "#D7261E",
  },
  contact: {
    email: "hello@hobbyshobby.local",
    phone: "+92 300 1234567",
    whatsapp: "923001234567",
    address: "Shop 12, Main Boulevard, Gulberg III, Lahore, Pakistan",
    social: {
      facebook: "",
      instagram: "",
      youtube: "",
      tiktok: "",
      x: "",
    },
  },
  commerce: {
    currency: "PKR",
    locale: "en-PK",
    freeShippingThreshold: 10000_00,
    lowStockDefault: 3,
  },
  payments: {
    cod: {
      enabled: true,
      instructions: "Pay in cash when your parcel arrives. Please keep the exact amount ready.",
    },
    bank: {
      enabled: true,
      instructions:
        "Transfer the order total to the account below, then upload a screenshot of the receipt. We will confirm your order as soon as we see the payment.",
      account: {
        bankName: "Meezan Bank",
        accountTitle: "Your Store Name",
        accountNumber: "0000 0000000000",
        iban: "PK00 MEZN 0000 0000 0000 0000",
      },
    },
    jazzcash: {
      enabled: true,
      instructions: "Send the order total to this JazzCash number, then upload a screenshot of the payment.",
      account: { accountTitle: "Your Store Name", accountNumber: "0300 0000000" },
    },
    easypaisa: {
      enabled: true,
      instructions: "Send the order total to this Easypaisa number, then upload a screenshot of the payment.",
      account: { accountTitle: "Your Store Name", accountNumber: "0345 0000000" },
    },
  },
  notifications: {
    ownerEmail: "owner@hobbyshobby.local",
    newOrder: { telegram: true, email: true, push: true },
    lowStock: { telegram: true, email: false, push: true },
    paymentProof: { telegram: true, email: true, push: true },
    customerEmails: { confirmation: true, statusUpdates: true },
  },
  homepage: {
    heroTitle: "Hobby Products at prices that beat the market.",
    heroSubtitle:
      "RC cars, planes, drones, parts and batteries at competitive prices. Every product is 100% genuine and delivered fast anywhere in Pakistan.",
    heroCtaLabel: "Shop now",
    heroCtaHref: "#products",
    banners: [],
    featuredProductIds: [],
    testimonials: [
      {
        name: "Tariq M.",
        location: "Lahore",
        text: "Ordered a crawler for my grandson and one for myself. Arrived in two days, well packed, and they called to confirm before shipping. Very trustworthy.",
        rating: 5,
      },
      {
        name: "Sana K.",
        location: "Karachi",
        text: "First drone I have ever flown. They helped me on WhatsApp to bind the controller. Great service.",
        rating: 5,
      },
      {
        name: "Col. (R) Javed A.",
        location: "Rawalpindi",
        text: "Genuine batteries and fair prices. Cash on delivery made it easy. I will be ordering my next warbird from here.",
        rating: 5,
      },
    ],
    trustBadges: [
      { title: "Fast delivery", text: "2–4 working days across Pakistan" },
      { title: "Competitive prices", text: "Prices that beat the market" },
      { title: "Genuine products", text: "Original brands with warranty" },
      { title: "Real human help", text: "Chat with us on WhatsApp" },
    ],
  },
};

/** Settings keys stored in the DB, one row per top-level group. */
export const settingGroups = Object.keys(storeDefaults) as (keyof StoreSettings)[];

/** Default content pages, editable in Admin → Pages. */
export const defaultPageSlugs = ["about", "contact", "shipping-policy", "returns-policy", "faq"] as const;
