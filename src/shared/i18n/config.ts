export const locales = ["es"] as const;
export type Locale = (typeof locales)[number];

// Active language for the whole app. It is intentionally hard-coded until the
// product needs a language switcher; changing it is the only edit required to
// serve another registered locale.
export const locale: Locale = "es";
