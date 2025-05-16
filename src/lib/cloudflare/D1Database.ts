
/**
 * D1Database service
 * A service to interact with Cloudflare D1 database
 */

import { d1Worker } from './d1Worker';
import { UserProfile, AnimorphCard, PaymentStatus, VipCode } from '@/types';

export class D1Database {
  private token: string | null = null;
  
  constructor(token?: string) {
    if (token) {
      this.setToken(token);
    }
  }
  
  setToken(token: string): void {
    this.token = token;
  }
  
  // Profiles
  
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await d1Worker.getOne<UserProfile>(
        'SELECT * FROM profiles WHERE id = ?',
        { params: [userId] },
        this.token || undefined
      );
      
      if (!profile) return null;
      
      // Convert SQLite integers to booleans
      return {
        ...profile,
        music_unlocked: Boolean(profile.music_unlocked),
        is_admin: Boolean(profile.is_admin),
      };
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }
  
  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      
      // Build SET clause
      Object.entries(data).forEach(([key, value]) => {
        // Skip id field
        if (key === 'id') return;
        
        // Handle boolean fields
        if (typeof value === 'boolean') {
          updates.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (updates.length === 0) {
        return await this.getProfile(userId);
      }
      
      // Add userId to values for WHERE clause
      values.push(userId);
      
      const sql = `
        UPDATE profiles 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `;
      
      await d1Worker.query(sql, { params: values }, this.token || undefined);
      
      return await this.getProfile(userId);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }
  
  async createProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    try {
      const columns: string[] = [];
      const placeholders: string[] = [];
      const values: any[] = [];
      
      // Build columns and values
      Object.entries(profile).forEach(([key, value]) => {
        columns.push(key);
        placeholders.push('?');
        
        // Handle boolean fields
        if (typeof value === 'boolean') {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      });
      
      const sql = `
        INSERT INTO profiles (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
      `;
      
      await d1Worker.query(sql, { params: values }, this.token || undefined);
      
      return await this.getProfile(profile.id) as UserProfile;
    } catch (error) {
      console.error('Failed to create profile:', error);
      throw error;
    }
  }
  
  // Payment Status
  
  async getPaymentStatus(userId: string): Promise<PaymentStatus | null> {
    try {
      const status = await d1Worker.getOne<PaymentStatus>(
        'SELECT * FROM payment_status WHERE id = ?',
        { params: [userId] },
        this.token || undefined
      );
      
      if (!status) return null;
      
      // Convert SQLite integers to booleans
      return {
        ...status,
        has_paid: Boolean(status.has_paid),
      };
    } catch (error) {
      console.error('Failed to get payment status:', error);
      throw error;
    }
  }
  
  async updatePaymentStatus(userId: string, data: Partial<PaymentStatus>): Promise<PaymentStatus | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      
      // Build SET clause
      Object.entries(data).forEach(([key, value]) => {
        // Skip id field
        if (key === 'id') return;
        
        // Handle boolean fields
        if (typeof value === 'boolean') {
          updates.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (updates.length === 0) {
        return await this.getPaymentStatus(userId);
      }
      
      // Add userId to values for WHERE clause
      values.push(userId);
      
      const sql = `
        UPDATE payment_status 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `;
      
      await d1Worker.query(sql, { params: values }, this.token || undefined);
      
      return await this.getPaymentStatus(userId);
    } catch (error) {
      console.error('Failed to update payment status:', error);
      throw error;
    }
  }
  
  // Music Subscriptions
  
  async getMusicSubscription(userId: string) {
    try {
      return await d1Worker.getOne(
        'SELECT * FROM music_subscriptions WHERE user_id = ? ORDER BY end_date DESC LIMIT 1',
        { params: [userId] },
        this.token || undefined
      );
    } catch (error) {
      console.error('Failed to get music subscription:', error);
      throw error;
    }
  }
  
  // Songs
  
  async getAllSongs() {
    try {
      return await d1Worker.query(
        'SELECT * FROM songs',
        {},
        this.token || undefined
      );
    } catch (error) {
      console.error('Failed to get songs:', error);
      throw error;
    }
  }
  
  async getUserSongs(userId: string) {
    try {
      return await d1Worker.query(
        `SELECT s.*
         FROM songs s
         JOIN user_song_selections uss ON s.id = uss.song_id
         WHERE uss.user_id = ?`,
        { params: [userId] },
        this.token || undefined
      );
    } catch (error) {
      console.error('Failed to get user songs:', error);
      throw error;
    }
  }
  
  // User Song Selections
  
  async addSongToUserCollection(userId: string, songId: string) {
    try {
      const id = crypto.randomUUID();
      await d1Worker.query(
        'INSERT INTO user_song_selections (id, user_id, song_id) VALUES (?, ?, ?)',
        { params: [id, userId, songId] },
        this.token || undefined
      );
      return true;
    } catch (error) {
      console.error('Failed to add song to user collection:', error);
      throw error;
    }
  }
  
  async removeSongFromUserCollection(userId: string, songId: string) {
    try {
      await d1Worker.query(
        'DELETE FROM user_song_selections WHERE user_id = ? AND song_id = ?',
        { params: [userId, songId] },
        this.token || undefined
      );
      return true;
    } catch (error) {
      console.error('Failed to remove song from user collection:', error);
      throw error;
    }
  }
  
  // Animorph Cards
  
  async getAllCards(): Promise<AnimorphCard[]> {
    try {
      // Remove the type argument from query method
      return await d1Worker.query(
        'SELECT * FROM animorph_cards',
        {},
        this.token || undefined
      );
    } catch (error) {
      console.error('Failed to get animorph cards:', error);
      throw error;
    }
  }
  
  // VIP Codes
  
  async getVipCode(code: string): Promise<VipCode | null> {
    try {
      return await d1Worker.getOne<VipCode>(
        'SELECT * FROM vip_codes WHERE code = ?',
        { params: [code] },
        this.token || undefined
      );
    } catch (error) {
      console.error('Failed to get VIP code:', error);
      throw error;
    }
  }
  
  async useVipCode(code: string): Promise<boolean> {
    try {
      const vipCode = await this.getVipCode(code);
      
      if (!vipCode) return false;
      if (vipCode.current_uses >= vipCode.max_uses) return false;
      
      await d1Worker.query(
        'UPDATE vip_codes SET current_uses = current_uses + 1 WHERE code = ?',
        { params: [code] },
        this.token || undefined
      );
      
      return true;
    } catch (error) {
      console.error('Failed to use VIP code:', error);
      throw error;
    }
  }
  
  // User Music Settings
  
  async getUserMusicSettings(userId: string) {
    try {
      const settings = await d1Worker.getOne(
        'SELECT * FROM user_music_settings WHERE user_id = ?',
        { params: [userId] },
        this.token || undefined
      );
      
      if (!settings) {
        return {
          volume_level: 0.5,
          music_enabled: true
        };
      }
      
      return {
        ...settings,
        music_enabled: Boolean(settings.music_enabled)
      };
    } catch (error) {
      console.error('Failed to get user music settings:', error);
      throw error;
    }
  }
  
  async updateUserMusicSettings(userId: string, settings: { volume_level?: number, music_enabled?: boolean }) {
    try {
      const existing = await this.getUserMusicSettings(userId);
      
      if (!existing) {
        // Create new settings
        const id = crypto.randomUUID();
        await d1Worker.query(
          'INSERT INTO user_music_settings (id, user_id, volume_level, music_enabled) VALUES (?, ?, ?, ?)',
          { 
            params: [
              id, 
              userId, 
              settings.volume_level ?? 0.5, 
              settings.music_enabled !== undefined ? (settings.music_enabled ? 1 : 0) : 1
            ] 
          },
          this.token || undefined
        );
      } else {
        // Update existing settings
        const updates: string[] = [];
        const values: any[] = [];
        
        if (settings.volume_level !== undefined) {
          updates.push('volume_level = ?');
          values.push(settings.volume_level);
        }
        
        if (settings.music_enabled !== undefined) {
          updates.push('music_enabled = ?');
          values.push(settings.music_enabled ? 1 : 0);
        }
        
        if (updates.length > 0) {
          values.push(userId);
          await d1Worker.query(
            `UPDATE user_music_settings SET ${updates.join(', ')} WHERE user_id = ?`,
            { params: values },
            this.token || undefined
          );
        }
      }
      
      return await this.getUserMusicSettings(userId);
    } catch (error) {
      console.error('Failed to update user music settings:', error);
      throw error;
    }
  }
  
  // Cloudflare error management
  
  async getCloudflareErrors() {
    try {
      return await d1Worker.query(
        'SELECT * FROM cloudflare_errors ORDER BY timestamp DESC',
        {},
        this.token || undefined
      );
    } catch (error) {
      console.error('Failed to get cloudflare errors:', error);
      throw error;
    }
  }
  
  async updateErrorStatus(errorId: string, status: 'resolved' | 'ignored') {
    try {
      await d1Worker.query(
        'UPDATE cloudflare_errors SET status = ? WHERE id = ?',
        { params: [status, errorId] },
        this.token || undefined
      );
      return true;
    } catch (error) {
      console.error('Failed to update error status:', error);
      throw error;
    }
  }
  
  // Pending scripts
  
  async getPendingScripts() {
    try {
      return await d1Worker.query(
        'SELECT * FROM pending_scripts ORDER BY created_at DESC',
        {},
        this.token || undefined
      );
    } catch (error) {
      console.error('Failed to get pending scripts:', error);
      throw error;
    }
  }
  
  async executePendingScript(scriptId: string) {
    try {
      // In a real implementation, we'd execute the script via Wrangler
      // For now, just mark it as completed
      await d1Worker.query(
        'UPDATE pending_scripts SET status = ?, executed_at = datetime("now") WHERE id = ?',
        { params: ['completed', scriptId] },
        this.token || undefined
      );
      return true;
    } catch (error) {
      console.error('Failed to execute pending script:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const d1Database = new D1Database();

// Helper function to initialize the database with a token
export const initializeD1Database = (token: string): void => {
  d1Database.setToken(token);
};
