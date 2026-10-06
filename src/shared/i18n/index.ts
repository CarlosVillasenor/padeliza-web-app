import { locale, type Locale } from "./config";
import { es } from "./messages/es";

export type Messages = typeof es;

// To add a language: create `messages/<locale>.ts` typed as `Messages`, add the
// locale to `locales` in config.ts, and register it here. TypeScript then
// reports any missing key.
const dictionaries: Record<Locale, Messages> = { es };

export function getMessages(target: Locale): Messages {
  return dictionaries[target];
}

export const messages = getMessages(locale);
export { locale };
