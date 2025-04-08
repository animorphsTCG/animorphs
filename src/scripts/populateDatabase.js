
/**
 * This is a utility script to populate the database with Animorph card data.
 * To run this script:
 * 1. Save it as a separate file
 * 2. Run it with Node.js
 * 3. Make sure to have installed @supabase/supabase-js
 * 
 * Usage: node populateDatabase.js
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const SUPABASE_URL = "https://orrmjadspjsbdfnhnkgu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycm1qYWRzcGpzYmRmbmhua2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODQ0MTksImV4cCI6MjA1OTE2MDQxOX0.p8Du23Cz-I-ja9yc0howqrtboJxBZp9muuFY4xVSPoU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to clean numeric values by removing commas
const cleanNumericValue = (value) => {
  if (typeof value === 'string') {
    return parseInt(value.replace(/,/g, ''), 10);
  }
  return value;
};

// Sample of Animorph card data (first few entries as an example)
const animorphCards = [
  {
    card_number: 1,
    image_url: "https://i.seadn.io/s/raw/files/2c2c7158e07c18404db94aaf237a1577.png?auto=format&dpr=1&w=1000",
    nft_name: "Aardvark",
    animorph_type: "Fire",
    power: 13733,
    health: 2141,
    attack: 1735,
    sats: 35860,
    size: 3430
  },
  {
    card_number: 2,
    image_url: "https://i.seadn.io/s/raw/files/b8c812803538928932ba68428a0ee060.png?auto=format&dpr=1&w=1000",
    nft_name: "African Lion",
    animorph_type: "Fire",
    power: 19707,
    health: 2189,
    attack: 3043,
    sats: 47703,
    size: 5094
  },
  // Add more entries as needed...
];

// Process and insert the Animorph card data
const populateDatabase = async () => {
  console.log("Starting database population...");
  
  // Clean numeric values and format entries
  const formattedCards = animorphCards.map(card => ({
    card_number: card.card_number,
    image_url: card.image_url,
    nft_name: card.nft_name,
    animorph_type: card.animorph_type,
    power: cleanNumericValue(card.power),
    health: cleanNumericValue(card.health),
    attack: cleanNumericValue(card.attack),
    sats: cleanNumericValue(card.sats),
    size: cleanNumericValue(card.size)
  }));
  
  // Insert data in batches
  const batchSize = 25;
  for (let i = 0; i < formattedCards.length; i += batchSize) {
    const batch = formattedCards.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('animorph_cards')
      .upsert(batch, { onConflict: 'card_number' });
      
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Batch ${i / batchSize + 1} inserted successfully`);
    }
  }
  
  console.log("Database population complete!");
};

// Run the population function
populateDatabase();
