
import { supabase } from "@/integrations/supabase/client";
import { AnimorphCard } from "@/types";

export async function fetchAnimorphCards(limit: number = 1000, offset: number = 0): Promise<AnimorphCard[]> {
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
    
    return data as AnimorphCard[];
  } catch (error) {
    console.error("Error fetching animorph cards:", error);
    throw error;
  }
}

export async function getRandomDeck(size: number = 10, excludeCardIds: number[] = []): Promise<AnimorphCard[]> {
  try {
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
    
    // Shuffle and slice to get random subset
    return (data as AnimorphCard[])
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(size, data.length));
  } catch (error) {
    console.error("Error getting random deck:", error);
    throw error;
  }
}

export async function fetchCardsByType(type: string, limit: number = 5): Promise<AnimorphCard[]> {
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
    
    return data as AnimorphCard[] || [];
  } catch (error) {
    console.error(`Error fetching ${type} cards:`, error);
    throw error;
  }
}

export async function fetchCardById(id: number): Promise<AnimorphCard | null> {
  try {
    const { data, error } = await supabase
      .from("animorph_cards")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`No card found with id: ${id}`);
        return null;
      }
      console.error(`Error fetching card with id ${id}:`, error);
      throw error;
    }
    
    return data as AnimorphCard;
  } catch (error) {
    console.error(`Error fetching card with id ${id}:`, error);
    throw error;
  }
}

// Create or update VIP codes to ensure they are in the database
export async function ensureVipCodesExist() {
  try {
    const vipCodes = [
      { code: "ZypherDan", max_uses: 51, description: "Promotional code for early supporters" },
      { code: "WonAgainstAi", max_uses: 50, description: "Victory reward code" }
    ];
    
    for (const codeData of vipCodes) {
      // Check if code exists
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
