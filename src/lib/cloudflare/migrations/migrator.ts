
/**
 * Supabase to Cloudflare D1 Data Migrator
 * 
 * This utility migrates data from Supabase to Cloudflare D1
 */
import { supabase } from "@/lib/supabase";
import { d1Worker } from "@/lib/cloudflare/d1Worker";
import { UserProfile, PaymentStatus, AnimorphCard, VipCode } from "@/types";

// Migration status interface
interface MigrationStatus {
  table: string;
  total: number;
  migrated: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

// Main migrator class
export class SupabaseToD1Migrator {
  private authToken: string;
  private migrationStatuses: MigrationStatus[] = [];
  
  constructor(token: string) {
    this.authToken = token;
    this.initStatuses();
  }
  
  private initStatuses() {
    const tables = [
      'profiles', 'payment_status', 'music_subscriptions', 'songs', 
      'user_song_selections', 'user_music_settings', 'animorph_cards', 
      'vip_codes', 'user_presence'
    ];
    
    this.migrationStatuses = tables.map(table => ({
      table,
      total: 0,
      migrated: 0,
      status: 'pending' as const
    }));
  }
  
  public getStatus(): MigrationStatus[] {
    return [...this.migrationStatuses];
  }
  
  public async migrateAll(): Promise<MigrationStatus[]> {
    try {
      await this.migrateProfiles();
      await this.migratePaymentStatus();
      await this.migrateMusicSubscriptions();
      await this.migrateSongs();
      await this.migrateUserSongSelections();
      await this.migrateUserMusicSettings();
      await this.migrateAnimorphCards();
      await this.migrateVipCodes();
      await this.migrateUserPresence();
      
      return this.getStatus();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
  
  private updateStatus(table: string, params: Partial<MigrationStatus>) {
    const index = this.migrationStatuses.findIndex(s => s.table === table);
    if (index !== -1) {
      this.migrationStatuses[index] = {
        ...this.migrationStatuses[index],
        ...params
      };
    }
  }
  
  // Migrate profiles table
  public async migrateProfiles(): Promise<void> {
    const table = 'profiles';
    try {
      this.updateStatus(table, { status: 'in_progress' });
      
      // Get profiles from Supabase
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');
        
      if (error) throw error;
      
      this.updateStatus(table, { total: profiles.length });
      
      // Insert profiles into D1
      for (const profile of profiles) {
        await d1Worker.query(
          `INSERT INTO profiles 
          (id, username, name, surname, age, gender, country, mp, ai_points, lbp, digi, gold, 
          music_unlocked, favorite_animorph, favorite_battle_mode, online_times_gmt2, 
          playing_times, profile_image_url, is_admin, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            params: [
              profile.id, profile.username, profile.name, profile.surname, 
              profile.age, profile.gender, profile.country, profile.mp,
              profile.ai_points, profile.lbp, profile.digi, profile.gold,
              profile.music_unlocked ? 1 : 0, profile.favorite_animorph, 
              profile.favorite_battle_mode, profile.online_times_gmt2,
              profile.playing_times, profile.profile_image_url,
              profile.is_admin ? 1 : 0, profile.created_at
            ]
          },
          this.authToken
        );
        
        this.updateStatus(table, { migrated: this.migrationStatuses.find(s => s.table === table)!.migrated + 1 });
      }
      
      this.updateStatus(table, { status: 'completed' });
    } catch (error) {
      this.updateStatus(table, { status: 'failed', error: error.message });
      throw error;
    }
  }
  
  // Migrate payment status table
  public async migratePaymentStatus(): Promise<void> {
    const table = 'payment_status';
    try {
      this.updateStatus(table, { status: 'in_progress' });
      
      // Get payment status from Supabase
      const { data: paymentStatus, error } = await supabase
        .from('payment_status')
        .select('*');
        
      if (error) throw error;
      
      this.updateStatus(table, { total: paymentStatus.length });
      
      // Insert payment status into D1
      for (const payment of paymentStatus) {
        await d1Worker.query(
          `INSERT INTO payment_status 
          (id, has_paid, payment_date, payment_method, transaction_id, updated_at, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          {
            params: [
              payment.id, payment.has_paid ? 1 : 0, payment.payment_date,
              payment.payment_method, payment.transaction_id,
              payment.updated_at, payment.created_at
            ]
          },
          this.authToken
        );
        
        this.updateStatus(table, { migrated: this.migrationStatuses.find(s => s.table === table)!.migrated + 1 });
      }
      
      this.updateStatus(table, { status: 'completed' });
    } catch (error) {
      this.updateStatus(table, { status: 'failed', error: error.message });
      throw error;
    }
  }
  
  // Migrate music subscriptions
  public async migrateMusicSubscriptions(): Promise<void> {
    const table = 'music_subscriptions';
    try {
      this.updateStatus(table, { status: 'in_progress' });
      
      const { data: subscriptions, error } = await supabase
        .from('music_subscriptions')
        .select('*');
        
      if (error) throw error;
      
      this.updateStatus(table, { total: subscriptions.length });
      
      for (const sub of subscriptions) {
        await d1Worker.query(
          `INSERT INTO music_subscriptions 
          (id, user_id, subscription_type, start_date, end_date, created_at) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          {
            params: [
              sub.id, sub.user_id, sub.subscription_type,
              sub.start_date, sub.end_date, sub.created_at
            ]
          },
          this.authToken
        );
        
        this.updateStatus(table, { migrated: this.migrationStatuses.find(s => s.table === table)!.migrated + 1 });
      }
      
      this.updateStatus(table, { status: 'completed' });
    } catch (error) {
      this.updateStatus(table, { status: 'failed', error: error.message });
      throw error;
    }
  }

  // The rest of the migration methods follow the same pattern
  // Migrate songs
  public async migrateSongs(): Promise<void> {
    // ... Implementation similar to other migration methods
    const table = 'songs';
    try {
      this.updateStatus(table, { status: 'in_progress' });
      
      const { data: songs, error } = await supabase
        .from('songs')
        .select('*');
        
      if (error) throw error;
      
      this.updateStatus(table, { total: songs.length });
      
      for (const song of songs) {
        await d1Worker.query(
          `INSERT INTO songs 
          (id, title, youtube_url, preview_start_seconds, preview_duration_seconds, created_at) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          {
            params: [
              song.id, song.title, song.youtube_url,
              song.preview_start_seconds, song.preview_duration_seconds, 
              song.created_at
            ]
          },
          this.authToken
        );
        
        this.updateStatus(table, { migrated: this.migrationStatuses.find(s => s.table === table)!.migrated + 1 });
      }
      
      this.updateStatus(table, { status: 'completed' });
    } catch (error) {
      this.updateStatus(table, { status: 'failed', error: error.message });
      throw error;
    }
  }
  
  // Migrate user song selections
  public async migrateUserSongSelections(): Promise<void> {
    const table = 'user_song_selections';
    try {
      this.updateStatus(table, { status: 'in_progress' });
      
      const { data: selections, error } = await supabase
        .from('user_song_selections')
        .select('*');
        
      if (error) throw error;
      
      this.updateStatus(table, { total: selections.length });
      
      for (const selection of selections) {
        await d1Worker.query(
          `INSERT INTO user_song_selections 
          (id, user_id, song_id, created_at) 
          VALUES (?, ?, ?, ?)`,
          {
            params: [
              selection.id, selection.user_id, selection.song_id, selection.created_at
            ]
          },
          this.authToken
        );
        
        this.updateStatus(table, { migrated: this.migrationStatuses.find(s => s.table === table)!.migrated + 1 });
      }
      
      this.updateStatus(table, { status: 'completed' });
    } catch (error) {
      this.updateStatus(table, { status: 'failed', error: error.message });
      throw error;
    }
  }
  
  // Migrate user music settings
  public async migrateUserMusicSettings(): Promise<void> {
    const table = 'user_music_settings';
    try {
      this.updateStatus(table, { status: 'in_progress' });
      
      const { data: settings, error } = await supabase
        .from('user_music_settings')
        .select('*');
        
      if (error) throw error;
      
      this.updateStatus(table, { total: settings.length });
      
      for (const setting of settings) {
        await d1Worker.query(
          `INSERT INTO user_music_settings 
          (id, user_id, volume_level, music_enabled, created_at) 
          VALUES (?, ?, ?, ?, ?)`,
          {
            params: [
              setting.id, setting.user_id, setting.volume_level,
              setting.music_enabled ? 1 : 0, setting.created_at
            ]
          },
          this.authToken
        );
        
        this.updateStatus(table, { migrated: this.migrationStatuses.find(s => s.table === table)!.migrated + 1 });
      }
      
      this.updateStatus(table, { status: 'completed' });
    } catch (error) {
      this.updateStatus(table, { status: 'failed', error: error.message });
      throw error;
    }
  }
  
  // Migrate animorph cards
  public async migrateAnimorphCards(): Promise<void> {
    const table = 'animorph_cards';
    try {
      this.updateStatus(table, { status: 'in_progress' });
      
      const { data: cards, error } = await supabase
        .from('animorph_cards')
        .select('*');
        
      if (error) throw error;
      
      this.updateStatus(table, { total: cards.length });
      
      for (const card of cards) {
        await d1Worker.query(
          `INSERT INTO animorph_cards 
          (id, name, type, power, health, attack, sats, size, image_url, 
          nft_name, card_number, animorph_type, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            params: [
              card.id, card.name, card.type, card.power, card.health,
              card.attack, card.sats, card.size, card.image_url,
              card.nft_name, card.card_number, card.animorph_type, card.created_at
            ]
          },
          this.authToken
        );
        
        this.updateStatus(table, { migrated: this.migrationStatuses.find(s => s.table === table)!.migrated + 1 });
      }
      
      this.updateStatus(table, { status: 'completed' });
    } catch (error) {
      this.updateStatus(table, { status: 'failed', error: error.message });
      throw error;
    }
  }
  
  // Migrate VIP codes
  public async migrateVipCodes(): Promise<void> {
    const table = 'vip_codes';
    try {
      this.updateStatus(table, { status: 'in_progress' });
      
      const { data: codes, error } = await supabase
        .from('vip_codes')
        .select('*');
        
      if (error) throw error;
      
      this.updateStatus(table, { total: codes.length });
      
      for (const code of codes) {
        await d1Worker.query(
          `INSERT INTO vip_codes 
          (id, code, max_uses, current_uses, created_at) 
          VALUES (?, ?, ?, ?, ?)`,
          {
            params: [
              code.id, code.code, code.max_uses, 
              code.current_uses, code.created_at
            ]
          },
          this.authToken
        );
        
        this.updateStatus(table, { migrated: this.migrationStatuses.find(s => s.table === table)!.migrated + 1 });
      }
      
      this.updateStatus(table, { status: 'completed' });
    } catch (error) {
      this.updateStatus(table, { status: 'failed', error: error.message });
      throw error;
    }
  }
  
  // Migrate user presence
  public async migrateUserPresence(): Promise<void> {
    const table = 'user_presence';
    try {
      this.updateStatus(table, { status: 'in_progress' });
      
      const { data: presence, error } = await supabase
        .from('user_presence')
        .select('*');
        
      if (error) throw error;
      
      this.updateStatus(table, { total: presence.length });
      
      for (const entry of presence) {
        await d1Worker.query(
          `INSERT INTO user_presence 
          (user_id, status, last_seen, created_at) 
          VALUES (?, ?, ?, ?)`,
          {
            params: [
              entry.user_id, entry.status, entry.last_seen, entry.created_at
            ]
          },
          this.authToken
        );
        
        this.updateStatus(table, { migrated: this.migrationStatuses.find(s => s.table === table)!.migrated + 1 });
      }
      
      this.updateStatus(table, { status: 'completed' });
    } catch (error) {
      this.updateStatus(table, { status: 'failed', error: error.message });
      throw error;
    }
  }
}

// Create a data migration admin page component
export const runMigration = async (token: string): Promise<MigrationStatus[]> => {
  const migrator = new SupabaseToD1Migrator(token);
  return await migrator.migrateAll();
};
