/**
 * URL Validation Utilities
 * Prevents open redirect and URL-based attacks
 */

/**
 * Get the canonical origin for the application.
 *
 * SECURITY: Never trust the Origin header from requests - it's attacker-controlled.
 * Always use the server-configured environment variable.
 */
export function getCanonicalOrigin(): string {
  // Use environment variable (server-controlled, trustworthy)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Production fallback
  if (process.env.NODE_ENV === 'production') {
    return 'https://clockalign.com';
  }

  // Development fallback
  return 'http://localhost:3000';
}

/**
 * Validate that a path is a safe internal redirect target.
 *
 * SECURITY: Prevents open redirect attacks by ensuring:
 * - Path must start with a single "/" (relative path)
 * - Path must NOT start with "//" (protocol-relative URL)
 * - Path must NOT contain "://" (absolute URL)
 * - Path must NOT be a javascript: URL
 * - Path must NOT contain newlines (header injection)
 *
 * @param path - The path to validate
 * @returns true if the path is a safe internal redirect target
 */
export function isValidInternalPath(path: string | null | undefined): boolean {
  if (!path || typeof path !== 'string') {
    return false;
  }

  // Must start with a single forward slash
  if (!path.startsWith('/')) {
    return false;
  }

  // Must NOT be a protocol-relative URL (//evil.com)
  if (path.startsWith('//')) {
    return false;
  }

  // Must NOT contain a protocol (javascript:, data:, http://, etc.)
  if (path.includes('://') || path.toLowerCase().startsWith('javascript:')) {
    return false;
  }

  // Must NOT contain newlines (HTTP header injection)
  if (path.includes('\n') || path.includes('\r')) {
    return false;
  }

  // Must NOT contain backslashes (Windows path confusion, some browsers convert to /)
  if (path.includes('\\')) {
    return false;
  }

  return true;
}

/**
 * Sanitize a redirect path, returning a safe default if invalid.
 *
 * @param path - The path to sanitize
 * @param defaultPath - The safe default to return if path is invalid (default: '/dashboard')
 * @returns A safe redirect path
 */
export function sanitizeRedirectPath(
  path: string | null | undefined,
  defaultPath = '/dashboard'
): string {
  if (isValidInternalPath(path)) {
    return path as string;
  }
  return defaultPath;
}

/**
 * Build a full redirect URL using the canonical origin.
 *
 * @param path - The internal path (will be validated)
 * @param defaultPath - Fallback path if the provided path is invalid
 * @returns Full URL with canonical origin
 */
export function buildRedirectUrl(
  path: string | null | undefined,
  defaultPath = '/dashboard'
): string {
  const safePath = sanitizeRedirectPath(path, defaultPath);
  return `${getCanonicalOrigin()}${safePath}`;
}
