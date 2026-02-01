/**
 * Sentry Error Tracking Configuration
 * CA-056: Error monitoring setup
 * 
 * To enable Sentry:
 * 1. Create a Sentry project at https://sentry.io
 * 2. Add NEXT_PUBLIC_SENTRY_DSN to .env.local
 * 3. Uncomment the initialization code below
 */

// Placeholder for Sentry SDK
// npm install @sentry/nextjs

/*
import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Environment
      environment: process.env.NODE_ENV,
      
      // Only send errors in production by default
      enabled: process.env.NODE_ENV === 'production',
      
      // Ignore common non-actionable errors
      ignoreErrors: [
        // Network errors
        'Network request failed',
        'Failed to fetch',
        'Load failed',
        // Browser extensions
        /^chrome-extension:/,
        /^moz-extension:/,
        // User aborts
        'AbortError',
        'The operation was aborted',
      ],
      
      beforeSend(event, hint) {
        // Don't send errors in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[Sentry would send]:', hint.originalException)
          return null
        }
        return event
      },
    })
  }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    })
  } else {
    console.error('[Sentry not configured]:', error, context)
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(message, level)
  } else {
    console[level === 'error' ? 'error' : 'log']('[Sentry not configured]:', message)
  }
}

export function setUser(user: { id: string; email?: string; username?: string } | null) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.setUser(user)
  }
}

export function addBreadcrumb(breadcrumb: {
  category: string
  message: string
  level?: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.addBreadcrumb(breadcrumb)
  }
}
*/

// Temporary no-op implementations until Sentry is configured
export function initSentry() {
  console.log('[Sentry] Not configured - add NEXT_PUBLIC_SENTRY_DSN to enable')
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error('[Error]:', error.message, context)
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  console[level === 'error' ? 'error' : 'log'](`[${level.toUpperCase()}]:`, message)
}

export function setUser(_user: { id: string; email?: string; username?: string } | null) {
  // No-op until Sentry is configured
}

export function addBreadcrumb(_breadcrumb: {
  category: string
  message: string
  level?: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}) {
  // No-op until Sentry is configured
}
