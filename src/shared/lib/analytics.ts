// Closed list on purpose: every tracked event must be added here deliberately.
// Match results are intentionally NOT tracked, and neither are names (tournament
// or player), so event data stays limited to counts and formats.
export type AnalyticsEvent =
  | "tournament-create-started"
  | "wizard-step-completed"
  | "tournament-created";

type AnalyticsData = Record<string, string | number>;

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: AnalyticsData) => void;
    };
  }
}

// No-op when the Umami script is blocked, not loaded yet, or disabled for this domain.
export function trackEvent(event: AnalyticsEvent, data?: AnalyticsData) {
  window.umami?.track(event, data);
}
