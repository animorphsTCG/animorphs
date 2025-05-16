
import { decode } from './auth/encoding';
import { generateTOTP, verifyTOTP } from './auth/totp';
import { d1Worker } from './cloudflare/d1Worker';

// Number of backup codes to generate
const BACKUP_CODES_COUNT = 8;
// Length of each backup code
const BACKUP_CODE_LENGTH = 10;
// Characters to use in backup codes (excluding similar looking characters)
const BACKUP_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

// Generate a random backup code
const generateBackupCode = (length: number = BACKUP_CODE_LENGTH): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BACKUP_CODE_CHARS.charAt(Math.floor(Math.random() * BACKUP_CODE_CHARS.length));
  }
  return result;
};

// Generate multiple backup codes
export const generateBackupCodes = (count: number = BACKUP_CODES_COUNT): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateBackupCode());
  }
  return codes;
};

// Helper function to hash a string using SHA-256
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Set up TOTP for a user
export const setupTOTP = async (
  userId: string, 
  token: string
): Promise<{ secret: string; url: string; backupCodes: string[] }> => {
  try {
    // Generate a new TOTP secret
    const totpData = generateTOTP(userId);
    const backupCodes = generateBackupCodes();
    
    // Hash the backup codes for storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => hashString(code))
    );
    
    // Store the TOTP secret and backup codes in the database
    await d1Worker.transaction([
      {
        sql: `INSERT INTO totp_secrets (user_id, secret, created_at, updated_at) 
              VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              ON CONFLICT (user_id) 
              DO UPDATE SET 
                secret = EXCLUDED.secret,
                updated_at = CURRENT_TIMESTAMP`,
        params: [userId, totpData.secret]
      },
      {
        sql: `DELETE FROM backup_codes WHERE user_id = ?`,
        params: [userId]
      }
    ], token);
    
    // Insert each backup code
    for (const hashedCode of hashedBackupCodes) {
      await d1Worker.query(
        `INSERT INTO backup_codes (user_id, code_hash, used, created_at)
         VALUES (?, ?, 0, CURRENT_TIMESTAMP)`,
        { params: [userId, hashedCode] },
        token
      );
    }
    
    return {
      secret: totpData.secret,
      url: totpData.url,
      backupCodes
    };
  } catch (error) {
    console.error('Error setting up TOTP:', error);
    throw new Error('Failed to set up two-factor authentication');
  }
};

// Verify a TOTP code for a user
export const verifyTOTPCode = async (
  userId: string, 
  code: string,
  token: string
): Promise<boolean> => {
  try {
    // Get the user's TOTP secret
    const totpSecretResult = await d1Worker.getOne<{ secret: string }>(
      'SELECT secret FROM totp_secrets WHERE user_id = ?',
      { params: [userId] },
      token
    );
    
    if (!totpSecretResult || !totpSecretResult.secret) {
      console.error('TOTP secret not found for user:', userId);
      return false;
    }
    
    // Verify the TOTP code
    return verifyTOTP(code, totpSecretResult.secret);
  } catch (error) {
    console.error('Error verifying TOTP code:', error);
    return false;
  }
};

// Verify a backup code for a user
export const verifyBackupCode = async (
  userId: string, 
  code: string,
  token: string
): Promise<boolean> => {
  try {
    // Hash the provided backup code
    const hashedCode = await hashString(code);
    
    // Check if the code exists and is unused
    const backupCodeResult = await d1Worker.getOne<{ id: number }>(
      'SELECT id FROM backup_codes WHERE user_id = ? AND code_hash = ? AND used = 0',
      { params: [userId, hashedCode] },
      token
    );
    
    if (!backupCodeResult || !backupCodeResult.id) {
      return false;
    }
    
    // Mark the backup code as used
    await d1Worker.query(
      'UPDATE backup_codes SET used = 1, used_at = CURRENT_TIMESTAMP WHERE id = ?',
      { params: [backupCodeResult.id] },
      token
    );
    
    return true;
  } catch (error) {
    console.error('Error verifying backup code:', error);
    return false;
  }
};

// Get the TOTP setup status for a user
export const getTOTPStatus = async (
  userId: string,
  token: string
): Promise<{ enabled: boolean; createdAt?: string }> => {
  try {
    const result = await d1Worker.getOne<{ created_at: string }>(
      'SELECT created_at FROM totp_secrets WHERE user_id = ?',
      { params: [userId] },
      token
    );
    
    if (!result) {
      return { enabled: false };
    }
    
    return {
      enabled: true,
      createdAt: result.created_at
    };
  } catch (error) {
    console.error('Error getting TOTP status:', error);
    return { enabled: false };
  }
};

// Get the remaining backup codes for a user
export const getRemainingBackupCodes = async (
  userId: string,
  token: string
): Promise<number> => {
  try {
    const result = await d1Worker.getOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM backup_codes WHERE user_id = ? AND used = 0',
      { params: [userId] },
      token
    );
    
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting remaining backup codes:', error);
    return 0;
  }
};

// Generate new backup codes for a user, invalidating old ones
export const regenerateBackupCodes = async (
  userId: string,
  token: string
): Promise<string[]> => {
  try {
    // Generate new backup codes
    const backupCodes = generateBackupCodes();
    
    // Hash the backup codes for storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => hashString(code))
    );
    
    // Delete old backup codes
    await d1Worker.query(
      'DELETE FROM backup_codes WHERE user_id = ?',
      { params: [userId] },
      token
    );
    
    // Insert each new backup code
    for (const hashedCode of hashedBackupCodes) {
      await d1Worker.query(
        `INSERT INTO backup_codes (user_id, code_hash, used, created_at)
         VALUES (?, ?, 0, CURRENT_TIMESTAMP)`,
        { params: [userId, hashedCode] },
        token
      );
    }
    
    return backupCodes;
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    throw new Error('Failed to regenerate backup codes');
  }
};
