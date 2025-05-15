
/**
 * Encoding utilities for authentication
 */

// Base32 character set (RFC 4648)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode a Base32 string to Uint8Array
 */
export function base32Decode(input: string): Uint8Array {
  // Normalize and validate input
  const normalizedInput = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  
  // Calculate output length
  const outputLength = Math.floor((normalizedInput.length * 5) / 8);
  const result = new Uint8Array(outputLength);
  
  let buffer = 0;
  let bitsLeft = 0;
  let resultIndex = 0;
  
  for (let i = 0; i < normalizedInput.length; i++) {
    const char = normalizedInput[i];
    const value = BASE32_CHARS.indexOf(char);
    
    if (value === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
    
    // Add 5 bits to the buffer
    buffer = (buffer << 5) | value;
    bitsLeft += 5;
    
    // Process full bytes
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      result[resultIndex++] = (buffer >> bitsLeft) & 0xff;
    }
  }
  
  return result;
}

/**
 * Encode a Uint8Array to Base32 string
 */
export function base32Encode(data: Uint8Array): string {
  let result = '';
  let buffer = 0;
  let bitsLeft = 0;
  
  for (let i = 0; i < data.length; i++) {
    // Add 8 bits to the buffer
    buffer = (buffer << 8) | data[i];
    bitsLeft += 8;
    
    // Process complete 5-bit chunks
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += BASE32_CHARS[(buffer >> bitsLeft) & 0x1f];
    }
  }
  
  // Handle any remaining bits
  if (bitsLeft > 0) {
    result += BASE32_CHARS[(buffer << (5 - bitsLeft)) & 0x1f];
  }
  
  return result;
}

/**
 * Convert a hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  // Remove any spaces or 0x prefix
  hex = hex.replace(/\s+|0x/g, '');
  
  // Ensure even length
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }
  
  const result = new Uint8Array(hex.length / 2);
  
  for (let i = 0; i < hex.length; i += 2) {
    result[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  
  return result;
}

/**
 * Convert a Uint8Array to hex string
 */
export function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
