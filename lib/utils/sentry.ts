/**
 * Sentry configuration for TheMatch
 *
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react-native';

/**
 * Initialize Sentry
 *
 * Call this ONCE, as early as possible (e.g. in app/_layout.tsx)
 */
export function initializeSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    // Sentry silently does nothing without a DSN
    // This keeps local/dev setups simple
    return;
  }

  Sentry.init({
    dsn,

    // Performance tracing
    tracesSampleRate: 1.0,

    // Helpful during development
    debug: __DEV__,

    environment: __DEV__ ? 'development' : 'production',
  });
}

/**
 * Capture an exception manually
 *
 * Useful when you catch an error but still want visibility
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>
) {
  Sentry.captureException(error, {
    contexts: context ? { extra: context } : undefined,
  });
}

/**
 * Capture an informational message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Associate errors with a logged-in user
 *
 * Call on login and logout
 */
export function setUser(
  user: { id: string; email?: string; username?: string } | null
) {
  Sentry.setUser(user);
}

/**
 * Record a breadcrumb (small trail of what happened)
 */
export function addBreadcrumb(
  message: string,
  category = 'custom',
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Attach structured context to future events
 */
export function setContext(
  name: string,
  context: Record<string, unknown>
) {
  Sentry.setContext(name, context);
}

/**
 * Add a tag for filtering in Sentry
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Measure performance for a specific async operation
 *
 * Replaces the old startTransaction API
 */
export async function startSpan<T>(
  name: string,
  op: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    { name, op },
    fn
  );
}

// Export Sentry for rare advanced use cases
export { Sentry };