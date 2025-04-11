
import { supabase } from "@/integrations/supabase/client";
import { AnimorphCard, VipCode } from "@/types";

// Simple in-memory cache implementation
const cache = {
  animorphCards: new Map<string, { data: AnimorphCard[], timestamp: number }>(),
  cardById: new Map<number, { data: AnimorphCard | null, timestamp: number }>(),
  vipCodes: new Map<string, { data: VipCode, timestamp: number }>(),
  
  // Cache expiration in milliseconds (5 minutes)
  EXPIRATION: 5 * 60 * 1000,
  
  // Check if cached data is still valid
  isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.EXPIRATION;
  },
  
  // Clear all caches (useful for testing or when data changes)
  clear(): void {
    this.animorphCards.clear();
    this.cardById.clear();
    this.vipCodes.clear();
    console.log("Cache cleared");
  }
};

// Rate limiting implementation
const rateLimiter = {
  requests: new Map<string, { count: number, timestamp: number }>(),
  
  // Reset period in milliseconds (1 minute)
  RESET_PERIOD: 60 * 1000,
  
  // Maximum requests per period 
  MAX_REQUESTS: 100,
  
  // Check if request should be rate limited
  shouldLimit(key: string): boolean {
    const now = Date.now();
    const record = this.requests.get(key);
    
    // If no record or expired record, create new record
    if (!record || (now - record.timestamp > this.RESET_PERIOD)) {
      this.requests.set(key, { count: 1, timestamp: now });
      return false;
    }
    
    // Increment count
    record.count++;
    
    // Check if over limit
    return record.count > this.MAX_REQUESTS;
  }
};

export async function fetchAnimorphCards(limit: number = 1000, offset: number = 0): Promise<AnimorphCard[]> {
  const cacheKey = `cards_${limit}_${offset}`;
  
  // Check cache first
  const cached = cache.animorphCards.get(cacheKey);
  if (cached && cache.isValid(cached.timestamp)) {
    console.log("Using cached animorph cards");
    return cached.data;
  }
  
  try {
    const { data, error } = await supabase
      .from("animorph_cards")
      .select("*")
      .order('card_number', { ascending: true })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error("Error fetching animorph cards:", error);
      throw error;
    }
    
    if (!data) {
      console.warn("No cards found or null data returned");
      return [];
    }
    
    const result = data as AnimorphCard[];
    
    // Store in cache
    cache.animorphCards.set(cacheKey, { 
      data: result, 
      timestamp: Date.now() 
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching animorph cards:", error);
    throw error;
  }
}

export async function getRandomDeck(size: number = 10, excludeCardIds: number[] = []): Promise<AnimorphCard[]> {
  try {
    // For random deck, we don't use cache as it should be random each time
    let query = supabase
      .from("animorph_cards")
      .select("*");
      
    if (excludeCardIds.length > 0) {
      query = query.not('id', 'in', `(${excludeCardIds.join(',')})`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error getting random deck:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn("No cards found for random deck");
      return [];
    }
    
    return (data as AnimorphCard[])
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(size, data.length));
  } catch (error) {
    console.error("Error getting random deck:", error);
    throw error;
  }
}

export async function fetchCardsByType(type: string, limit: number = 5): Promise<AnimorphCard[]> {
  const cacheKey = `cards_type_${type}_${limit}`;
  
  // Check cache first
  const cached = cache.animorphCards.get(cacheKey);
  if (cached && cache.isValid(cached.timestamp)) {
    console.log(`Using cached ${type} cards`);
    return cached.data;
  }
  
  try {
    const { data, error } = await supabase
      .from("animorph_cards")
      .select("*")
      .eq("animorph_type", type)
      .limit(limit);
      
    if (error) {
      console.error(`Error fetching ${type} cards:`, error);
      throw error;
    }
    
    const result = data as AnimorphCard[] || [];
    
    // Store in cache
    cache.animorphCards.set(cacheKey, { 
      data: result, 
      timestamp: Date.now() 
    });
    
    return result;
  } catch (error) {
    console.error(`Error fetching ${type} cards:`, error);
    throw error;
  }
}

export async function fetchCardById(id: number): Promise<AnimorphCard | null> {
  // Check cache first
  const cached = cache.cardById.get(id);
  if (cached && cache.isValid(cached.timestamp)) {
    console.log(`Using cached card with id ${id}`);
    return cached.data;
  }
  
  try {
    const { data, error } = await supabase
      .from("animorph_cards")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`No card found with id: ${id}`);
        
        // Cache negative result too
        cache.cardById.set(id, { 
          data: null, 
          timestamp: Date.now() 
        });
        
        return null;
      }
      console.error(`Error fetching card with id ${id}:`, error);
      throw error;
    }
    
    const result = data as AnimorphCard;
    
    // Store in cache
    cache.cardById.set(id, { 
      data: result, 
      timestamp: Date.now() 
    });
    
    return result;
  } catch (error) {
    console.error(`Error fetching card with id ${id}:`, error);
    throw error;
  }
}

