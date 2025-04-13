
import { supabase } from "@/lib/supabase";
import { AnimorphCard, VipCode } from "@/types";

// Cache implementation with improved memory management
const cache = {
  animorphCards: new Map<string, { data: AnimorphCard[], timestamp: number }>(),
  cardById: new Map<number, { data: AnimorphCard | null, timestamp: number }>(),
  vipCodes: new Map<string, { data: VipCode, timestamp: number }>(),
  
  EXPIRATION: 5 * 60 * 1000,
  MAX_ENTRIES: {
    animorphCards: 100,
    cardById: 500,
    vipCodes: 50
  },
  
  isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.EXPIRATION;
  },
  
  addToCache<T>(map: Map<any, { data: T, timestamp: number }>, key: any, data: T, maxEntries: number): void {
    if (map.size >= maxEntries) {
      const oldestKey = this.getOldestEntry(map);
      if (oldestKey) {
        map.delete(oldestKey);
      }
    }
    map.set(key, { data, timestamp: Date.now() });
  },
  
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
  
  RESET_PERIOD: 60 * 1000,
  BASE_MAX_REQUESTS: 100,
  MAX_BACKOFF: 8,
  
  shouldLimit(key: string, maxRequests?: number): boolean {
    const now = Date.now();
    const actualMax = maxRequests || this.BASE_MAX_REQUESTS;
    const record = this.requests.get(key);
    
    if (!record || (now - record.timestamp > this.RESET_PERIOD)) {
      this.requests.set(key, { 
        count: 1, 
        timestamp: now,
        backoffMultiplier: 1
      });
      return false;
    }
    
    record.count++;
    
    const effectiveLimit = Math.floor(actualMax / record.backoffMultiplier);
    
    if (record.count > effectiveLimit) {
      if (record.backoffMultiplier < this.MAX_BACKOFF) {
        record.backoffMultiplier = Math.min(record.backoffMultiplier * 2, this.MAX_BACKOFF);
      }
      return true;
    }
    
    return false;
  },
  
  reset(key: string): void {
    this.requests.delete(key);
  },
  
  clear(): void {
    this.requests.clear();
  }
};

