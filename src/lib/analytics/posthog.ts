import posthog from 'posthog-js';
export { usePostHog } from 'posthog-js/react';

// Event names for type safety
export const ANALYTICS_EVENTS = {
  // User lifecycle
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PROFILE_UPDATED: 'profile_updated',

  // Meeting events
  MEETING_CREATED: 'meeting_created',
  MEETING_UPDATED: 'meeting_updated',
  MEETING_DELETED: 'meeting_deleted',
  SLOT_PROPOSED: 'slot_proposed',
  SLOT_CONFIRMED: 'slot_confirmed',

  // Core features
  SACRIFICE_SCORE_VIEWED: 'sacrifice_score_viewed',
  LEADERBOARD_VIEWED: 'leaderboard_viewed',
  GOLDEN_WINDOWS_VIEWED: 'golden_windows_viewed',
  ASYNC_NUDGE_SHOWN: 'async_nudge_shown',
  ASYNC_NUDGE_ACCEPTED: 'async_nudge_accepted',
  ASYNC_NUDGE_DISMISSED: 'async_nudge_dismissed',

  // Team events
  TEAM_CREATED: 'team_created',
  TEAM_MEMBER_INVITED: 'team_member_invited',
  TEAM_JOINED: 'team_joined',

  // Calendar & Email
  CALENDAR_CONNECTED: 'calendar_connected',
  CALENDAR_DISCONNECTED: 'calendar_disconnected',
  EMAIL_INVITE_SENT: 'email_invite_sent',

  // Subscription
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  UPGRADE_CLICKED: 'upgrade_clicked',

  // Referrals
  REFERRAL_CODE_SHARED: 'referral_code_shared',
  REFERRAL_CODE_USED: 'referral_code_used',

  // Fair Time Finder (public tool)
  FAIR_TIME_FINDER_USED: 'fair_time_finder_used',
  FAIR_TIME_FINDER_RESULT: 'fair_time_finder_result',

  // GTM Viral Mechanics
  SCORE_CARD_SHARED: 'score_card_shared', // platform: twitter/linkedin/clipboard/native
  CALCULATOR_USED: 'calculator_used',
  CALCULATOR_SIGNUP_CLICKED: 'calculator_signup_clicked',
  MEETING_AVOIDED_SHARED: 'meeting_avoided_shared',

  // GTM Landing & Conversion
  LANDING_CTA_CLICKED: 'landing_cta_clicked', // cta_type: hero_primary/hero_secondary/pricing
  PRICING_PAGE_VIEWED: 'pricing_page_viewed', // ref: referral code if present
  DEMO_VIDEO_PLAYED: 'demo_video_played',

  // Page views (automatic with PostHog, but useful for manual tracking)
  PAGE_VIEW: '$pageview',
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/**
 * Initialize PostHog - DEPRECATED: Now initialized in AnalyticsProvider
 * Kept for backwards compatibility
 */
export function initPostHog() {
  // PostHog is now initialized in AnalyticsProvider using posthog-js/react
  // This function is kept for backwards compatibility but does nothing
}

/**
 * Identify a user - call after login/signup
 */
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    timezone?: string;
    subscription_tier?: string;
    created_at?: string;
  }
) {
  if (typeof window === 'undefined') return;

  posthog.identify(userId, properties);
}

/**
 * Reset user identification - call on logout
 */
export function resetUser() {
  if (typeof window === 'undefined') return;

  posthog.reset();
}

/**
 * Track an event
 */
export function trackEvent(
  event: AnalyticsEvent | string,
  properties?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return;

  posthog.capture(event, properties);
}

/**
 * Set user properties without tracking an event
 */
export function setUserProperties(properties: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  posthog.people.set(properties);
}

/**
 * Set properties that only get set once (e.g., first_visit_date)
 */
export function setUserPropertiesOnce(properties: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  posthog.people.set_once(properties);
}

/**
 * Start a feature flag evaluation
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (typeof window === 'undefined') return false;

  return posthog.isFeatureEnabled(flagKey) || false;
}

/**
 * Get feature flag value
 */
export function getFeatureFlag<T = boolean | string>(
  flagKey: string
): T | undefined {
  if (typeof window === 'undefined') return undefined;

  return posthog.getFeatureFlag(flagKey) as T | undefined;
}

/**
 * Register super properties (sent with every event)
 */
export function registerSuperProperties(properties: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  posthog.register(properties);
}

// Export the raw posthog instance for advanced use cases
export { posthog };
