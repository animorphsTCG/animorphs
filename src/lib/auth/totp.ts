
/**
 * TOTP Authentication Library
 */
import { base32Decode } from './encoding';

export interface TOTPOptions {
  digits?: number;
  period?: number;
  algorithm?: 'SHA-1' | 'SHA-256' | 'SHA-512';
}

const DEFAULT_OPTIONS: TOTPOptions = {
  digits: 6,
  period: 30,
  algorithm: 'SHA-1',
};

/**
 * Generate a TOTP code from a secret
 */
export async function generateTOTP(secret: string, options: TOTPOptions = {}): Promise<string> {
  const { digits, period, algorithm } = { ...DEFAULT_OPTIONS, ...options };
  
  // Get current time and calculate counter
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / period);
  
  return generateHOTP(secret, counter, { digits, algorithm });
}

/**
 * Generate an HMAC-based One Time Password
 */
export async function generateHOTP(
  secret: string, 
  counter: number, 
  options: Omit<TOTPOptions, 'period'> = {}
): Promise<string> {
  const { digits, algorithm } = { ...DEFAULT_OPTIONS, ...options };
  
  // Create buffer for counter
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  
  // Convert counter to buffer (big-endian)
  for (let i = 0; i < 8; i++) {
    view.setUint8(7 - i, counter & 0xff);
    counter = counter >> 8;
  }
  
  // Get buffer for secret
  const key = base32Decode(secret);
  
  // Calculate HMAC
  const hmac = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: { name: algorithm } },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', hmac, buffer);
  
  // Get offset and truncate
  const signatureBytes = new Uint8Array(signature);
  const offset = signatureBytes[signatureBytes.byteLength - 1] & 0x0f;
  
  const binary = ((signatureBytes[offset] & 0x7f) << 24) |
                 ((signatureBytes[offset + 1] & 0xff) << 16) |
                 ((signatureBytes[offset + 2] & 0xff) << 8) |
                 (signatureBytes[offset + 3] & 0xff);
  
  // Calculate OTP code by modulo 10^digits
  const otp = binary % Math.pow(10, digits);
  
  // Pad with leading zeros if needed
  return otp.toString().padStart(digits, '0');
}

/**
 * Verify a TOTP code
 */
export async function verifyTOTP(
  secret: string, 
  code: string, 
  options: TOTPOptions & { window?: number } = {}
): Promise<boolean> {
  const { digits, period, algorithm, window = 1 } = { ...DEFAULT_OPTIONS, ...options };
  
  // Check if code is the right length
  if (code.length !== digits) {
    return false;
  }
  
  // Get current time and calculate counter
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / period);
  
  // Check window around the current counter
  for (let i = -window; i <= window; i++) {
    const generatedCode = await generateHOTP(secret, counter + i, { digits, algorithm });
    if (generatedCode === code) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate a random TOTP secret
 */
export function generateTOTPSecret(): string {
  // Create random bytes
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  
  // Convert to Base32
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    
    while (bits >= 5) {
      bits -= 5;
      result += CHARS[(value >> bits) & 31];
    }
  }
  
  if (bits > 0) {
    result += CHARS[(value << (5 - bits)) & 31];
  }
  
  return result;
}
