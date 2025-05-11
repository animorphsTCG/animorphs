
/**
 * Migration script to transfer data from Supabase to Cloudflare D1
 * To run:
 * 1. Install required packages: npm install @supabase/supabase-js dotenv
 * 2. Set up your .env with Supabase and Cloudflare credentials
 * 3. Run with Node.js: node migrate-to-d1.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const D1_DATABASE_NAME = process.env.D1_DATABASE_NAME || 'animorphs-db';

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Tables to migrate
const TABLES_TO_MIGRATE = [
  'profiles',
  'payment_status',
  'music_subscriptions',
  'animorph_cards',
  'battle_lobbies',
  'lobby_participants',
  'battle_sessions',
  'battle_participants',
  'battle_state',
  'battle_results',
  'vip_codes',
  'songs',
  'user_music_settings'
];

// Main migration function
async function migrateData() {
  console.log('Starting migration from Supabase to Cloudflare D1...');
  
  // Create temporary directory for SQL files
  const tempDir = path.join(__dirname, 'temp_migration');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  try {
    // Process each table
    for (const table of TABLES_TO_MIGRATE) {
      console.log(`\nProcessing table: ${table}`);
      await migrateTable(table, tempDir);
    }
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Clean up
    fs.rmdirSync(tempDir, { recursive: true });
  }
}

// Migrate a single table
async function migrateTable(tableName, tempDir) {
  try {
    // 1. Get data from Supabase
    console.log(`  Fetching data from Supabase: ${tableName}`);
    const { data, error } = await supabase.from(tableName).select('*');
    
    if (error) {
      throw new Error(`Error fetching data from ${tableName}: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log(`  No data found in ${tableName}, skipping`);
      return;
    }
    
    console.log(`  Found ${data.length} records`);
    
    // 2. Generate SQL insert statements
    const sqlFile = path.join(tempDir, `${tableName}.sql`);
    console.log(`  Generating SQL file: ${sqlFile}`);
    
    const sqlInserts = generateInserts(tableName, data);
    fs.writeFileSync(sqlFile, sqlInserts);
    
    // 3. Execute SQL with wrangler
    console.log(`  Executing SQL with wrangler...`);
    const wranglerCmd = `wrangler d1 execute ${D1_DATABASE_NAME} --file=${sqlFile} --account-id=${CF_ACCOUNT_ID} --json`;
    
    await new Promise((resolve, reject) => {
      exec(wranglerCmd, (error, stdout, stderr) => {
        if (error) {
          reject(`Error executing wrangler command: ${error.message}\n${stderr}`);
          return;
        }
        console.log(`  Success: Migrated ${data.length} records to ${tableName}`);
        resolve();
      });
    });
    
  } catch (error) {
    console.error(`Error migrating ${tableName}:`, error);
  }
}

// Generate SQL INSERT statements
function generateInserts(tableName, data) {
  if (data.length === 0) return '';
  
  // Get column names from the first record
  const columns = Object.keys(data[0]);
  
  // Generate INSERT statements in batches
  const batchSize = 100;
  let sql = '';
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    sql += `-- Batch ${Math.floor(i / batchSize) + 1}\n`;
    sql += `INSERT INTO ${tableName} (${columns.join(', ')})\nVALUES\n`;
    
    const valueStrings = batch.map(record => {
      const values = columns.map(column => {
        const value = record[column];
        
        // Handle different data types
        if (value === null) {
          return 'NULL';
        } else if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
        } else if (typeof value === 'object') {
          return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        } else {
          return value;
        }
      });
      
      return `(${values.join(', ')})`;
    });
    
    sql += valueStrings.join(',\n');
    sql += ';\n\n';
  }
  
  return sql;
}

// Run the migration
migrateData();
