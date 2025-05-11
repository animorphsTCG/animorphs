
#!/usr/bin/env node

/**
 * Migration script for transferring data from Supabase to Cloudflare D1
 * 
 * This script connects to both databases and migrates user profiles,
 * payment status, and other essential data.
 * 
 * Usage:
 *   node migrate-to-cloudflare.js
 */

// Import required packages
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Configuration variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const CLOUDFLARE_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CF_API_TOKEN;
const D1_DATABASE_ID = process.env.D1_BINDING_NAME || '44cd43b3-629e-4cf6-88ea-f6999339abb1';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize a console logger with timestamps
const log = (...args) => {
  const now = new Date();
  console.log(`[${now.toISOString()}]`, ...args);
};

// Helper function to make Cloudflare API requests
async function callCloudflareAPI(endpoint, method = 'GET', body = null) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API error: ${JSON.stringify(data.errors)}`);
    }
    
    return data.result;
  } catch (error) {
    log(`Error calling Cloudflare API: ${error.message}`);
    throw error;
  }
}

// Execute SQL on D1 database
async function executeD1Query(sql, params = []) {
  try {
    const result = await callCloudflareAPI(
      `d1/database/${D1_DATABASE_ID}/query`,
      'POST',
      { sql, params }
    );
    return result;
  } catch (error) {
    log(`D1 query error: ${error.message}`);
    throw error;
  }
}

// Check if D1 database exists and has required tables
async function checkD1Schema() {
  try {
    log('Checking D1 schema...');
    
    // Check if the database exists
    const dbInfo = await callCloudflareAPI(`d1/database/${D1_DATABASE_ID}`);
    log(`Database found: ${dbInfo.name}`);
    
    // Check if required tables exist
    const result = await executeD1Query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('profiles', 'payment_status', 'music_subscriptions')
    `);
    
    const existingTables = result.results.map(row => row.name);
    log(`Found tables: ${existingTables.join(', ')}`);
    
    const requiredTables = ['profiles', 'payment_status', 'music_subscriptions'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      log(`Missing tables: ${missingTables.join(', ')}`);
      return false;
    }
    
    return true;
  } catch (error) {
    log(`Error checking D1 schema: ${error.message}`);
    return false;
  }
}

// Create database schema if needed
async function createD1Schema() {
  log('Creating D1 schema...');
  
  try {
    // Read the SQL migration file
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '../worker-templates/d1-migration.sql'),
      'utf8'
    );
    
    // Split into individual statements
    const statements = migrationSql.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Execute each statement
    for (const sql of statements) {
      log(`Executing: ${sql.substring(0, 50)}...`);
      await executeD1Query(sql);
    }
    
    log('Schema created successfully');
    return true;
  } catch (error) {
    log(`Error creating schema: ${error.message}`);
    return false;
  }
}

