import { d1Worker } from '@/lib/cloudflare/d1Worker';
import type { UserProfile } from '@/modules/auth/types';
import { EnhancedD1QueryBuilder } from '@/lib/cloudflare/d1Types';

/**
 * Cloudflare D1 database adapter for the Animorphs app
 */
export class D1Database {
  private token: string | null = null;

  constructor(token?: string) {
    if (token) {
      this.setToken(token);
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  // Add the 'from' method for compatibility with Supabase-like queries
  from<T = any>(table: string): EnhancedD1QueryBuilder<T> {
    if (!d1Worker.from) {
      throw new Error("d1Worker.from is not defined");
    }
    return d1Worker.from<T>(table, this.token || undefined);
  }

  // Add search users method
  async searchUsers(searchTerm: string) {
    try {
      const results = await d1Worker.query(
        `SELECT id, username, profile_image_url FROM profiles 
         WHERE username LIKE ? LIMIT 20`,
        { params: [`%${searchTerm}%`] },
        this.token || undefined
      );
      return results || [];
    } catch (err) {
      console.error('Error searching users:', err);
      return [];
    }
  }

  async executeQuery(sql: string, params: any[] = []) {
    return await d1Worker.query(sql, { params }, this.token || undefined);
  }

  async query<T = any>(sql: string, options: { params?: any[] } = {}): Promise<T[]> {
    return await d1Worker.query<T>(sql, { params: options.params || [] }, this.token || undefined);
  }

  async execute(sql: string, params: any[] = []): Promise<number> {
    return await d1Worker.execute(sql, { params }, this.token || undefined);
  }

  async getProfile(userId: string) {
    try {
      return await d1Worker.getOne(
        'SELECT * FROM profiles WHERE id = ?',
        { params: [userId] },
        this.token || undefined
      );
    } catch (err) {
      console.error('Failed to get profile:', err);
      return null;
    }
  }

  async getUser(userId: string) {
    try {
      return await d1Worker.getOne(
        'SELECT * FROM users WHERE id = ?',
        { params: [userId] },
        this.token || undefined
      );
    } catch (err) {
      console.error('Failed to get user:', err);
      return null;
    }
  }

  async updateProfile(userId: string, data: Partial<UserProfile>) {
    try {
      const setValues = Object.entries(data)
        .filter(([key]) => key !== 'id')
        .map(([key]) => `${key} = ?`)
        .join(', ');

      const values = Object.entries(data)
        .filter(([key]) => key !== 'id')
        .map(([_, value]) => value);

      values.push(userId);

      return await d1Worker.execute(
        `UPDATE profiles SET ${setValues} WHERE id = ?`,
        { params: values },
        this.token || undefined
      );
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  }

  async getPaymentStatus(userId: string) {
    try {
      return await d1Worker.getOne(
        'SELECT * FROM payment_status WHERE user_id = ?',
        { params: [userId] },
        this.token || undefined
      );
    } catch (err) {
      console.error('Failed to get payment status:', err);
      return null;
    }
  }

  async getCards(limit: number = 100, offset: number = 0) {
    try {
      return await d1Worker.query(
        'SELECT * FROM cards LIMIT ? OFFSET ?',
        { params: [limit, offset] },
        this.token || undefined
      );
    } catch (err) {
      console.error('Failed to get cards:', err);
      return [];
    }
  }

  async getAllSongs() {
    try {
      return await d1Worker.query(
        'SELECT * FROM songs',
        {},
        this.token || undefined
      );
    } catch (err) {
      console.error('Failed to get all songs:', err);
      return [];
    }
  }

  async getMusicSubscription(userId: string) {
    try {
      return await d1Worker.getOne(
        'SELECT * FROM music_subscriptions WHERE user_id = ? ORDER BY end_date DESC LIMIT 1', 
        { params: [userId] },
        this.token || undefined
      );
    } catch (err) {
      console.error('Failed to get music subscription:', err);
      return null;
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
    } catch (err) {
      console.error('Failed to get user songs:', err);
      return [];
    }
  }

  async addSongToUserCollection(userId: string, songId: string) {
    try {
      const id = crypto.randomUUID();
      return await d1Worker.execute(
        `INSERT INTO user_song_selections (id, user_id, song_id) VALUES (?, ?, ?)`,
        { params: [id, userId, songId] },
        this.token || undefined
      );
    } catch (err) {
      console.error('Failed to add song to user:', err);
      throw err;
    }
  }

  async removeSongFromUserCollection(userId: string, songId: string) {
    try {
      return await d1Worker.execute(
        `DELETE FROM user_song_selections WHERE user_id = ? AND song_id = ?`,
        { params: [userId, songId] },
        this.token || undefined
      );
    } catch (err) {
      console.error('Failed to remove song from user:', err);
      throw err;
    }
  }
}

// Create and export a singleton instance
export const d1Database = new D1Database();
export const d1 = d1Database; // Alias for compatibility

// Helper function to initialize D1 database with auth token
export function initD1Database(token: string) {
  d1Database.setToken(token);
  d1.setToken(token); // Also set the token on the alias
}