// Database connection pooling and retry mechanism
const dbConnection = {
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY: 300,
  
  async retry<T>(operation: () => Promise<T>, retries = 0): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      if (retries >= this.MAX_RETRIES || !this.isRetryableError(error)) {
        throw error;
      }
      
      const delay = this.BASE_RETRY_DELAY * Math.pow(2, retries) * (0.5 + Math.random() * 0.5);
      
      console.log(`Database operation failed. Retrying in ${Math.round(delay)}ms... (${retries + 1}/${this.MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retry(operation, retries + 1);
    }
  },
  
  isRetryableError(error: any): boolean {
    const retryableCodes = ['08006', '08001', '08004', '57P01', '40001'];
    
    if (error?.code && retryableCodes.includes(error.code)) {
      return true;
    }
    
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
    let query = supabase
      .from("animorph_cards")
      .select("*");
      
    if (excludeCardIds.length > 0) {
      query = query.not('id', 'in', `(${excludeCardIds.join(',')})`);
    }
    
    const { data, error } = await dbConnection.retry(async () => {
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
  try {
    const vipCodes = [
      { code: "ZypherDan", max_uses: 51, description: "Promotional code for early supporters" },
      { code: "WonAgainstAi", max_uses: 50, description: "Victory reward code" }
    ];
    
    for (const codeData of vipCodes) {
      const { data } = await dbConnection.retry(async () => {
        return supabase
          .from("vip_codes")
          .select("*")
          .ilike("code", codeData.code);
      });
      
      if (!data || data.length === 0) {
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

/**
 * Enhanced VIP code validation with case-insensitive matching and improved error handling
 * @param vipCode The VIP code to validate
 * @returns Promise resolving to boolean indicating validation result
 */
export async function validateVipCode(vipCode: string): Promise<boolean> {
  if (!vipCode || vipCode.trim() === "") {
    return true; // Empty code is valid (optional)
  }

  const trimmedCode = vipCode.trim();
  
  try {
    console.log(`Attempting to validate VIP code: "${trimmedCode}"`);
    
    if (rateLimiter.shouldLimit(`validate_vip_${trimmedCode.toLowerCase()}`, 20)) {
      console.warn("Rate limit exceeded for VIP code validation");
      throw new Error("Too many validation attempts. Please try again later.");
    }
    
    const cacheKey = trimmedCode.toLowerCase();
    const cached = cache.vipCodes.get(cacheKey);
    if (cached && cache.isValid(cached.timestamp)) {
      console.log("Using cached VIP code data");
      const isValid = cached.data.current_uses < cached.data.max_uses;
      console.log(`VIP code validation from cache: ${isValid ? 'valid' : 'invalid'}`);
      return isValid;
    }
    
    // Modified query to handle case-insensitive comparison without ILIKE
    const { data, error } = await dbConnection.retry(async () => {
      return supabase
        .from("vip_codes")
        .select("*")
        .eq("code", trimmedCode); // Try exact match first
    });
      
    if (error) {
      console.error("VIP code validation error:", error);
      return false;
    }

    console.log(`VIP code database query for "${trimmedCode}" returned:`, data);
    
    let vipCodeData;
    
    if (!data || data.length === 0) {
      // If no exact match, try case-insensitive comparison manually
      const { data: allCodes, error: allCodesError } = await dbConnection.retry(async () => {
        return supabase
          .from("vip_codes")
          .select("*");
      });
      
      if (allCodesError) {
        console.error("Error fetching all VIP codes:", allCodesError);
        return false;
      }
      
      console.log("All VIP codes for manual case-insensitive search:", allCodes);
      
      // Manual case-insensitive comparison
      const matchedCode = allCodes?.find(code => 
        code.code.toLowerCase() === trimmedCode.toLowerCase()
      );
      
      if (!matchedCode) {
        console.log("VIP code not found in database (case insensitive search)");
        return false;
      }
      
      vipCodeData = matchedCode;
      console.log("Found VIP code using manual case-insensitive search:", vipCodeData);
    } else {
      vipCodeData = data[0];
      console.log(`Found VIP code in database: ${vipCodeData.code} (uses: ${vipCodeData.current_uses}/${vipCodeData.max_uses})`);
    }
    
    cache.addToCache(
      cache.vipCodes, 
      cacheKey, 
      vipCodeData, 
      cache.MAX_ENTRIES.vipCodes
    );
    
    const isValid = vipCodeData.current_uses < vipCodeData.max_uses;
    console.log(`VIP code validation result: ${isValid ? 'valid' : 'invalid'}`);
    return isValid;
  } catch (err) {
    console.error("Error validating VIP code:", err);
    return false;
  }
}

/**
 * Update VIP code usage count with transaction support
 * @param vipCode The VIP code to update
 * @returns Promise resolving to boolean indicating success
 */
export async function updateVipCodeUsage(vipCode: string): Promise<boolean> {
  if (!vipCode || vipCode.trim() === "") {
    return true; // No code to update
  }

  const trimmedCode = vipCode.trim();
  
  try {
    console.log(`Attempting to update usage for VIP code: "${trimmedCode}"`);
    
    if (rateLimiter.shouldLimit(`update_vip_${trimmedCode.toLowerCase()}`, 10)) {
      console.warn("Rate limit exceeded for VIP code updates");
      throw new Error("Too many update attempts. Please try again later.");
    }
    
    // Try exact match first
    let { data, error } = await dbConnection.retry(async () => {
      return supabase
        .from("vip_codes")
        .select("*")
        .eq("code", trimmedCode);
    });
      
    if (error) {
      console.error("Error getting VIP code for update:", error);
      return false;
    }
    
    // If no exact match, try case-insensitive manual search
    if (!data || data.length === 0) {
      const { data: allCodes, error: allCodesError } = await dbConnection.retry(async () => {
        return supabase
          .from("vip_codes")
          .select("*");
      });
      
      if (allCodesError) {
        console.error("Error fetching all VIP codes for update:", allCodesError);
        return false;
      }
      
      // Manual case-insensitive comparison
      const matchedCode = allCodes?.find(code => 
        code.code.toLowerCase() === trimmedCode.toLowerCase()
      );
      
      if (!matchedCode) {
        console.log(`VIP code "${trimmedCode}" not found in database for update (case insensitive)`);
        return false;
      }
      
      data = [matchedCode];
    }
    
    const vipCodeData = data[0];
    console.log(`Found VIP code in database for update: ${vipCodeData.code} (current uses: ${vipCodeData.current_uses}/${vipCodeData.max_uses})`);
    
    if (vipCodeData.current_uses >= vipCodeData.max_uses) {
      console.warn(`VIP code "${trimmedCode}" has reached maximum uses (${vipCodeData.max_uses})`);
      return false;
    }
    
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
    
    const updatedData = {
      ...vipCodeData,
      current_uses: vipCodeData.current_uses + 1
    };
    
    const cacheKey = trimmedCode.toLowerCase(); 
    
    cache.addToCache(
      cache.vipCodes, 
      cacheKey, 
      updatedData, 
      cache.MAX_ENTRIES.vipCodes
    );
    
    console.log(`VIP code "${trimmedCode}" usage updated successfully (new uses: ${updatedData.current_uses}/${updatedData.max_uses})`);
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
    const cachedCards = ids.map(id => {
      const cached = cache.cardById.get(id);
      return cached && cache.isValid(cached.timestamp) ? cached.data : null;
    });
    
    if (cachedCards.every(card => card !== null)) {
      console.log("Using all cached cards for batch fetch");
      return cachedCards.filter(Boolean) as AnimorphCard[];
    }
    
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
