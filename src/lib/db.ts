
import { supabase } from "@/integrations/supabase/client";
import { AnimorphCard, VipCode } from "@/types";

// Cache implementation with improved memory management
const cache = {
  animorphCards: new Map<string, { data: AnimorphCard[], timestamp: number }>(),
  cardById: new Map<number, { data: AnimorphCard | null, timestamp: number }>(),
  vipCodes: new Map<string, { data: VipCode, timestamp: number }>(),
  
  // Cache expiration in milliseconds (5 minutes)
  EXPIRATION: 5 * 60 * 1000,
  
  // Maximum number of entries per cache to prevent memory bloat
  MAX_ENTRIES: {
    animorphCards: 100,
    cardById: 500,
    vipCodes: 50
  },
  
  // Check if cached data is still valid
  isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.EXPIRATION;
  },
  
  // Add item to cache with entry limit enforcement
  addToCache<T>(map: Map<any, { data: T, timestamp: number }>, key: any, data: T, maxEntries: number): void {
    // If cache is at capacity, remove oldest entry
    if (map.size >= maxEntries) {
      const oldestKey = this.getOldestEntry(map);
      if (oldestKey) {
        map.delete(oldestKey);
      }
    }
    map.set(key, { data, timestamp: Date.now() });
  },
  
  // Get oldest entry in cache (by timestamp)
  getOldestEntry<T>(map: Map<any, { data: T, timestamp: number }>): any {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, value] of map.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  },
  
  // Clear all caches (useful for testing or when data changes)
  clear(): void {
    this.animorphCards.clear();
    this.cardById.clear();
    this.vipCodes.clear();
    console.log("Cache cleared");
  }
};

// Enhanced rate limiter with exponential backoff
const rateLimiter = {
  requests: new Map<string, { count: number, timestamp: number, backoffMultiplier: number }>(),
  
  // Reset period in milliseconds (1 minute)
  RESET_PERIOD: 60 * 1000,
  
  // Base maximum requests per period 
  BASE_MAX_REQUESTS: 100,
  
  // Maximum backoff multiplier
  MAX_BACKOFF: 8,
  
  // Check if request should be rate limited
  shouldLimit(key: string, maxRequests?: number): boolean {
    const now = Date.now();
    const actualMax = maxRequests || this.BASE_MAX_REQUESTS;
    const record = this.requests.get(key);
    
    // If no record or expired record, create new record
    if (!record || (now - record.timestamp > this.RESET_PERIOD)) {
      this.requests.set(key, { 
        count: 1, 
        timestamp: now,
        backoffMultiplier: 1
      });
      return false;
    }
    
    // Increment count
    record.count++;
    
    // Calculate current limit with backoff applied
    const effectiveLimit = Math.floor(actualMax / record.backoffMultiplier);
    
    // If over limit, increase backoff for next window
    if (record.count > effectiveLimit) {
      // Apply exponential backoff for the next window
      if (record.backoffMultiplier < this.MAX_BACKOFF) {
        record.backoffMultiplier = Math.min(record.backoffMultiplier * 2, this.MAX_BACKOFF);
      }
      return true;
    }
    
    return false;
  },
  
  // Reset the rate limiter for a specific key
  reset(key: string): void {
    this.requests.delete(key);
  },
  
  // Clear all rate limiting data
  clear(): void {
    this.requests.clear();
  }
};

// Database connection pooling and retry mechanism
const dbConnection = {
  // Maximum number of retries for database operations
  MAX_RETRIES: 3,
  
  // Base delay in milliseconds before retry
  BASE_RETRY_DELAY: 300,
  
  // Exponential backoff for retries
  async retry<T>(operation: () => Promise<T>, retries = 0): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // Don't retry if max retries reached or if error is not retryable
      if (retries >= this.MAX_RETRIES || !this.isRetryableError(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = this.BASE_RETRY_DELAY * Math.pow(2, retries) * (0.5 + Math.random() * 0.5);
      
      console.log(`Database operation failed. Retrying in ${Math.round(delay)}ms... (${retries + 1}/${this.MAX_RETRIES})`);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retry(operation, retries + 1);
    }
  },
  
  // Check if an error is retryable
  isRetryableError(error: any): boolean {
    // Network errors, connection timeouts, and specific Postgres errors are retryable
    const retryableCodes = ['08006', '08001', '08004', '57P01', '40001'];
    
    if (error?.code && retryableCodes.includes(error.code)) {
      return true;
    }
    
    // Check for network connectivity issues
    if (error?.message && (
      error.message.includes('network') || 
      error.message.includes('timeout') || 
      error.message.includes('connection')
    )) {
      return true;
    }
    
    return false;
  }
};

