/**
 * Error Handling Utilities
 * CA-046: Centralized error handling with toast integration
 */

import { toast } from 'sonner'

// ============================================
// ERROR TYPES
// ============================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class PermissionError extends AppError {
  constructor(message = 'You don\'t have permission to do that') {
    super(message, 'PERMISSION_DENIED', 403)
    this.name = 'PermissionError'
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error - please check your connection') {
    super(message, 'NETWORK_ERROR', 0)
    this.name = 'NetworkError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      retryAfter 
        ? `Too many requests. Please wait ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.',
      'RATE_LIMIT',
      429
    )
    this.name = 'RateLimitError'
  }
}

// ============================================
// ERROR PARSING
// ============================================

/**
 * Parse an API response error into a user-friendly message
 */
export function parseApiError(error: unknown): { message: string; code: string } {
  if (error instanceof AppError) {
    return { message: error.message, code: error.code }
  }
  
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return { message: 'Network error - please check your connection', code: 'NETWORK_ERROR' }
    }
    return { message: error.message, code: 'UNKNOWN_ERROR' }
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>
    if (typeof err.message === 'string') {
      return { message: err.message, code: String(err.code || 'UNKNOWN_ERROR') }
    }
    if (typeof err.error === 'string') {
      return { message: err.error, code: String(err.code || 'API_ERROR') }
    }
  }
  
  return { message: 'An unexpected error occurred', code: 'UNKNOWN_ERROR' }
}

/**
 * Parse HTTP response into error
 */
export async function parseResponseError(response: Response): Promise<AppError> {
  let message = 'Request failed'
  let code = 'API_ERROR'
  
  try {
    const data = await response.json()
    if (data.message) message = data.message
    if (data.error) message = data.error
    if (data.code) code = data.code
  } catch {
    // Response wasn't JSON
    message = response.statusText || 'Request failed'
  }
  
  return new AppError(message, code, response.status)
}

// ============================================
// TOAST HELPERS
// ============================================

/**
 * Show error toast with appropriate styling
 */
export function showError(
  error: unknown,
  options?: { 
    title?: string
    action?: { label: string; onClick: () => void }
  }
) {
  const { message } = parseApiError(error)
  
  toast.error(options?.title || 'Error', {
    description: message,
    action: options?.action,
  })
}

/**
 * Show success toast
 */
export function showSuccess(message: string, options?: { 
  description?: string 
  duration?: number
}) {
  toast.success(message, {
    description: options?.description,
    duration: options?.duration || 3000,
  })
}

/**
 * Show info toast
 */
export function showInfo(message: string, options?: { 
  description?: string
  duration?: number
}) {
  toast.info(message, {
    description: options?.description,
    duration: options?.duration || 4000,
  })
}

/**
 * Show warning toast
 */
export function showWarning(message: string, options?: { 
  description?: string
  duration?: number
}) {
  toast.warning(message, {
    description: options?.description,
    duration: options?.duration || 5000,
  })
}

/**
 * Show loading toast that can be updated
 */
export function showLoading(message: string) {
  return toast.loading(message)
}

/**
 * Dismiss a specific toast or all toasts
 */
export function dismissToast(toastId?: string | number) {
  if (toastId) {
    toast.dismiss(toastId)
  } else {
    toast.dismiss()
  }
}

/**
 * Show toast with promise (loading -> success/error)
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: unknown) => string)
  }
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  })
}

// ============================================
// API FETCH WRAPPER
// ============================================

interface FetchOptions extends RequestInit {
  showErrorToast?: boolean
  errorTitle?: string
}

/**
 * Fetch wrapper with automatic error handling
 */
export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { showErrorToast = true, errorTitle, ...fetchOptions } = options
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    })
    
    if (!response.ok) {
      const error = await parseResponseError(response)
      
      if (showErrorToast) {
        showError(error, { title: errorTitle })
      }
      
      throw error
    }
    
    return await response.json()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    
    // Network error
    const networkError = new NetworkError()
    if (showErrorToast) {
      showError(networkError)
    }
    throw networkError
  }
}

// ============================================
// ERROR BOUNDARY UTILS
// ============================================

/**
 * Log error for monitoring (Sentry integration point)
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  const { message, code } = parseApiError(error)
  
  console.error('[ClockAlign Error]', {
    message,
    code,
    context,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
  })
  
  // TODO: Send to Sentry when configured (CA-056)
  // Sentry.captureException(error, { extra: context })
}

/**
 * Safe async wrapper that catches and logs errors
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options?: {
    fallback?: T
    showToast?: boolean
    context?: Record<string, unknown>
  }
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    logError(error, options?.context)
    
    if (options?.showToast) {
      showError(error)
    }
    
    return options?.fallback
  }
}