// Create or update VIP codes to ensure they are in the database
export async function ensureVipCodesExist() {
  // Don't rate limit this admin function
  try {
    const vipCodes = [
      { code: "ZypherDan", max_uses: 51, description: "Promotional code for early supporters" },
      { code: "WonAgainstAi", max_uses: 50, description: "Victory reward code" }
    ];
    
    for (const codeData of vipCodes) {
      // Check if code exists - case insensitive
      const { data } = await supabase
        .from("vip_codes")
        .select("*")
        .ilike("code", codeData.code);
      
      if (!data || data.length === 0) {
        // Create new code
        await supabase
          .from("vip_codes")
          .insert({
            code: codeData.code,
            max_uses: codeData.max_uses,
            current_uses: 0,
            description: codeData.description
          });
        console.log(`Created VIP code: ${codeData.code}`);
      }
    }
    
    // Clear the VIP code cache after updates
    cache.vipCodes.clear();
    
    return true;
  } catch (error) {
    console.error("Error ensuring VIP codes exist:", error);
    return false;
  }
}

// Function to check database connection and tables
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Check VIP codes table
    const { error: vipError } = await supabase
      .from('vip_codes')
      .select('count')
      .limit(1);
    
    if (vipError) {
      console.error('VIP codes table check failed:', vipError);
      return false;
    }
    
    // Check animorph_cards table
    const { error: cardsError } = await supabase
      .from('animorph_cards')
      .select('count')
      .limit(1);
    
    if (cardsError) {
      console.error('Animorph cards table check failed:', cardsError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Improved function to validate VIP codes with robust error handling and caching
export async function validateVipCode(vipCode: string): Promise<boolean> {
  if (!vipCode || vipCode.trim() === "") {
    return true; // Empty code is valid (optional)
  }

  const trimmedCode = vipCode.trim().toLowerCase(); // Normalize to lowercase
  
  try {
    console.log("Validating VIP code:", trimmedCode);
    
    // Check cache first
    const cached = cache.vipCodes.get(trimmedCode);
    if (cached && cache.isValid(cached.timestamp)) {
      console.log("Using cached VIP code data");
      return cached.data.current_uses < cached.data.max_uses;
    }
    
    // Rate limit validation requests
    if (rateLimiter.shouldLimit(`validate_vip_${trimmedCode}`)) {
      console.warn("Rate limit exceeded for VIP code validation");
      throw new Error("Too many validation attempts. Please try again later.");
    }
    
    // Use explicit LOWER function to ensure case insensitivity
    const { data, error } = await supabase
      .from("vip_codes")
      .select("*")
      .ilike("code", trimmedCode);
      
    if (error) {
      console.error("VIP code validation error:", error);
      return false;
    }
    
    console.log("VIP code query result:", data);
    
    if (!data || data.length === 0) {
      console.log("VIP code not found in database");
      return false;
    }
    
    const vipCodeData = data[0] as VipCode;
    console.log("VIP code found:", vipCodeData);
    
    // Store in cache
    cache.vipCodes.set(trimmedCode, { 
      data: vipCodeData, 
      timestamp: Date.now() 
    });
    
    // Check if the code has remaining uses
    return vipCodeData.current_uses < vipCodeData.max_uses;
  } catch (err) {
    console.error("Error validating VIP code:", err);
    return false;
  }
}

// Improved function to update VIP code usage count with caching
export async function updateVipCodeUsage(vipCode: string): Promise<boolean> {
  if (!vipCode || vipCode.trim() === "") {
    return true; // No code to update
  }

  const trimmedCode = vipCode.trim().toLowerCase(); // Normalize to lowercase
  
  try {
    console.log("Updating usage for VIP code:", trimmedCode);
    
    // Rate limit update requests
    if (rateLimiter.shouldLimit(`update_vip_${trimmedCode}`)) {
      console.warn("Rate limit exceeded for VIP code updates");
      throw new Error("Too many update attempts. Please try again later.");
    }
    
    // Use explicit filter to ensure case insensitivity
    const { data, error } = await supabase
      .from("vip_codes")
      .select("*")
      .ilike("code", trimmedCode);
      
    if (error || !data || data.length === 0) {
      console.error("Error getting VIP code for update:", error || "No data found");
      return false;
    }
    
    const vipCodeData = data[0] as VipCode;
    console.log("Current usage:", vipCodeData.current_uses, "Max uses:", vipCodeData.max_uses);
    
    // Update the usage count
    const { error: updateError } = await supabase
      .from("vip_codes")
      .update({
        current_uses: vipCodeData.current_uses + 1
      })
      .eq("id", vipCodeData.id);
      
    if (updateError) {
      console.error("Error updating VIP code usage:", updateError);
      return false;
    }
    
    // Update the cache with the new value
    vipCodeData.current_uses += 1;
    cache.vipCodes.set(trimmedCode, { 
      data: vipCodeData, 
      timestamp: Date.now() 
    });
    
    console.log("VIP code usage updated successfully");
    return true;
  } catch (err) {
    console.error("Error updating VIP code usage:", err);
    return false;
  }
}

// New function to clear the cache (useful for testing or when data changes)
export function clearCache(): void {
  cache.clear();
}