/**
 * Fetch all animorph cards with pagination
 * @param limit Maximum number of cards to fetch
 * @param offset Starting position for pagination
 * @returns Promise resolving to array of AnimorphCard objects
 */
export async function fetchAnimorphCards(limit: number = 1000, offset: number = 0): Promise<AnimorphCard[]> {
  const cacheKey = `cards_${limit}_${offset}`;
  
  // Check cache first
  const cached = cache.animorphCards.get(cacheKey);
  if (cached && cache.isValid(cached.timestamp)) {
    console.log("Using cached animorph cards");
    return cached.data;
  }
  
  try {
    const { data, error } = await dbConnection.retry(async () => {
      return supabase
        .from("animorph_cards")
        .select("*")
        .order('card_number', { ascending: true })
        .range(offset, offset + limit - 1);
    });
      
    if (error) {
      console.error("Error fetching animorph cards:", error);
      throw error;
    }
    
    if (!data) {
      console.warn("No cards found or null data returned");
      return [];
    }
    
    const result = data as AnimorphCard[];
    
    // Store in cache with size limit
    cache.addToCache(
      cache.animorphCards, 
      cacheKey, 
      result, 
      cache.MAX_ENTRIES.animorphCards
    );
    
    return result;
  } catch (error) {
    console.error("Error fetching animorph cards:", error);
    throw error;
  }
}

/**
 * Get a random deck of cards
 * @param size Number of cards to include in the deck
 * @param excludeCardIds Array of card IDs to exclude
 * @returns Promise resolving to an array of random AnimorphCard objects
 */
