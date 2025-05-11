
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Cloudflare configuration
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const D1_DATABASE_ID = process.env.D1_BINDING_NAME;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch data from Supabase table
 */
async function fetchSupabaseData(table, query = {}) {
  try {
    console.log(`Fetching data from ${table}...`);
    
    let queryBuilder = supabase
      .from(table)
      .select('*');
      
    // Apply any additional query parameters
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }
    
    if (query.orderBy) {
      queryBuilder = queryBuilder.order(query.orderBy.column, { 
        ascending: query.orderBy.ascending 
      });
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      throw error;
    }
    
    console.log(`Retrieved ${data.length} records from ${table}`);
    return data;
  } catch (error) {
    console.error(`Error fetching data from ${table}:`, error);
    throw error;
  }
}

/**
 * Generate SQL statements for D1 migration
 */
function generateSqlInserts(table, data) {
  if (!data || data.length === 0) {
    return '';
  }
  
  // Get column names from first record
  const columns = Object.keys(data[0]);
  
  // Generate SQL statements
  const insertStatements = data.map(record => {
    const values = columns.map(column => {
      const value = record[column];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return 'NULL';
      } else if (typeof value === 'string') {
        // Escape single quotes
        return `'${value.replace(/'/g, "''")}'`;
      } else if (typeof value === 'object') {
        // Stringify objects/arrays and escape single quotes
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      } else {
        return value;
      }
    });
    
    return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
  });
  
  return insertStatements.join('\n');
}

/**
 * Push SQL to D1 database using Cloudflare API
 */
async function executeD1Migration(sqlStatements) {
  try {
    // Split into batches of 100 statements to avoid request size limits
    const batches = [];
    const statements = sqlStatements.split('\n');
    
    for (let i = 0; i < statements.length; i += 100) {
      batches.push(statements.slice(i, i + 100).join('\n'));
    }
    
    console.log(`Executing migration in ${batches.length} batches...`);
    
    for (let i = 0; i < batches.length; i++) {
      console.log(`Executing batch ${i + 1} of ${batches.length}...`);
      
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CF_API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sql: batches[i]
          })
        }
      );
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(`D1 query failed: ${JSON.stringify(result.errors)}`);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error executing D1 migration:', error);
    throw error;
  }
}

/**
 * Save SQL to file
 */
function saveSqlToFile(sql, filename) {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, sql);
  console.log(`SQL saved to ${filePath}`);
}

/**
 * Main migration function
 */
async function migrateData() {
  try {
    console.log('Starting data migration from Supabase to Cloudflare D1...');
    
    // Tables to migrate
    const tables = [
      'profiles',
      'payment_status',
      'cards',
      'lobbies',
      'battle_history',
      'achievements',
      'user_achievements',
      'vip_codes'
    ];
    
    let allSql = '';
    
    // Migrate each table
    for (const table of tables) {
      console.log(`Migrating ${table}...`);
      
      // Fetch data from Supabase
      const data = await fetchSupabaseData(table);
      
      // Generate SQL inserts
      const sql = generateSqlInserts(table, data);
      
      if (sql) {
        allSql += `-- Migrating ${table} table\n${sql}\n\n`;
      }
    }
    
    // Save all SQL to file
    saveSqlToFile(allSql, 'data-migration.sql');
    
    // Execute migration
    if (process.argv.includes('--execute')) {
      console.log('Executing migration...');
      await executeD1Migration(allSql);
    } else {
      console.log('Migration SQL generated. Run with --execute flag to apply changes.');
    }
    
    console.log('Migration process completed.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData();
