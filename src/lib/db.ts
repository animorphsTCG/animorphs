
import { supabase } from "@/integrations/supabase/client";
import { AnimorphCard } from "@/types";

export async function fetchAnimorphCards(limit: number = 200, offset: number = 0): Promise<AnimorphCard[]> {
  try {
    const { data, error } = await supabase
      .from("animorph_cards")
      .select("*")
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    
    return data as AnimorphCard[];
  } catch (error) {
    console.error("Error fetching animorph cards:", error);
    return [];
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
    
    if (error) throw error;
    
    // Shuffle and slice to get random subset
    return (data as AnimorphCard[])
      .sort(() => Math.random() - 0.5)
      .slice(0, size);
  } catch (error) {
    console.error("Error getting random deck:", error);
    return [];
  }
}

export async function fetchCardsByType(type: string, limit: number = 5): Promise<AnimorphCard[]> {
  try {
    const { data, error } = await supabase
      .from("animorph_cards")
      .select("*")
      .eq("animorph_type", type)
      .limit(limit);
      
    if (error) throw error;
    
    return data as AnimorphCard[];
  } catch (error) {
    console.error(`Error fetching ${type} cards:`, error);
    return [];
  }
}