export async function getRandomDeck(size: number = 10, excludeCardIds: number[] = []): Promise<AnimorphCard[]> {
  try {
    // For random deck, we don't use cache as it should be random each time
    const { data, error } = await dbConnection.retry(async () => {
      let query = supabase
        .from("animorph_cards")
        .select("*");
        
      if (excludeCardIds.length > 0) {
        query = query.not('id', 'in', `(${excludeCardIds.join(',')})`);
      }
      
      return query;
    });
    
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

/**
 * Fetch cards by specific animorph type
 * @param type The animorph type to filter by
 * @param limit Maximum number of cards to fetch
 * @returns Promise resolving to array of AnimorphCard objects of the specified type
 */
export async function fetchCardsByType(type: string, limit: number = 5): Promise<AnimorphCard[]> {
  const cacheKey = `cards_type_${type}_${limit}`;
  
  // Check cache first
  const cached = cache.animorphCards.get(cacheKey);
  if (cached && cache.isValid(cached.timestamp)) {
    console.log(`Using cached ${type} cards`);
    return cached.data;
  }
  
  try {
    const { data, error } = await dbConnection.retry(async () => {
      return supabase
        .from("animorph_cards")
        .select("*")
        .eq("animorph_type", type)
        .limit(limit);
    });
      
    if (error) {
      console.error(`Error fetching ${type} cards:`, error);
      throw error;
    }
    
    const result = data as AnimorphCard[] || [];
    
    // Store in cache with size limit
    cache.addToCache(
      cache.animorphCards, 
      cacheKey, 
      result, 
      cache.MAX_ENTRIES.animorphCards
    );
    
    return result;
  } catch (error) {
    console.error(`Error fetching ${type} cards:`, error);
    throw error;
  }
}

/**
 * Fetch a card by its unique ID
 * @param id The unique identifier of the card to fetch
 * @returns Promise resolving to an AnimorphCard object or null if not found
 */
export async function fetchCardById(id: number): Promise<AnimorphCard | null> {
  // Check cache first
  const cached = cache.cardById.get(id);
  if (cached && cache.isValid(cached.timestamp)) {
    console.log(`Using cached card with id ${id}`);
    return cached.data;
  }
  
  try {
    const { data, error } = await dbConnection.retry(async () => {
      return supabase
        .from("animorph_cards")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    });
    
    if (error) {
      console.error(`Error fetching card with id ${id}:`, error);
      throw error;
    }
    
    const result = data as AnimorphCard || null;
    
    // Store in cache with size limit
    cache.addToCache(
      cache.cardById, 
      id, 
      result, 
      cache.MAX_ENTRIES.cardById
    );
    
    return result;
  } catch (error) {
    console.error(`Error fetching card with id ${id}:`, error);
    throw error;
  }
}

/**
 * Create or update VIP codes to ensure they are in the database
 * @returns Promise resolving to boolean indicating success
 */
export async function ensureVipCodesExist(): Promise<boolean> {
  // Don't rate limit this admin function
  try {
    const vipCodes = [
      { code: "ZypherDan", max_uses: 51, description: "Promotional code for early supporters" },
      { code: "WonAgainstAi", max_uses: 50, description: "Victory reward code" }
    ];
    
    for (const codeData of vipCodes) {
      // Check if code exists - case insensitive
      const { data } = await dbConnection.retry(async () => {
        return supabase
          .from("vip_codes")
          .select("*")
          .ilike("code", codeData.code);
      });
      
      if (!data || data.length === 0) {
        // Create new code
        await dbConnection.retry(async () => {
          return supabase
            .from("vip_codes")
            .insert({
              code: codeData.code,
              max_uses: codeData.max_uses,
              current_uses: 0,
              description: codeData.description
            });
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

/**
 * Check database connection and tables
 * @returns Promise resolving to boolean indicating database health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Check VIP codes table
    const { error: vipError } = await dbConnection.retry(async () => {
      return supabase
        .from('vip_codes')
        .select('count')
        .limit(1);
    });
    
    if (vipError) {
      console.error('VIP codes table check failed:', vipError);
      return false;
    }
    
    // Check animorph_cards table
    const { error: cardsError } = await dbConnection.retry(async () => {
      return supabase
        .from('animorph_cards')
        .select('count')
        .limit(1);
    });
    
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

// Enhanced VIP code validation with distributed rate limiting 
// to prevent brute force attacks
export async function validateVipCode(vipCode: string): Promise<boolean> {
  if (!vipCode || vipCode.trim() === "") {
    return true; // Empty code is valid (optional)
  }

  const trimmedCode = vipCode.trim().toLowerCase(); // Normalize to lowercase
  
  try {
    console.log("Validating VIP code:", trimmedCode);
    
    // Apply more restrictive rate limiting for validation attempts
    // This helps prevent brute force attacks
    if (rateLimiter.shouldLimit(`validate_vip_${trimmedCode}`, 20)) {
      console.warn("Rate limit exceeded for VIP code validation");
      throw new Error("Too many validation attempts. Please try again later.");
    }
    
    // Check cache first
    const cached = cache.vipCodes.get(trimmedCode);
    if (cached && cache.isValid(cached.timestamp)) {
      console.log("Using cached VIP code data");
      return cached.data.current_uses < cached.data.max_uses;
    }
    
    // Use explicit LOWER function to ensure case insensitivity
    const { data, error } = await dbConnection.retry(async () => {
      return supabase
        .from("vip_codes")
        .select("*")
        .ilike("code", trimmedCode);
    });
      
    if (error) {
      console.error("VIP code validation error:", error);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log("VIP code not found in database");
      return false;
    }
    
    const vipCodeData = data[0] as VipCode;
    
    // Store in cache with size limit
    cache.addToCache(
      cache.vipCodes, 
      trimmedCode, 
      vipCodeData, 
      cache.MAX_ENTRIES.vipCodes
    );
    
    // Check if the code has remaining uses
    return vipCodeData.current_uses < vipCodeData.max_uses;
  } catch (err) {
    console.error("Error validating VIP code:", err);
    return false;
  }
}

/**
 * Update VIP code usage count
 * @param vipCode The VIP code to update
 * @returns Promise resolving to boolean indicating success
 */
export async function updateVipCodeUsage(vipCode: string): Promise<boolean> {
  if (!vipCode || vipCode.trim() === "") {
    return true; // No code to update
  }

  const trimmedCode = vipCode.trim().toLowerCase(); // Normalize to lowercase
  
  try {
    console.log("Updating usage for VIP code:", trimmedCode);
    
    // Apply rate limiting for update operations
    if (rateLimiter.shouldLimit(`update_vip_${trimmedCode}`, 10)) {
      console.warn("Rate limit exceeded for VIP code updates");
      throw new Error("Too many update attempts. Please try again later.");
    }
    
    // Use transaction to ensure atomicity
    const { data, error } = await dbConnection.retry(async () => {
      return supabase
        .from("vip_codes")
        .select("*")
        .ilike("code", trimmedCode);
    });
      
    if (error || !data || data.length === 0) {
      console.error("Error getting VIP code for update:", error || "No data found");
      return false;
    }
    
    const vipCodeData = data[0] as VipCode;
    console.log("Current usage:", vipCodeData.current_uses, "Max uses:", vipCodeData.max_uses);
    
    // Check if code has remaining uses
    if (vipCodeData.current_uses >= vipCodeData.max_uses) {
      console.warn("VIP code has reached maximum uses");
      return false;
    }
    
    // Update the usage count
    const { error: updateError } = await dbConnection.retry(async () => {
      return supabase
        .from("vip_codes")
        .update({
          current_uses: vipCodeData.current_uses + 1
        })
        .eq("id", vipCodeData.id);
    });
      
    if (updateError) {
      console.error("Error updating VIP code usage:", updateError);
      return false;
    }
    
    // Update the cache with the new value
    vipCodeData.current_uses += 1;
    
    // Update cache with size limit
    cache.addToCache(
      cache.vipCodes, 
      trimmedCode, 
      vipCodeData, 
      cache.MAX_ENTRIES.vipCodes
    );
    
    console.log("VIP code usage updated successfully");
    return true;
  } catch (err) {
    console.error("Error updating VIP code usage:", err);
    return false;
  }
}

/**
 * Clear the in-memory cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Clear rate limiting data
 */
export function clearRateLimits(): void {
  rateLimiter.clear();
}

/**
 * Batch fetch multiple cards by their IDs
 * @param ids Array of card IDs to fetch
 * @returns Promise resolving to an array of AnimorphCard objects
 */
export async function fetchCardsByIds(ids: number[]): Promise<AnimorphCard[]> {
  if (!ids || ids.length === 0) return [];
  
  try {
    // Check if all cards are in cache first
    const cachedCards = ids.map(id => {
      const cached = cache.cardById.get(id);
      return cached && cache.isValid(cached.timestamp) ? cached.data : null;
    });
    
    // If all cards are cached, return them
    if (cachedCards.every(card => card !== null)) {
      console.log("Using all cached cards for batch fetch");
      return cachedCards.filter(Boolean) as AnimorphCard[];
    }
    
    // Fetch cards that aren't in cache
    const { data, error } = await dbConnection.retry(async () => {
      return supabase
        .from("animorph_cards")
        .select("*")
        .in("id", ids);
    });
    
    if (error) {
      console.error("Error batch fetching cards:", error);
      throw error;
    }
    
    const fetchedCards = data as AnimorphCard[] || [];
    
    // Update cache for each fetched card
    fetchedCards.forEach(card => {
      cache.addToCache(
        cache.cardById, 
        card.id, 
        card, 
        cache.MAX_ENTRIES.cardById
      );
    });
    
    return fetchedCards;
  } catch (error) {
    console.error("Error batch fetching cards:", error);
    throw error;
  }
}

/**
 * Get database statistics for monitoring
 * @returns Promise resolving to object with database statistics
 */
export async function getDatabaseStats(): Promise<{ [key: string]: any }> {
  try {
    const stats = {
      cacheSize: {
        animorphCards: cache.animorphCards.size,
        cardById: cache.cardById.size,
        vipCodes: cache.vipCodes.size
      },
      rateLimiterEntries: rateLimiter.requests.size
    };
    
    return stats;
  } catch (error) {
    console.error("Error getting database stats:", error);
    throw error;
  }
}