// Migrate profiles from Supabase to D1
async function migrateProfiles() {
  log('Migrating user profiles...');
  
  try {
    // Fetch all profiles from Supabase
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    
    if (error) {
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }
    
    log(`Found ${profiles.length} profiles to migrate`);
    
    // Insert each profile into D1
    for (const profile of profiles) {
      // Check if profile already exists
      const existingProfile = await executeD1Query(
        'SELECT id FROM profiles WHERE id = ?',
        [profile.id]
      );
      
      if (existingProfile.results.length > 0) {
        log(`Profile ${profile.id} already exists, updating...`);
        
        // Update existing profile
        await executeD1Query(`
          UPDATE profiles SET
            username = ?,
            name = ?,
            surname = ?,
            bio = ?,
            country = ?,
            gender = ?,
            age = ?,
            mp = ?,
            ai_points = ?,
            lbp = ?,
            digi = ?,
            gold = ?,
            music_unlocked = ?,
            favorite_animorph = ?,
            favorite_battle_mode = ?,
            online_times_gmt2 = ?,
            playing_times = ?,
            profile_image_url = ?,
            is_admin = ?
          WHERE id = ?
        `, [
          profile.username,
          profile.name,
          profile.surname,
          profile.bio,
          profile.country,
          profile.gender,
          profile.age,
          profile.mp || 0,
          profile.ai_points || 0,
          profile.lbp || 0,
          profile.digi || 0,
          profile.gold || 0,
          profile.music_unlocked ? 1 : 0,
          profile.favorite_animorph,
          profile.favorite_battle_mode,
          profile.online_times_gmt2,
          profile.playing_times,
          profile.profile_image_url,
          profile.is_admin ? 1 : 0,
          profile.id
        ]);
      } else {
        log(`Creating new profile for ${profile.id}...`);
        
        // Insert new profile
        await executeD1Query(`
          INSERT INTO profiles (
            id, username, name, surname, bio, country, gender, age,
            mp, ai_points, lbp, digi, gold, music_unlocked,
            favorite_animorph, favorite_battle_mode, online_times_gmt2,
            playing_times, profile_image_url, is_admin, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          profile.id,
          profile.username,
          profile.name,
          profile.surname,
          profile.bio,
          profile.country,
          profile.gender,
          profile.age,
          profile.mp || 0,
          profile.ai_points || 0,
          profile.lbp || 0,
          profile.digi || 0,
          profile.gold || 0,
          profile.music_unlocked ? 1 : 0,
          profile.favorite_animorph,
          profile.favorite_battle_mode,
          profile.online_times_gmt2,
          profile.playing_times,
          profile.profile_image_url,
          profile.is_admin ? 1 : 0,
          profile.created_at
        ]);
      }
    }
    
    log(`Successfully migrated ${profiles.length} profiles`);
    return true;
  } catch (error) {
    log(`Error migrating profiles: ${error.message}`);
    return false;
  }
}

// Migrate payment status from Supabase to D1
async function migratePaymentStatus() {
  log('Migrating payment status...');
  
  try {
    // Fetch all payment status records from Supabase
    const { data: paymentRecords, error } = await supabase.from('payment_status').select('*');
    
    if (error) {
      throw new Error(`Failed to fetch payment status: ${error.message}`);
    }
    
    log(`Found ${paymentRecords.length} payment records to migrate`);
    
    // Insert each payment record into D1
    for (const record of paymentRecords) {
      // Check if record already exists
      const existingRecord = await executeD1Query(
        'SELECT id FROM payment_status WHERE id = ?',
        [record.id]
      );
      
      if (existingRecord.results.length > 0) {
        log(`Payment record for ${record.id} already exists, updating...`);
        
        // Update existing record
        await executeD1Query(`
          UPDATE payment_status SET
            has_paid = ?,
            payment_date = ?,
            payment_method = ?,
            transaction_id = ?,
            updated_at = ?
          WHERE id = ?
        `, [
          record.has_paid ? 1 : 0,
          record.payment_date,
          record.payment_method,
          record.transaction_id,
          new Date().toISOString(),
          record.id
        ]);
      } else {
        log(`Creating new payment record for ${record.id}...`);
        
        // Insert new record
        await executeD1Query(`
          INSERT INTO payment_status (
            id, has_paid, payment_date, payment_method,
            transaction_id, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          record.id,
          record.has_paid ? 1 : 0,
          record.payment_date,
          record.payment_method,
          record.transaction_id,
          record.created_at,
          record.updated_at || new Date().toISOString()
        ]);
      }
    }
    
    log(`Successfully migrated ${paymentRecords.length} payment records`);
    return true;
  } catch (error) {
    log(`Error migrating payment status: ${error.message}`);
    return false;
  }
}

// Migrate music subscriptions from Supabase to D1
async function migrateMusicSubscriptions() {
  log('Migrating music subscriptions...');
  
  try {
    // Fetch all subscriptions from Supabase
    const { data: subscriptions, error } = await supabase.from('music_subscriptions').select('*');
    
    if (error) {
      throw new Error(`Failed to fetch music subscriptions: ${error.message}`);
    }
    
    log(`Found ${subscriptions.length} subscriptions to migrate`);
    
    // Insert each subscription into D1
    for (const sub of subscriptions) {
      // Check if subscription already exists
      const existingSub = await executeD1Query(
        'SELECT id FROM music_subscriptions WHERE id = ?',
        [sub.id]
      );
      
      if (existingSub.results.length > 0) {
        log(`Subscription ${sub.id} already exists, updating...`);
        
        // Update existing subscription
        await executeD1Query(`
          UPDATE music_subscriptions SET
            user_id = ?,
            subscription_type = ?,
            start_date = ?,
            end_date = ?
          WHERE id = ?
        `, [
          sub.user_id,
          sub.subscription_type,
          sub.start_date,
          sub.end_date,
          sub.id
        ]);
      } else {
        log(`Creating new subscription for ${sub.user_id}...`);
        
        // Insert new subscription
        await executeD1Query(`
          INSERT INTO music_subscriptions (
            id, user_id, subscription_type,
            start_date, end_date, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          sub.id,
          sub.user_id,
          sub.subscription_type,
          sub.start_date,
          sub.end_date,
          sub.created_at
        ]);
      }
    }
    
    log(`Successfully migrated ${subscriptions.length} music subscriptions`);
    return true;
  } catch (error) {
    log(`Error migrating music subscriptions: ${error.message}`);
    return false;
  }
}

// Main migration function
async function runMigration() {
  log('Starting migration from Supabase to Cloudflare D1...');
  
  // Check if D1 schema exists
  const schemaExists = await checkD1Schema();
  
  // Create schema if needed
  if (!schemaExists) {
    const schemaCreated = await createD1Schema();
    if (!schemaCreated) {
      log('Failed to create schema. Migration aborted.');
      return;
    }
  }
  
  // Migrate data
  await migrateProfiles();
  await migratePaymentStatus();
  await migrateMusicSubscriptions();
  
  log('Migration completed successfully');
}

// Run the migration
runMigration().catch(error => {
  log(`Migration failed: ${error.message}`);
  process.exit(1);
});
