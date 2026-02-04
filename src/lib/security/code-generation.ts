/**
 * Cryptographically Secure Code Generation
 *
 * SECURITY: Uses crypto.randomBytes() instead of Math.random() for:
 * - Invite codes
 * - Referral codes
 * - OAuth state nonces
 * - Any security-sensitive random values
 *
 * Math.random() is NOT cryptographically secure and can be predicted
 * by attackers who know the PRNG seed state.
 */

import * as crypto from 'crypto';

/**
 * Character sets for code generation
 */
const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ALPHANUMERIC_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const HEX = '0123456789abcdef';

export type CharacterSet = 'alphanumeric' | 'alphanumeric-upper' | 'hex';

/**
 * Generate a cryptographically secure random code.
 *
 * @param prefix - Optional prefix for the code (e.g., 'REF_', 'INV_')
 * @param length - Length of the random portion (default: 16)
 * @param charset - Character set to use (default: 'alphanumeric')
 * @returns Cryptographically secure random code
 */
export function generateSecureCode(
  prefix = '',
  length = 16,
  charset: CharacterSet = 'alphanumeric'
): string {
  const charsetMap: Record<CharacterSet, string> = {
    alphanumeric: ALPHANUMERIC,
    'alphanumeric-upper': ALPHANUMERIC_UPPER,
    hex: HEX,
  };

  const chars = charsetMap[charset];
  const bytes = crypto.randomBytes(length);
  let code = prefix;

  for (let i = 0; i < length; i++) {
    // Use modulo to map each byte to a character
    // Note: This introduces very slight bias for charsets not evenly divisible into 256,
    // but for our use case (36-char alphanumeric), bias is negligible (< 0.4%)
    code += chars[bytes[i] % chars.length];
  }

  return code;
}

/**
 * Generate a secure invite code.
 * Format: 8 lowercase alphanumeric characters
 */
export function generateInviteCode(): string {
  return generateSecureCode('', 8, 'alphanumeric');
}

/**
 * Generate a secure referral code.
 * Format: REF_ + 8 lowercase alphanumeric characters
 */
export function generateReferralCode(): string {
  return generateSecureCode('REF_', 8, 'alphanumeric');
}

/**
 * Generate a secure OAuth state nonce.
 * Format: 32 hex characters (128 bits of entropy)
 */
export function generateOAuthNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create an HMAC signature for OAuth state.
 *
 * @param data - Data to sign
 * @param secret - Secret key (should be from environment variable)
 * @returns HMAC-SHA256 signature as hex string
 */
export function createStateSignature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify an HMAC signature.
 *
 * @param data - Original data
 * @param signature - Signature to verify
 * @param secret - Secret key
 * @returns true if signature is valid
 */
export function verifyStateSignature(
  data: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createStateSignature(data, secret);
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}
